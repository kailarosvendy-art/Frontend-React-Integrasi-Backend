import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, clearAuthToken, getAuthToken, SESSION_EXPIRED_EVENT, setAuthToken } from '../services/api';
import * as authService from '../services/authService';
import type { LoginInput, RegisterInput, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  sessionError: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();

    const handleSessionExpired = () => {
      setUser(null);
      setSessionError('Sesi berakhir. Silakan login kembali.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    if (!token) {
      setIsLoading(false);
    } else {
      authService.getCurrentUser()
        .then((currentUser) => {
          if (active) setUser(currentUser);
        })
        .catch((error: unknown) => {
          if (active && (!(error instanceof ApiError) || error.status !== 401)) {
            setSessionError(error instanceof Error ? error.message : 'Sesi tidak dapat diperiksa.');
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }

    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input);
    setAuthToken(result.token);
    setUser(result.user);
    setSessionError(null);
  }, []);

  const register = useCallback((input: RegisterInput) => authService.register(input), []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setSessionError(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, sessionError, login, register, logout }),
    [user, isLoading, sessionError, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
}
