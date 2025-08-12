import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface Profile {
  id: string
  full_name: string | null
  department: string | null
  student_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: AppRole
  created_at: string
}

export type AppRole = 'admin' | 'faculty' | 'student'

export interface Club {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  club_id: string | null
  title: string
  description: string | null
  start_at: string
  end_at: string
  location: string | null
  capacity: number | null
  status: 'scheduled' | 'cancelled' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  profile: Profile | null
  roles: AppRole[]
}