import {UserProfile } from './user.types';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  acceptTerms: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  isAuthenticated?: boolean;
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  register: (credentials: RegisterCredentials) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}
