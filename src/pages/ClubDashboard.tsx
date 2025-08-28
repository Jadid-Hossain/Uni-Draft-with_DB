import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Plus,
  MapPin,
  Clock,
  UserPlus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ClubMember {
  id: string;
  applicant_id?: string;
  user_id?: string;
  club_id: string;
  status: "pending" | "approved" | "rejected";
  application_date: string;
  user: {
    full_name: string;
    email: string;
    student_id: string;
    department: string;
  };
}

interface ClubEvent {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
}

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  created_by: string;
}

const ClubDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingClub, setSavingClub] = useState(false);

  // Event creation/editing form
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    capacity: 50,
    status: "upcoming" as "upcoming" | "ongoing" | "completed" | "cancelled",
  });

  // Club settings form
  const [clubForm, setClubForm] = useState({
    name: "",
    description: "",
    category: "",
    is_public: true,
  });

  // New club creation form
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [newClubForm, setNewClubForm] = useState({
    name: "",
    description: "",
    category: "",
    is_public: true,
    club_details: "",
    panel_members: "",
    previous_events: "",
    achievements: "",
    departments: "",
    website: "",
    social_media: "",
    founded_date: "",
    mission_statement: "",
    vision_statement: "",
    address: "",
    meeting_day: "",
    meeting_time: "",
    max_members: "",
    requirements: "",
    contact_email: "",
    club_mail: "",
    contact_phone: "",
    location: "",
  });

  const isSuperAdmin = user?.role === "admin";

  // Fetch clubs where the user is the creator or assigned admin
  const fetchUserClubs = async () => {
    try {
      let query;

      if (isSuperAdmin) {
        // Superadmin can see all clubs
        query = supabase.from("clubs").select("*");
        console.log("Superadmin: fetching all clubs");
      } else {
        // Regular users can see clubs they created OR clubs they're assigned as admin
        if (user.club_admin) {
          // User has a club admin assignment
          console.log("User has club admin assignment:", user.club_admin);
          query = supabase
            .from("clubs")
            .select("*")
            .or(`created_by.eq.${user.id},id.eq.${user.club_admin}`);
        } else {
          // User only has clubs they created
          console.log("User fetching clubs they created");
          query = supabase.from("clubs").select("*").eq("created_by", user.id);
        }
      }

      console.log(
        "Executing query for user:",
        user.id,
        "club_admin:",
        user.club_admin
      );
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching clubs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your clubs",
          variant: "destructive",
        });
        return;
      }

      setClubs(data || []);
      if (data && data.length > 0) {
        const firstClub = data[0];
        setSelectedClub(firstClub);
        setClubForm({
          name: firstClub.name || "",
          description: firstClub.description || "",
          category: firstClub.category || "",
          is_public: firstClub.is_public ?? true,
        });
        fetchClubMembers(firstClub.id);
        fetchClubEvents(firstClub.id);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch club members
  const fetchClubMembers = async (clubId: string) => {
    try {
      console.log("Fetching members for club:", clubId);

      // First, fetch the applications without the join
      const { data: applications, error: applicationsError } = await supabase
        .from("club_membership_application")
        .select("*")
        .eq("club_id", clubId);

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        return;
      }

      console.log("Raw applications found:", applications);

      // If we have applications, fetch user details for each one
      if (applications && applications.length > 0) {
        const membersWithUserData = await Promise.all(
          applications.map(async (app) => {
            try {
              const userId = app.user_id || app.applicant_id;
              if (!userId) {
                return {
                  ...app,
                  user: {
                    full_name: "Unknown User",
                    email: "unknown@example.com",
                    student_id: "N/A",
                    department: "N/A",
                  },
                };
              }

              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("full_name, email, student_id, department")
                .eq("id", userId)
                .single();

              if (userError || !userData) {
                console.warn(
                  "Could not fetch user data for:",
                  userId,
                  userError
                );
                // Return application with placeholder user data
                return {
                  ...app,
                  user: {
                    full_name: "Unknown User",
                    email: "unknown@example.com",
                    student_id: "N/A",
                    department: "N/A",
                  },
                };
              }

              return {
                ...app,
                user: userData,
              };
            } catch (userErr) {
              console.warn("Error fetching user data:", userErr);
              return {
                ...app,
                user: {
                  full_name: "Unknown User",
                  email: "unknown@example.com",
                  student_id: "N/A",
                  department: "N/A",
                },
              };
            }
          })
        );

        console.log("Members with user data:", membersWithUserData);
        setMembers(membersWithUserData);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error in fetchClubMembers:", error);
      setMembers([]);
    }
  };

  // Fetch club events
  const fetchClubEvents = async (clubId: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("club_id", clubId)
        .order("start_at", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handle club selection
  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setClubForm({
      name: club.name || "",
      description: club.description || "",
      category: club.category || "",
      is_public: club.is_public ?? true,
    });
    fetchClubMembers(club.id);
    fetchClubEvents(club.id);
  };

  // Update club
  const handleUpdateClub = async () => {
    if (!selectedClub) return;
    try {
      setSavingClub(true);
      const { error } = await supabase
        .from("clubs")
        .update({
          name: clubForm.name.trim(),
          description: clubForm.description.trim(),
          category: clubForm.category.trim(),
          is_public: clubForm.is_public,
        })
        .eq("id", selectedClub.id);

      if (error) {
        console.error("Error updating club:", error);
        toast({
          title: "Update failed",
          description: "Could not update club",
          variant: "destructive",
        });
        return;
      }

      // Reflect changes locally
      const updated: Club = { ...selectedClub, ...clubForm } as Club;
      setSelectedClub(updated);
      setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast({
        title: "Club updated",
        description: "Your changes have been saved",
      });
    } catch (e) {
      console.error("Error updating club:", e);
      toast({
        title: "Update failed",
        description: "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSavingClub(false);
    }
  };

  // Create new club
  const handleCreateClub = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Not allowed",
        description: "Only superadmin can create clubs",
        variant: "destructive",
      });
      return;
    }
    if (
      !newClubForm.name.trim() ||
      !newClubForm.description.trim() ||
      !newClubForm.category
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("clubs")
        .insert({
          name: newClubForm.name.trim(),
          description: newClubForm.description.trim(),
          category: newClubForm.category,
          is_public: newClubForm.is_public,
          club_details: newClubForm.club_details.trim() || null,
          panel_members: newClubForm.panel_members.trim() || null,
          previous_events: newClubForm.previous_events.trim() || null,
          achievements: newClubForm.achievements.trim() || null,
          departments: newClubForm.departments.trim() || null,
          website: newClubForm.website.trim() || null,
          social_media: newClubForm.social_media.trim() || null,
          founded_date: newClubForm.founded_date || null,
          mission_statement: newClubForm.mission_statement.trim() || null,
          vision_statement: newClubForm.vision_statement.trim() || null,
          address: newClubForm.address.trim() || null,
          meeting_day: newClubForm.meeting_day || null,
          meeting_time: newClubForm.meeting_time || null,
          max_members: newClubForm.max_members ? parseInt(newClubForm.max_members) : null,
          requirements: newClubForm.requirements.trim() || null,
          contact_email: newClubForm.contact_email.trim() || null,
          club_mail: newClubForm.club_mail.trim() || null,
          contact_phone: newClubForm.contact_phone.trim() || null,
          location: newClubForm.location.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating club:", error);
        toast({
          title: "Creation failed",
          description: "Could not create club",
          variant: "destructive",
        });
        return;
      }

      // Add to clubs list and select it
      const newClub = { ...data, created_by: user.id } as Club;
      setClubs((prev) => [newClub, ...prev]);
      setSelectedClub(newClub);
      setClubForm({
        name: newClub.name || "",
        description: newClub.description || "",
        category: newClub.category || "",
        is_public: newClub.is_public ?? true,
      });

      // Reset form and close modal
      setNewClubForm({
        name: "",
        description: "",
        category: "",
        is_public: true,
        club_details: "",
        panel_members: "",
        previous_events: "",
        achievements: "",
        departments: "",
        website: "",
        social_media: "",
        founded_date: "",
        mission_statement: "",
        vision_statement: "",
        address: "",
        meeting_day: "",
        meeting_time: "",
        max_members: "",
        requirements: "",
        contact_email: "",
        club_mail: "",
        contact_phone: "",
        location: "",
      });
      setShowCreateClubForm(false);

      // Fetch members and events for the new club
      fetchClubMembers(newClub.id);
      fetchClubEvents(newClub.id);

      toast({
        title: "Club created",
        description: `${newClub.name} has been created successfully`,
      });
    } catch (e) {
      console.error("Error creating club:", e);
      toast({
        title: "Creation failed",
        description: "Unexpected error",
        variant: "destructive",
      });
    }
  };

  // Delete club (and related data)
  const handleDeleteClub = async () => {
    if (!selectedClub) return;
    const confirmDelete = confirm(
      "This will delete the club, its events and applications. Continue?"
    );
    if (!confirmDelete) return;
    try {
      // Best-effort cleanup of related rows first
      await supabase.from("events").delete().eq("club_id", selectedClub.id);
      await supabase
        .from("club_membership_application")
        .delete()
        .eq("club_id", selectedClub.id);
      const { error } = await supabase
        .from("clubs")
        .delete()
        .eq("id", selectedClub.id);
      if (error) {
        console.error("Error deleting club:", error);
        toast({
          title: "Delete failed",
          description: "Could not delete club",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Club deleted",
        description: `${selectedClub.name} has been removed`,
      });
      // Refresh state
      const remaining = clubs.filter((c) => c.id !== selectedClub.id);
      setClubs(remaining);
      setSelectedClub(remaining[0] ?? null);
    } catch (e) {
      console.error("Error deleting club:", e);
      toast({
        title: "Delete failed",
        description: "Unexpected error",
        variant: "destructive",
      });
    }
  };

  // Approve/reject member application
  const handleMemberAction = async (
    memberId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const { error } = await supabase
        .from("club_membership_application")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", memberId);

      if (error) {
        console.error("Error updating member status:", error);
        toast({
          title: "Error",
          description: "Failed to update member status",
          variant: "destructive",
        });
        return;
      }

      // Refresh members list
      if (selectedClub) {
        fetchClubMembers(selectedClub.id);
      }

      toast({
        title: "Success",
        description: `Member ${
          action === "approve" ? "approved" : "rejected"
        } successfully`,
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Delete member application
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the club?"))
      return;

    try {
      const { error } = await supabase
        .from("club_membership_application")
        .delete()
        .eq("id", memberId);

      if (error) {
        console.error("Error deleting member:", error);
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive",
        });
        return;
      }

      // Refresh members list
      if (selectedClub) {
        fetchClubMembers(selectedClub.id);
      }

      toast({
        title: "Success",
        description: "Member removed from club successfully",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Send notification to club members
  const sendEventNotificationToClubMembers = async (
    eventData: any,
    clubId: string
  ) => {
    try {
      console.log(
        "Sending notification to club members for event:",
        eventData.title
      );

      // Fetch all approved club members
      const { data: applications, error: applicationsError } = await supabase
        .from("club_membership_application")
        .select("applicant_id")
        .eq("club_id", clubId)
        .eq("status", "approved");

      if (applicationsError) {
        console.error("Error fetching club members:", applicationsError);
        return;
      }

      if (!applications || applications.length === 0) {
        console.log("No approved members found for club:", clubId);
        return;
      }

      // Get club name for notification
      const { data: clubData } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", clubId)
        .single();

      const clubName = clubData?.name || "Unknown Club";

      // Prepare notification message
      const notificationMessage = `New event "${
        eventData.title
      }" has been created in ${clubName}! 📅 Event starts on ${new Date(
        eventData.start_at
      ).toLocaleDateString()} at ${
        eventData.location || "TBA"
      }. Don't miss out!`;

      // Send notification to each member
      const notifications = applications.map((app) => {
        return {
          user_id: app.applicant_id,
          message: notificationMessage,
          type: "event_created",
          related_id: eventData.id,
          created_at: new Date().toISOString(),
          is_read: false,
        };
      });

      // Batch insert notifications
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Error sending notifications:", notificationError);
      } else {
        console.log(
          `Successfully sent ${notifications.length} notifications for event: ${eventData.title}`
        );
      }
    } catch (error) {
      console.error("Error in sendEventNotificationToClubMembers:", error);
    }
  };

  // Create new event
  const handleCreateEvent = async () => {
    if (!selectedClub) return;

    try {
      const startDateTime = new Date(
        `${eventForm.start_date}T${eventForm.start_time}`
      );
      const endDateTime = new Date(
        `${eventForm.end_date}T${eventForm.end_time}`
      );

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: eventForm.title,
          description: eventForm.description,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          location: eventForm.location,
          capacity: eventForm.capacity,
          status: eventForm.status,
          club_id: selectedClub.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating event:", error);
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive",
        });
        return;
      }

      // Send notification to club members
      await sendEventNotificationToClubMembers(data, selectedClub.id);

      // Refresh events list
      fetchClubEvents(selectedClub.id);

      // Reset form
      setEventForm({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        location: "",
        capacity: 50,
        status: "upcoming",
      });
      setShowEventForm(false);

      toast({
        title: "Success",
        description:
          "Event created successfully and notification sent to club members",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
        return;
      }

      // Refresh events list
      if (selectedClub) {
        fetchClubEvents(selectedClub.id);
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Edit event handler
  const handleEditEvent = (event: ClubEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      start_date: event.start_at.split("T")[0], // Extract date part
      start_time: event.start_at.split("T")[1]?.split(".")[0] || "", // Extract time part
      end_date: event.end_at.split("T")[0], // Extract date part
      end_time: event.end_at.split("T")[1]?.split(".")[0] || "", // Extract time part
      location: event.location,
      capacity: event.capacity,
      status: event.status,
    });
    setShowEventForm(true);
  };

  // Update event
  const handleUpdateEvent = async () => {
    if (!editingEvent || !selectedClub) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .update({
          title: eventForm.title,
          description: eventForm.description,
          start_at: `${eventForm.start_date}T${eventForm.start_time}`,
          end_at: `${eventForm.end_date}T${eventForm.end_time}`,
          location: eventForm.location,
          capacity: eventForm.capacity,
          status: eventForm.status,
        })
        .eq("id", editingEvent.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating event:", error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
        return;
      }

      // Refresh events list
      fetchClubEvents(selectedClub.id);

      // Reset form and editing state
      setEventForm({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        location: "",
        capacity: 50,
        status: "upcoming",
      });
      setEditingEvent(null);
      setShowEventForm(false);

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEventForm({
      title: "",
      description: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      location: "",
      capacity: 50,
      status: "upcoming",
    });
    setShowEventForm(false);
  };

  useEffect(() => {
    if (user?.id) {
      console.log("User authenticated, fetching clubs. User:", {
        id: user.id,
        role: user.role,
        club_admin: user.club_admin,
      });
      fetchUserClubs();
    } else {
      console.log("No user authenticated");
    }
  }, [user]);

  useEffect(() => {
    if (selectedClub) {
      fetchClubMembers(selectedClub.id);
      fetchClubEvents(selectedClub.id);
    }
  }, [selectedClub]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your clubs...</p>
        </div>
      </div>
    );
  }

  // Access control: only superadmin or users who manage at least one club
  if (!isSuperAdmin && clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center max-w-md">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to access the Club Dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Clubs Found</h2>
          <p className="text-muted-foreground mb-4">
            You haven't created any clubs yet. Create a club to get started!
          </p>
          {isSuperAdmin && (
            <Button onClick={() => setShowCreateClubForm(true)}>
              Create Your First Club
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Club Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your clubs, members, and events
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setShowCreateClubForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Club
          </Button>
        )}
      </div>

      {/* Club Selection */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {clubs.map((club) => (
          <Button
            key={club.id}
            variant={selectedClub?.id === club.id ? "default" : "outline"}
            onClick={() => handleClubSelect(club)}
            className="whitespace-nowrap"
          >
            {club.name}
          </Button>
        ))}
        {isSuperAdmin && (
          <Button
            variant="outline"
            onClick={() => setShowCreateClubForm(true)}
            className="whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Club
          </Button>
        )}
      </div>

      {selectedClub && (
        <div className="space-y-6">
          {/* Club Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedClub.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                {selectedClub.description}
              </p>
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">{selectedClub.category}</Badge>
                <Badge variant={selectedClub.is_public ? "default" : "outline"}>
                  {selectedClub.is_public ? "Public" : "Private"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Events ({events.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Club Members</h3>
                <Badge variant="outline">
                  {members.filter((m) => m.status === "approved").length}{" "}
                  Approved
                </Badge>
              </div>

              <div className="grid gap-4">
                {members.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No members have applied yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {member.user.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                            <div className="flex gap-2 mt-2 text-xs">
                              <Badge variant="outline">
                                ID: {member.user.student_id}
                              </Badge>
                              <Badge variant="outline">
                                {member.user.department}
                              </Badge>
                              <Badge
                                variant={
                                  member.status === "approved"
                                    ? "default"
                                    : member.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {member.status.charAt(0).toUpperCase() +
                                  member.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {member.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleMemberAction(member.id, "approve")
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleMemberAction(member.id, "reject")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Club Events</h3>
                <Button onClick={() => setShowEventForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {/* Event Creation/Editing Form */}
              {showEventForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingEvent ? "Edit Event" : "Create New Event"}
                    </CardTitle>
                    <CardDescription>
                      {editingEvent
                        ? "Update event information"
                        : "Fill in the details to create a new event"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Event Title"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Location"
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            location: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={eventForm.start_date}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            start_date: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="time"
                        value={eventForm.start_time}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            start_time: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={eventForm.end_date}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            end_date: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="time"
                        value={eventForm.end_time}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            end_time: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Capacity"
                        value={eventForm.capacity}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            capacity: parseInt(e.target.value),
                          })
                        }
                      />
                      <Select
                        value={eventForm.status}
                        onValueChange={(
                          value:
                            | "upcoming"
                            | "ongoing"
                            | "completed"
                            | "cancelled"
                        ) => setEventForm({ ...eventForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Event Description"
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={
                          editingEvent ? handleUpdateEvent : handleCreateEvent
                        }
                      >
                        {editingEvent ? "Update Event" : "Create Event"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={
                          editingEvent
                            ? handleCancelEdit
                            : () => setShowEventForm(false)
                        }
                      >
                        {editingEvent ? "Cancel Edit" : "Cancel"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Events List */}
              <div className="grid gap-4">
                {events.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No events created yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {event.title}
                            </h4>
                            <p className="text-muted-foreground mb-3">
                              {event.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(
                                    event.start_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(
                                    event.start_at
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{event.capacity} capacity</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Badge
                                variant={
                                  event.status === "upcoming"
                                    ? "default"
                                    : event.status === "ongoing"
                                    ? "secondary"
                                    : event.status === "completed"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {event.status.charAt(0).toUpperCase() +
                                  event.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Club</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="club-name">Name</Label>
                      <Input
                        id="club-name"
                        placeholder="Club Name"
                        value={clubForm.name}
                        onChange={(e) =>
                          setClubForm({ ...clubForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="club-category">Category</Label>
                      <Select
                        value={clubForm.category}
                        onValueChange={(value) =>
                          setClubForm({ ...clubForm, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Academic",
                            "Cultural",
                            "Sports",
                            "Technology",
                            "Arts",
                            "Community Service",
                            "Professional Development",
                            "Hobby",
                            "Other",
                          ].map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="club-desc">Description</Label>
                      <Textarea
                        id="club-desc"
                        placeholder="Describe your club..."
                        rows={4}
                        value={clubForm.description}
                        onChange={(e) =>
                          setClubForm({
                            ...clubForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="club-public"
                        checked={clubForm.is_public}
                        onCheckedChange={(val) =>
                          setClubForm({ ...clubForm, is_public: !!val })
                        }
                      />
                      <Label htmlFor="club-public">Public club</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateClub} disabled={savingClub}>
                      {savingClub ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteClub}>
                      Delete Club
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create New Club Modal */}
      {isSuperAdmin && showCreateClubForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Club</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateClubForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-club-name">Club Name *</Label>
                  <Input
                    id="new-club-name"
                    placeholder="Enter club name"
                    value={newClubForm.name}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-club-category">Category *</Label>
                  <Select
                    value={newClubForm.category}
                    onValueChange={(value) =>
                      setNewClubForm({ ...newClubForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Academic",
                        "Cultural",
                        "Sports",
                        "Technology",
                        "Arts",
                        "Community Service",
                        "Professional Development",
                        "Hobby",
                        "Other",
                      ].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="new-club-desc">Description *</Label>
                  <Textarea
                    id="new-club-desc"
                    placeholder="Describe your club's purpose and activities..."
                    rows={4}
                    value={newClubForm.description}
                    onChange={(e) =>
                      setNewClubForm({
                        ...newClubForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="new-club-public"
                    checked={newClubForm.is_public}
                    onCheckedChange={(val) =>
                      setNewClubForm({ ...newClubForm, is_public: !!val })
                    }
                  />
                  <Label htmlFor="new-club-public">Public club</Label>
                </div>
              </div>

              {/* Additional Club Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-club-address">Club Address</Label>
                    <Input
                      id="new-club-address"
                      placeholder="e.g., 123 University Ave, City, Country"
                      value={newClubForm.address}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-club-location">Meeting Location</Label>
                    <Input
                      id="new-club-location"
                      placeholder="e.g., Room 201, Main Building"
                      value={newClubForm.location}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-club-meeting-day">Meeting Day</Label>
                    <Select
                      value={newClubForm.meeting_day}
                      onValueChange={(value) =>
                        setNewClubForm({ ...newClubForm, meeting_day: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting day" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-club-meeting-time">Meeting Time</Label>
                    <Input
                      id="new-club-meeting-time"
                      placeholder="e.g., 3:00 PM - 5:00 PM"
                      value={newClubForm.meeting_time}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, meeting_time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-club-contact-email">Contact Email</Label>
                    <Input
                      id="new-club-contact-email"
                      type="email"
                      placeholder="club@university.edu"
                      value={newClubForm.contact_email}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, contact_email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-club-club-mail">Club Mail</Label>
                    <Input
                      id="new-club-club-mail"
                      type="email"
                      placeholder="club.official@university.edu"
                      value={newClubForm.club_mail}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, club_mail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-club-contact-phone">Contact Phone</Label>
                    <Input
                      id="new-club-contact-phone"
                      placeholder="+880 1234-567890"
                      value={newClubForm.contact_phone}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, contact_phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-club-max-members">Maximum Members</Label>
                    <Input
                      id="new-club-max-members"
                      type="number"
                      placeholder="e.g., 50"
                      value={newClubForm.max_members}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, max_members: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-requirements">Requirements</Label>
                  <Textarea
                    id="new-club-requirements"
                    placeholder="Any prerequisites or requirements for joining"
                    rows={3}
                    value={newClubForm.requirements}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, requirements: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-details">Club Details (Extended Description)</Label>
                  <Textarea
                    id="new-club-details"
                    placeholder="Provide detailed information about the club's activities, goals, and structure..."
                    rows={4}
                    value={newClubForm.club_details}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, club_details: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-mission">Mission Statement</Label>
                  <Textarea
                    id="new-club-mission"
                    placeholder="What is the club's mission and purpose?"
                    rows={3}
                    value={newClubForm.mission_statement}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, mission_statement: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-vision">Vision Statement</Label>
                  <Textarea
                    id="new-club-vision"
                    placeholder="What is the club's vision for the future?"
                    rows={3}
                    value={newClubForm.vision_statement}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, vision_statement: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-club-website">Club Website</Label>
                    <Input
                      id="new-club-website"
                      type="url"
                      placeholder="https://club-website.com"
                      value={newClubForm.website}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, website: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-club-founded">Founded Date</Label>
                    <Input
                      id="new-club-founded"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={newClubForm.founded_date}
                      onChange={(e) =>
                        setNewClubForm({ ...newClubForm, founded_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-departments">Club Departments/Teams</Label>
                  <Textarea
                    id="new-club-departments"
                    placeholder="List the main departments or teams within the club (e.g., Events Team, Marketing Team, Technical Team)"
                    rows={3}
                    value={newClubForm.departments}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, departments: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-panel">Executive Panel Members</Label>
                  <Textarea
                    id="new-club-panel"
                    placeholder="List key panel members (e.g., President: John Doe, Vice President: Jane Smith, Secretary: Bob Johnson)"
                    rows={3}
                    value={newClubForm.panel_members}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, panel_members: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-achievements">Club Achievements</Label>
                  <Textarea
                    id="new-club-achievements"
                    placeholder="List notable achievements, awards, or recognitions the club has received"
                    rows={3}
                    value={newClubForm.achievements}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, achievements: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-events">Previous Events</Label>
                  <Textarea
                    id="new-club-events"
                    placeholder="List major events or activities the club has organized in the past"
                    rows={3}
                    value={newClubForm.previous_events}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, previous_events: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-club-social">Social Media Links</Label>
                  <Textarea
                    id="new-club-social"
                    placeholder="Facebook: https://facebook.com/club, Instagram: https://instagram.com/club, Twitter: https://twitter.com/club"
                    rows={3}
                    value={newClubForm.social_media}
                    onChange={(e) =>
                      setNewClubForm({ ...newClubForm, social_media: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateClub} className="flex-1">
                  Create Club
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateClubForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;
