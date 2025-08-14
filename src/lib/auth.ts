// Manual Authentication Service
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  student_id?: string;
  employee_id?: string;
  role: AppRole;
  user_status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_active: boolean;
  email_verified: boolean;
}

export type AppRole = 'admin' | 'faculty' | 'student';

export interface SignupData {
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

export interface AuthResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  expires_at?: string;
  error?: string;
}

export interface SessionData {
  user: User;
  session_token: string;
  expires_at: string;
}

const SESSION_STORAGE_KEY = 'bracu_session';

class AuthService {
  private currentUser: User | null = null;
  private sessionToken: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Load session from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const sessionData: SessionData = JSON.parse(stored);
        
        // Check if session is expired
        if (new Date(sessionData.expires_at) > new Date()) {
          this.currentUser = sessionData.user;
          this.sessionToken = sessionData.session_token;
          this.setCurrentUserContext(sessionData.user.id);
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
      this.clearSession();
    }
  }

  // Save session to localStorage
  private saveToStorage(sessionData: SessionData) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  // Clear session from localStorage
  private clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUser = null;
    this.sessionToken = null;
    this.clearCurrentUserContext();
  }

  // Set current user context for RLS policies
  private async setCurrentUserContext(userId: string) {
    try {
      await supabase.rpc('set_session_context', { user_id: userId });
    } catch (error) {
      console.error('Error setting user context:', error);
    }
  }

  // Clear current user context
  private async clearCurrentUserContext() {
    try {
      await supabase.rpc('clear_session_context');
    } catch (error) {
      console.error('Error clearing user context:', error);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.sessionToken !== null;
  }

  // Sign up new user
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      // Map role from UI to database
      const role: AppRole = userData.role === 'university-staff' ? 'faculty' 
                          : userData.role === 'faculty' ? 'faculty'
                          : 'student';

      const { data, error } = await supabase.rpc('create_user', {
        user_email: userData.email,
        user_password: userData.password,
        user_full_name: `${userData.firstName} ${userData.lastName}`,
        user_department: userData.department,
        user_student_id: userData.studentId || null,
        user_employee_id: userData.employeeId || null,
        user_role: role
      });

      if (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Failed to create account' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Sign in user
  async signin(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        console.error('Signin error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success && data?.user && data?.session_token) {
        const user: User = data.user;
        const sessionData: SessionData = {
          user,
          session_token: data.session_token,
          expires_at: data.expires_at
        };

        this.currentUser = user;
        this.sessionToken = data.session_token;
        this.saveToStorage(sessionData);
        await this.setCurrentUserContext(user.id);

        return {
          success: true,
          user,
          session_token: data.session_token,
          expires_at: data.expires_at
        };
      } else {
        return { success: false, error: data?.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Sign out user
  async signout(): Promise<void> {
    try {
      if (this.sessionToken) {
        await supabase.rpc('logout_user', {
          token: this.sessionToken
        });
      }
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      this.clearSession();
    }
  }

  // Validate current session
  async validateSession(): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('validate_session', {
        token: this.sessionToken
      });

      if (error || !data?.success) {
        this.clearSession();
        return false;
      }

      if (data.user) {
        this.currentUser = data.user;
        await this.setCurrentUserContext(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      this.clearSession();
      return false;
    }
  }

  // Check if user has specific role
  hasRole(role: AppRole): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is faculty
  isFaculty(): boolean {
    return this.hasRole('faculty');
  }

  // Check if user is student
  isStudent(): boolean {
    return this.hasRole('student');
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Helper function for session context (to be added to database)
export const createSessionContextFunctions = `
-- Function to set session context for RLS
create or replace function public.set_session_context(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', user_id::text, true);
end;
$$;

-- Function to clear session context
create or replace function public.clear_session_context()
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', '', true);
end;
$$;
`;
