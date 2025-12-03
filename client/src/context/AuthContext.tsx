import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, UserRole } from '../types'; // Ensure UserRole is imported

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MIN_LOADING_TIME_MS = 750;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const processUserObject = (backendUser: any): User => {
    let roles: string[] = [];
    if (Array.isArray(backendUser.roles)) {
      roles = backendUser.roles;
    } else if (backendUser.role) {
      roles = [backendUser.role];
    }

    return {
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email || null,
        phone: backendUser.phone || null,
        // --- FIX: Cast strings to UserRole[] ---
        role: roles as UserRole[], 
        status: backendUser.status || 'active',
    };
  };

  const verifyAuth = useCallback(async () => {
    const startTime = Date.now();
    try {
        const response = await api.get('/auth/verify');
        const processedUser = processUserObject(response.data);
        setUser(processedUser);
    } catch (error) {
        setUser(null);
    } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_LOADING_TIME_MS - elapsedTime;
        if (remainingTime > 0) {
            setTimeout(() => setLoading(false), remainingTime);
        } else {
            setLoading(false);
        }
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = (username: string, password: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        setIsLoggingIn(true);
        const startTime = Date.now();

        try {
            await api.post('/auth/login', { username, password });
            
            // Immediately fetch the full user profile to ensure roles are correct
            const userResponse = await api.get('/auth/verify');
            const processedUser = processUserObject(userResponse.data);
            setUser(processedUser);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = MIN_LOADING_TIME_MS - elapsedTime;

            const completeTransition = () => {
                navigate('/', { replace: true });
                setIsLoggingIn(false);
                resolve();
            };

            if (remainingTime > 0) {
                setTimeout(completeTransition, remainingTime);
            } else {
                completeTransition();
            }
        } catch (error) {
            setIsLoggingIn(false);
            reject(error);
        }
    });
  };

  const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        console.error("Failed to logout on the server:", error);
    } finally {
        setUser(null);
        navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggingIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};