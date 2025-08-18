import { useState, useEffect } from "react";
import { supabase, type ClubMembershipApplication } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface CreateApplicationData {
  club_id: string;
  motivation: string;
  experience?: string;
  skills?: string;
  availability: string;
  expectations?: string;
  portfolio_file_path?: string;
  resume_file_path?: string;
  agreed_to_terms: boolean;
}

export function useClubApplication() {
  const [applications, setApplications] = useState<ClubMembershipApplication[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's applications
  const fetchUserApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Set user context for RLS if available
      try {
        await supabase.rpc("set_session_context", { user_id: user.id });
      } catch (contextError) {
        console.warn("Session context not available, continuing without it");
      }

      const { data, error } = await supabase
        .from("club_membership_application")
        .select(
          `
          *,
          clubs:club_id (
            id,
            name,
            description,
            cover_image_url
          )
        `
        )
        .eq("applicant_id", user.id)
        .order("application_date", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch applications"
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if user has already applied to a specific club
  const checkExistingApplication = async (clubId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Set user context for RLS if available
      try {
        await supabase.rpc("set_session_context", { user_id: user.id });
      } catch (contextError) {
        console.warn("Session context not available, continuing without it");
      }

      const { data, error } = await supabase
        .from("club_membership_application")
        .select("id")
        .eq("club_id", clubId)
        .eq("applicant_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error("Error checking existing application:", err);
      return false;
    }
  };

  // Create new application
  const createApplication = async (
    applicationData: CreateApplicationData
  ): Promise<ClubMembershipApplication> => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      // Set user context for RLS if available (optional)
      try {
        await supabase.rpc("set_session_context", { user_id: user.id });
      } catch (contextError) {
        // Ignore context errors, continue without it
      }

      // Check if user has already applied
      const hasExisting = await checkExistingApplication(
        applicationData.club_id
      );

      if (hasExisting) {
        throw new Error("You have already applied to this club");
      }

      // Prepare insert data
      const insertData = {
        ...applicationData,
        applicant_id: user.id,
        status: "pending" as const,
      };

      const { data, error } = await supabase
        .from("club_membership_application")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from database");
      }

      // Update local state
      setApplications((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit application";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update application status (for club admins)
  const updateApplicationStatus = async (
    applicationId: string,
    status: ClubMembershipApplication["status"],
    reviewNotes?: string
  ): Promise<ClubMembershipApplication> => {
    if (!user) throw new Error("User must be authenticated");

    try {
      setLoading(true);
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (reviewNotes) {
        updateData.review_notes = reviewNotes;
      }

      const { data, error } = await supabase
        .from("club_membership_application")
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? data : app))
      );
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update application";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw application
  const withdrawApplication = async (applicationId: string): Promise<void> => {
    if (!user) throw new Error("User must be authenticated");

    try {
      setLoading(true);
      const { error } = await supabase
        .from("club_membership_application")
        .update({
          status: "withdrawn" as const,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .eq("applicant_id", user.id); // Ensure user can only withdraw their own

      if (error) throw error;

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: "withdrawn" as const }
            : app
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to withdraw application";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get applications for a specific club (for club admins)
  const getClubApplications = async (
    clubId: string
  ): Promise<ClubMembershipApplication[]> => {
    try {
      setLoading(true);

      // Set user context for RLS if available
      if (user?.id) {
        try {
          await supabase.rpc("set_session_context", { user_id: user.id });
        } catch (contextError) {
          console.warn("Session context not available, continuing without it");
        }
      }

      const { data, error } = await supabase
        .from("club_membership_application")
        .select("*")
        .eq("club_id", clubId)
        .order("application_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch club applications";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplicationStatus,
    withdrawApplication,
    checkExistingApplication,
    getClubApplications,
    refetch: fetchUserApplications,
  };
}
