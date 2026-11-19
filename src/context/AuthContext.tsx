import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types/auth';
import { AuthService } from '../services/auth/authService';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());

  const refreshUser = useCallback(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  useEffect(() => {
    const handleAuthChange = () => refreshUser();
    window.addEventListener('laison-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('laison-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshUser]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
      // Sedikit delay halus untuk nuansa autentikasi profesional
      await new Promise((res) => setTimeout(res, 200));

      const res = AuthService.login(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        success('Selamat Datang!', `Berhasil masuk sebagai ${res.user.name} (${res.user.roleLabel}).`);
        return { success: true };
      } else {
        error('Gagal Masuk', res.error || 'Autentikasi gagal.');
        return { success: false, error: res.error };
      }
    },
    [success, error]
  );

  const logout = useCallback(() => {
    const prevName = user?.name || 'Admin';
    AuthService.logout();
    setUser(null);
    info('Telah Keluar', `Sesi untuk ${prevName} telah diakhiri.`);
  }, [user, info]);

  const changePassword = useCallback(
    (oldPass: string, newPass: string) => {
      if (!user) return { success: false, error: 'Tidak ada sesi aktif.' };

      const res = AuthService.changePassword(user.username, oldPass, newPass);
      if (res.success) {
        success('Password Diperbarui', 'Kata sandi berhasil diubah.');
        return { success: true };
      } else {
        error('Gagal Mengubah Password', res.error || 'Terjadi kesalahan.');
        return { success: false, error: res.error };
      }
    },
    [user, success, error]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
