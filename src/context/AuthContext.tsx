// src/context/AuthContext.tsx
import React, {createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  AuthContextType,
  AuthProviderProps,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordData,
  UpdatePasswordData
} from '@/types/auth.types';
import {UserProfile } from '@/types/user.types';
import {auth, firestore } from '@/services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const initialAuthState: AuthState = {
  user: null,
  loading: true,
  error: null,
  initialized: false,
};

const AuthContext = createContext<AuthContextType>({
  ...initialAuthState,
  isAuthenticated: false,
  login: async () => {throw new Error('AuthContext not initialized'); },
  loginWithGoogle: async () => {throw new Error('AuthContext not initialized'); },
  register: async () => {throw new Error('AuthContext not initialized'); },
  logout: async () => {throw new Error('AuthContext not initialized'); },
  resetPassword: async () => {throw new Error('AuthContext not initialized'); },
  confirmPasswordReset: async () => {throw new Error('AuthContext not initialized'); },
  updatePassword: async () => {throw new Error('AuthContext not initialized'); },
  updateProfile: async () => {throw new Error('AuthContext not initialized'); },
  deleteAccount: async () => {throw new Error('AuthContext not initialized'); },
  clearError: () => {throw new Error('AuthContext not initialized'); },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  
  // superAdmins is stable as it's a constant array defined here.
  // If it were dynamic, it would need useMemo.
  const superAdmins = useMemo(() => ['egcharle@gmail.com'], []);

  const getUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const isSuperAdmin = firebaseUser.email ? superAdmins.includes(firebaseUser.email) : false;

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
  } else {
      const newUserProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || '',
        roles: {admin: isSuperAdmin, instructor: false, student: true, manager: false },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        uid: firebaseUser.uid,
        country: '',
        city: '',
        departmentId: ''
    };
      try {
        await setDoc(userDocRef, newUserProfile);
        return newUserProfile;
    } catch (profileError) {
        console.error("Error setting new user profile:", profileError);
        return null; // Or handle error appropriately
    }
  }
}, [superAdmins]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Optimistically set loading until profile is fetched/updated
        setAuthState(prev => ({...prev, loading: true, error: null }));
        try {
          const userProfile = await getUserProfile(firebaseUser);
          if (userProfile) {
            const isSuperAdminNow = firebaseUser.email ? superAdmins.includes(firebaseUser.email) : false;
            
            if (isSuperAdminNow && !userProfile.roles?.admin) {
              const userDocRef = doc(firestore, 'users', firebaseUser.uid);
              await updateDoc(userDocRef, {'roles.admin': true, updatedAt: new Date().toISOString() });
              const updatedProfile = await getUserProfile(firebaseUser); // Re-fetch to get the absolute latest
              setAuthState({user: updatedProfile, loading: false, error: null, initialized: true });
          } else {
              // If lastLoginAt is old, update it
              const now = new Date();
              const lastLogin = userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt) : new Date(0);
              // Update if last login was more than, say, 5 minutes ago, to avoid rapid updates on hot reloads
              if (now.getTime() - lastLogin.getTime() > 5 * 60 * 1000) {
                const userDocRef = doc(firestore, 'users', firebaseUser.uid);
                await updateDoc(userDocRef, {lastLoginAt: now.toISOString() });
                // Fetch again if you want the absolute latest, or merge optimistically
                 const updatedProfileWithLogin = {...userProfile, lastLoginAt: now.toISOString() };
                 setAuthState({user: updatedProfileWithLogin, loading: false, error: null, initialized: true });
            } else {
                 setAuthState({user: userProfile, loading: false, error: null, initialized: true });
            }
          }
        } else {
            setAuthState({user: null, loading: false, error: 'Failed to load user profile object.', initialized: true });
        }
      } catch (error: any) {
          console.error("AuthContext onAuthStateChanged error:", error);
          setAuthState({user: null, loading: false, error: 'Failed to process user profile: ' + error.message, initialized: true });
      }
    } else {
        setAuthState({user: null, loading: false, error: null, initialized: true });
    }
  });

    return () => unsubscribe();
}, [getUserProfile, superAdmins]); // getUserProfile depends on superAdmins

  const loginWithGoogle = useCallback(async (): Promise<UserProfile> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      const result = await signInWithPopup(auth, provider);
      const userProfile = await getUserProfile(result.user);

      if (!userProfile) throw new Error("Failed to retrieve profile after Google sign-in.");

      const userDocRef = doc(firestore, 'users', userProfile.id);
      await updateDoc(userDocRef, {lastLoginAt: new Date().toISOString() });
      const updatedProfile = {...userProfile, lastLoginAt: new Date().toISOString() };

      setAuthState({user: updatedProfile, loading: false, error: null, initialized: true });
      return updatedProfile;
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to login with Google';
      setAuthState(prev => ({...prev, user: null, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, [getUserProfile]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<UserProfile> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      const {email, password } = credentials;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await getUserProfile(userCredential.user);

      if (!userProfile) throw new Error("Failed to retrieve profile after email/password sign-in.");

      const userDocRef = doc(firestore, 'users', userProfile.id);
      await updateDoc(userDocRef, {lastLoginAt: new Date().toISOString() });
      const updatedProfile = {...userProfile, lastLoginAt: new Date().toISOString() };

      setAuthState({user: updatedProfile, loading: false, error: null, initialized: true });
      return updatedProfile;
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to login';
      setAuthState(prev => ({...prev, user: null, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, [getUserProfile]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<UserProfile> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      const {email, password, displayName, firstName, lastName, company, jobTitle } = credentials;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const isSuperAdmin = superAdmins.includes(email);

      const newUserProfile: UserProfile = {
        id: userCredential.user.uid,
        email,
        displayName: displayName || email.split('@')[0],
        firstName,
        lastName,
        company,
        jobTitle,
        roles: {admin: isSuperAdmin, instructor: false, student: true, manager: false },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        uid: userCredential.user.uid,
        country: '',
        city: '',
        departmentId: ''
    };
      const userDocRef = doc(firestore, 'users', newUserProfile.id);
      await setDoc(userDocRef, newUserProfile);
      setAuthState({user: newUserProfile, loading: false, error: null, initialized: true });
      return newUserProfile;
  } catch (error: any)      {
      const errorMessage = error.message || 'Failed to register';
      setAuthState(prev => ({...prev, user: null, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, [superAdmins]);

  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      await signOut(auth);
      setAuthState({user: null, loading: false, error: null, initialized: true });
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to logout';
      setAuthState(prev => ({...prev, user: null, loading: false, error: errorMessage })); // Ensure user is null on logout error too
      throw new Error(errorMessage);
  }
}, []);

  const resetPassword = useCallback(async (data: ResetPasswordData): Promise<void> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      await sendPasswordResetEmail(auth, data.email);
      setAuthState(prev => ({...prev, loading: false }));
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to send password reset email';
      setAuthState(prev => ({...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, []);

  const confirmPasswordReset = useCallback(async (code: string, newPassword: string): Promise<void> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      await firebaseConfirmPasswordReset(auth, code, newPassword);
      setAuthState(prev => ({...prev, loading: false }));
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to confirm password reset';
      setAuthState(prev => ({...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, []);

  const updatePassword = useCallback(async (data: UpdatePasswordData): Promise<void> => {
    setAuthState(prev => ({...prev, loading: true, error: null }));
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated for password update.');
    }
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, data.newPassword);
      setAuthState(prev => ({...prev, loading: false }));
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to update password';
      setAuthState(prev => ({...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const currentUser = authState.user;

    if (!currentUser) {
      const err = new Error('User not authenticated for profile update.');
      setAuthState(prev => ({...prev, user: null, loading: false, error: err.message, initialized: true }));
      throw err;
  }

    setAuthState(prev => ({...prev, loading: true, error: null }));

    try {
      const userDocRef = doc(firestore, 'users', currentUser.id);
      
      // Prepare the data to be sent to Firestore.
      // Only spread properties that are valid for UserProfile.
      // 'data' itself is Partial<UserProfile>, so it's already type-checked.
      const dataForFirestore: Partial<UserProfile> = 
        (typeof data === 'object' && data !== null ? data : {});
      
      // Only update if there's actually data to update, otherwise skip Firestore call
      if (Object.keys(dataForFirestore).length > 0) {
        await updateDoc(userDocRef, dataForFirestore);
    } else {
        // console.warn("updateProfile called with empty data. No Firestore update performed.");
    }
      
      // Create the updated user profile for the local state
      const updatedUserProfile: UserProfile = {
        ...currentUser,    // Start with the current user profile
        ...dataForFirestore // Apply all changes from 'data'
    };

      setAuthState({user: updatedUserProfile, loading: false, error: null, initialized: true });
      return updatedUserProfile;
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      setAuthState(prev => ({...prev, user: currentUser, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
  }
}, [authState.user]);

  const deleteAccount = useCallback(async (): Promise<void> => {
    // Get the current user from authState and Firebase auth *before* setting loading state
    const currentUserProfile = authState.user; // UserProfile from Firestore
    const currentFirebaseUser = auth.currentUser; // FirebaseUser from auth service

    if (!currentFirebaseUser) {
      const err = new Error('No Firebase user currently authenticated for account deletion.');
      setAuthState(prev => ({...prev, user: null, loading: false, error: err.message, initialized: true }));
      throw err;
  }
    // currentUserProfile might be null if Firestore sync is off, but currentFirebaseUser is the source of truth for auth deletion

    setAuthState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use ID from Firestore profile if available, otherwise fallback to Firebase auth UID
      // This is important if your Firestore 'id' field is the same as 'uid'
      const userIdForFirestore = currentUserProfile?.id || currentFirebaseUser.uid;
      const userDocRef = doc(firestore, 'users', userIdForFirestore);
      
      await deleteDoc(userDocRef); // Delete Firestore profile

      await deleteUser(currentFirebaseUser); // Delete Firebase auth user

      setAuthState({user: null, loading: false, error: null, initialized: true });
  } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete account';
      // If deletion fails, the user might still be partially authenticated or their Firestore doc might still exist.
      // Setting user to null is a safe default, but you might want more nuanced error handling.
      setAuthState(prev => ({...prev, user: null, loading: false, error: errorMessage, initialized: true }));
      throw new Error(errorMessage);
  }
}, [authState.user]); // Dependency on authState.user because it might be used to get the Firestore doc ID.
                        // auth.currentUser is not a reactive dependency for useCallback.

  const clearError = useCallback((): void => {
    setAuthState(prev => ({...prev, error: null }));
}, []);

  const contextValue = useMemo(() => {
    return {
      user: authState.user,
      loading: authState.loading,
      error: authState.error,
      initialized: authState.initialized,
      isAuthenticated: !!authState.user,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      confirmPasswordReset,
      updatePassword,
      updateProfile,
      deleteAccount,
      clearError,
  };
}, [
    authState, // Main dependency for user, loading, error, initialized, isAuthenticated
    login, loginWithGoogle, register, logout, resetPassword, 
    confirmPasswordReset, updatePassword, updateProfile, deleteAccount, clearError // Functions
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
}
  return context;
};