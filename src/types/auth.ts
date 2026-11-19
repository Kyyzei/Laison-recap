export type UserRole = 'ADMIN' | 'TEKNISI';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  email?: string;
  avatar?: string;
  lastLogin?: string;
}

export interface StoredUserAccount extends User {
  passwordHash: string; // Plain/Base64 hash for standalone client storage
}

export interface AuthSession {
  user: User;
  token: string;
  loginAt: string;
  rememberMe: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}
