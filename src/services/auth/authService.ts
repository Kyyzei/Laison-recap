import { User, StoredUserAccount, AuthSession, LoginCredentials } from '../../types/auth';

const SESSION_KEY = 'laison_auth_session';
const USERS_KEY = 'laison_users_v2';

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'user-laison',
    username: 'laison',
    name: 'Administrator Laison',
    role: 'ADMIN',
    roleLabel: 'Super Admin',
    email: 'admin@laison.com',
    passwordHash: 'meterin',
    avatar: '👨‍💼',
  },
];

export class AuthService {
  /**
   * Mengambil daftar akun pengguna yang tersimpan di localStorage.
   */
  static getUsers(): StoredUserAccount[] {
    try {
      // Migrasi / pembersihan dari versi lama jika ada
      if (localStorage.getItem('laison_users_v1')) {
        localStorage.removeItem('laison_users_v1');
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }

      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }

      // Pastikan akun laison ada
      const hasLaison = parsed.some((u) => u.username.toLowerCase() === 'laison');
      if (!hasLaison) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }

      return parsed;
    } catch {
      return DEFAULT_USERS;
    }
  }

  /**
   * Menyimpan daftar akun pengguna.
   */
  static saveUsers(users: StoredUserAccount[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to storage:', e);
    }
  }

  /**
   * Mengambil sesi login aktif saat ini.
   */
  static getSession(): AuthSession | null {
    try {
      let raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        raw = sessionStorage.getItem(SESSION_KEY);
      }
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      if (!session || !session.user) return null;
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Mengambil data user yang sedang login.
   */
  static getCurrentUser(): User | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Memeriksa apakah pengguna sudah login.
   */
  static isAuthenticated(): boolean {
    return Boolean(this.getCurrentUser());
  }

  /**
   * Melakukan proses login.
   */
  static login(credentials: LoginCredentials): { success: boolean; user?: User; error?: string } {
    const { username, password, rememberMe = true } = credentials;
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Username dan password wajib diisi.' };
    }

    const users = this.getUsers();
    const targetUser = users.find((u) => u.username.toLowerCase() === cleanUser);

    if (!targetUser) {
      return { success: false, error: 'Username atau password yang Anda masukkan salah.' };
    }

    // Validasi kata sandi rahasia
    const isValidPassword = targetUser.passwordHash === cleanPass;

    if (!isValidPassword) {
      return { success: false, error: 'Username atau password yang Anda masukkan salah.' };
    }

    // Update lastLogin
    const now = new Date().toISOString();
    targetUser.lastLogin = now;
    this.saveUsers(users);

    const userProfile: User = {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      role: targetUser.role,
      roleLabel: targetUser.roleLabel,
      email: targetUser.email,
      avatar: targetUser.avatar,
      lastLogin: now,
    };

    const session: AuthSession = {
      user: userProfile,
      token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      loginAt: now,
      rememberMe,
    };

    try {
      const sessionStr = JSON.stringify(session);
      if (rememberMe) {
        localStorage.setItem(SESSION_KEY, sessionStr);
      } else {
        sessionStorage.setItem(SESSION_KEY, sessionStr);
      }
      window.dispatchEvent(new Event('laison-auth-changed'));
    } catch (e) {
      console.error('Error saving session:', e);
    }

    return { success: true, user: userProfile };
  }

  /**
   * Logout dan bersihkan sesi.
   */
  static logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('laison-auth-changed'));
    } catch (e) {
      console.error('Error during logout:', e);
    }
  }

  /**
   * Mengubah password admin/user.
   */
  static changePassword(
    username: string,
    oldPass: string,
    newPass: string
  ): { success: boolean; error?: string } {
    if (!newPass || newPass.length < 4) {
      return { success: false, error: 'Password baru minimal harus 4 karakter.' };
    }

    const users = this.getUsers();
    const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    const user = users[idx];
    const isOldValid = user.passwordHash === oldPass;

    if (!isOldValid) {
      return { success: false, error: 'Password lama tidak sesuai.' };
    }

    user.passwordHash = newPass;
    this.saveUsers(users);

    // Update session jika sedang login
    const session = this.getSession();
    if (session && session.user.username.toLowerCase() === username.toLowerCase()) {
      if (session.rememberMe) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }

    return { success: true };
  }

  /**
   * Reset akun dan password ke default bawaan.
   */
  static resetToDefault(): void {
    this.saveUsers(DEFAULT_USERS);
  }
}
