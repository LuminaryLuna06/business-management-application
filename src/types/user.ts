import type { User } from "firebase/auth";

/**
 * Represents the user data stored in Firestore
 */
export interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date | string;
  lastLoginAt?: Date | string;
  // Add any additional user fields you store in Firestore
}

/**
 * Extended user type that combines Firebase Auth User with our custom Firestore data
 */
export interface AppUser extends User {
  firestoreData?: FirestoreUser;
  isEmailUser: boolean;
  isGoogleUser: boolean;
}

/**
 * Auth context value type
 */
export interface AuthContextType {
  currentUser: AppUser | null;
  userLoggedIn: boolean;
  isEmailUser: boolean;
  isGoogleUser: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  isAuthenticated: boolean;
  // Add any additional auth methods you expose through the context
}
export type UserRole = "admin" | "staff";

export interface StaffUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
