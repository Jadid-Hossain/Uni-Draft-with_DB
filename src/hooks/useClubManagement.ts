import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  location?: string;
  meeting_day?: string;
  meeting_time?: string;
  max_members?: number;
  requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  members_count?: number;
}

export interface CreateClubData {
  name: string;
  description: string;
  category: string;
  location?: string;
  meeting_day?: string;
  meeting_time?: string;
  max_members?: number;
  requirements?: string;
  contact_email?: string;
  contact_phone?: string;
}

export const useClubManagement = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clubs
  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_all_clubs_admin');
      
      if (error) throw error;
      
      setClubs(data || []);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  // Create new club
  const createClub = async (clubData: CreateClubData): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('create_club_admin', {
        _name: clubData.name,
        _description: clubData.description,
        _category: clubData.category,
        _created_by: user.id,
        _location: clubData.location || null,
        _meeting_day: clubData.meeting_day || null,
        _meeting_time: clubData.meeting_time || null,
        _max_members: clubData.max_members || null,
        _requirements: clubData.requirements || null,
        _contact_email: clubData.contact_email || null,
        _contact_phone: clubData.contact_phone || null
      });

      if (error) throw error;

      await fetchClubs(); // Refresh the clubs list
      return data;
    } catch (err) {
      console.error('Error creating club:', err);
      setError('Failed to create club');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update club
  const updateClub = async (clubId: string, clubData: CreateClubData, status?: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('update_club_admin', {
        _club_id: clubId,
        _name: clubData.name,
        _description: clubData.description,
        _category: clubData.category,
        _user_id: user.id,
        _location: clubData.location || null,
        _meeting_day: clubData.meeting_day || null,
        _meeting_time: clubData.meeting_time || null,
        _max_members: clubData.max_members || null,
        _requirements: clubData.requirements || null,
        _contact_email: clubData.contact_email || null,
        _contact_phone: clubData.contact_phone || null,
        _status: status || null
      });

      if (error) throw error;

      await fetchClubs(); // Refresh the clubs list
      return data;
    } catch (err) {
      console.error('Error updating club:', err);
      setError('Failed to update club');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve club
  const approveClub = async (clubId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('approve_club_admin', {
        _club_id: clubId,
        _admin_id: user.id
      });

      if (error) throw error;

      await fetchClubs(); // Refresh the clubs list
      return data;
    } catch (err) {
      console.error('Error approving club:', err);
      setError('Failed to approve club');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update club status
  const updateClubStatus = async (clubId: string, status: 'pending' | 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('update_club_status_admin', {
        _club_id: clubId,
        _status: status,
        _admin_id: user.id
      });

      if (error) throw error;

      await fetchClubs(); // Refresh the clubs list
      return data;
    } catch (err) {
      console.error('Error updating club status:', err);
      setError('Failed to update club status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete club
  const deleteClub = async (clubId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('delete_club_admin', {
        _club_id: clubId,
        _user_id: user.id
      });

      if (error) throw error;

      await fetchClubs(); // Refresh the clubs list
      return data;
    } catch (err) {
      console.error('Error deleting club:', err);
      setError('Failed to delete club');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load clubs on mount
  useEffect(() => {
    fetchClubs();
  }, []);

  return {
    clubs,
    loading,
    error,
    fetchClubs,
    createClub,
    updateClub,
    approveClub,
    updateClubStatus,
    deleteClub
  };
};

// Hook for active clubs (for regular users)
export const useActiveClubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveClubs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_active_clubs');
      
      if (error) throw error;
      
      setClubs(data || []);
    } catch (err) {
      console.error('Error fetching active clubs:', err);
      setError('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveClubs();
  }, []);

  return {
    clubs,
    loading,
    error,
    fetchActiveClubs
  };
};

// Hook for club membership
export const useClubMembership = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinClub = async (clubId: string, notes?: string): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('join_club', {
        _club_id: clubId,
        _user_id: user.id,
        _notes: notes || null
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error joining club:', err);
      setError('Failed to join club');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserMemberships = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_user_memberships', {
        _user_id: user.id
      });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching user memberships:', err);
      setError('Failed to fetch memberships');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    joinClub,
    getUserMemberships
  };
};
