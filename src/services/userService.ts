import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {firestore } from './firebase';
import {UserProfile, UserRole } from '@/types/user.types';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
  }

    return userDoc.data() as UserProfile;
} catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
}
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
  }

    return querySnapshot.docs[0].data() as UserProfile;
} catch (error) {
    console.error('Error getting user by email:', error);
    return null;
}
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
}
};

/**
 * Get user's notification preferences
 */
export const getUserNotificationPreferences = async (userId: string): Promise<Record<string, boolean> | null> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
  }

    const userData = userDoc.data() as UserProfile;
    // Create a record of notification preferences
    if (!userData.preferences) {
      return null;
  }

    return {
      emailNotifications: userData.preferences.emailNotifications || false,
      pushNotifications: userData.preferences.pushNotifications || false,
      smsNotifications: userData.preferences.smsNotifications || false,
      darkMode: userData.preferences.darkMode || false
  };
} catch (error) {
    console.error('Error getting user notification preferences:', error);
    return null;
}
};

/**
 * Update user's notification preferences
 */
export const updateUserNotificationPreferences = async (
  userId: string,
  preferences: Record<string, boolean>
): Promise<void> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, {
      'preferences.emailNotifications': preferences.emailNotifications || false,
      'preferences.pushNotifications': preferences.pushNotifications || false,
      'preferences.smsNotifications': preferences.smsNotifications || false,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating user notification preferences:', error);
    throw error;
}
};

/**
 * Get all users
 */
export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        uid: doc.id,
    } as UserProfile;
  });
} catch (error) {
    console.error('Error getting users:', error);
    return [];
}
};

/**
 * Create a new user
 */
export const createUser = async (userData: Omit<UserProfile, 'uid'>): Promise<UserProfile> => {
  try {
    const timestamp = new Date().toISOString();
    const userRef = doc(collection(firestore, 'users'));

    const newUser = {
      ...userData,
      uid: userRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
  };

    await setDoc(userRef, newUser);

    return newUser as UserProfile;
} catch (error) {
    console.error('Error creating user:', error);
    throw error;
}
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await deleteDoc(userRef);
} catch (error) {
    console.error('Error deleting user:', error);
    throw error;
}
};

/**
 * Update user roles
 */
export const updateUserRoles = async (userId: string, roles: UserRole): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      roles,
      updatedAt: new Date().toISOString(),
  });
} catch (error) {
    console.error('Error updating user roles:', error);
    throw error;
}
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: keyof UserRole): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where(`roles.${role}`, '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        uid: doc.id,
    } as UserProfile;
  });
} catch (error) {
    console.error(`Error getting users by role ${role}:`, error);
    return [];
}
};

/**
 * Bulk update users
 */
export const bulkUpdateUsers = async (userIds: string[], updates: Partial<UserProfile>): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    const batch = writeBatch(firestore);

    userIds.forEach(userId => {
      const userRef = doc(firestore, 'users', userId);
      batch.update(userRef, {
        ...updates,
        updatedAt: timestamp,
    });
  });

    await batch.commit();
} catch (error) {
    console.error('Error bulk updating users:', error);
    throw error;
}
};

/**
 * Import users from CSV or JSON
 */
export const importUsers = async (users: Partial<UserProfile>[]): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    const batch = writeBatch(firestore);

    users.forEach(userData => {
      const userRef = doc(collection(firestore, 'users'));
      batch.set(userRef, {
        ...userData,
        uid: userRef.id,
        createdAt: timestamp,
        updatedAt: timestamp,
    });
  });

    await batch.commit();
} catch (error) {
    console.error('Error importing users:', error);
    throw error;
}
};
