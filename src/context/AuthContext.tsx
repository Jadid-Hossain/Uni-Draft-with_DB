import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, type Profile, type AppRole } from '@/lib/supabase';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  studentId?: string;
  employeeId?: string;
  agreeToTerms: boolean;
}

interface User {
  id: string;
  email: string;
  profile?: Profile;
  role?: AppRole;
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

  // Fetch user profile and role
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Get user role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .single();

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: profile || undefined,
        role: userRole?.role || undefined
      };

      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
      });
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserData(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await fetchUserData(data.user);
      }

      return {};
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: `${userData.firstName} ${userData.lastName}`,
            department: userData.department,
            student_id: userData.studentId,
            role: userData.role,
          }
        }
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: `${userData.firstName} ${userData.lastName}`,
            department: userData.department,
            student_id: userData.studentId,
          });

        // Assign role
        const role: AppRole = userData.role === 'university-staff' ? 'faculty' 
                            : userData.role === 'club-admin' ? 'admin' 
                            : 'student';

        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role,
          });
      }

      return {};
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
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