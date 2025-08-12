import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type User, type SignupData, type AppRole } from '@/lib/auth';

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signup: (userData: SignupData) => Promise<{ error?: AuthError }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user has existing session
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          // Validate the session
          const isValid = await authService.validateSession();
          if (isValid) {
            setUser(authService.getCurrentUser());
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.signin(email, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        return {};
      } else {
        return { error: { message: response.error || 'Login failed' } };
      }
    } catch (error) {
      return { error: { message: 'An unexpected error occurred' } };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await authService.signup(userData);
      
      if (response.success) {
        return {};
      } else {
        return { error: { message: response.error || 'Signup failed' } };
      }
    } catch (error) {
      return { error: { message: 'An unexpected error occurred' } };
    }
  };

  const logout = async () => {
    try {
      await authService.signout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};