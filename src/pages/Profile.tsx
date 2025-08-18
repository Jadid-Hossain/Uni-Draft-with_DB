import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Edit,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  Award,
  Upload,
  X,
  Trash2,
  Loader,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useUserEvents } from "@/hooks/useUserEvents";
import { useUserClubApplications } from "@/hooks/useUserClubApplications";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { events: userEvents, loading: eventsLoading } = useUserEvents();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { applications: clubApplications, loading: applicationsLoading } =
    useUserClubApplications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Initialize form data from user data
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    year: "",
    gpa: "",
    student_id: "",
    date_of_birth: "",
    bio: "",
    interests: "",
    achievements: "",
  });

  // Fetch user data from users table
  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log("Fetching user data for ID:", user.id);

      // Try to fetch from users table first
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      // If that fails, try manual_users table as fallback
      if (error) {
        console.log("Error with users table:", error);
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          console.log("Trying manual_users table as fallback...");
          const fallbackResult = await supabase
            .from("manual_users")
            .select("*")
            .eq("id", user.id)
            .single();

          data = fallbackResult.data;
          error = fallbackResult.error;
        }
      }

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        return;
      }

      setUserData(data);
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        department: data.department || "",
        year: data.year || "",
        gpa: data.gpa || "",
        student_id: data.student_id || "",
        date_of_birth: data.date_of_birth || "",
        bio: data.bio || "",
        interests: data.interests || "",
        achievements: data.achievements || "",
      });
      setProfileImage(data.avatar_url || null);
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  // Update user data in users table
  const updateUserData = async (data: any) => {
    if (!user?.id) return false;

    try {
      // Sanitize payload: remove empty-string fields and coerce dates
      const sanitizedData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value === "") {
          // Skip empty strings to avoid type errors (e.g., date fields)
          return;
        }
        // Pass through other values
        sanitizedData[key] = value;
      });

      // Try to update users table first
      let { error } = await supabase
        .from("users")
        .update(sanitizedData)
        .eq("id", user.id);

      // If that fails, try manual_users table as fallback
      if (error) {
        console.log("Error updating users table:", error);
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          console.log("Trying to update manual_users table as fallback...");
          const fallbackResult = await supabase
            .from("manual_users")
            .update(sanitizedData)
            .eq("id", user.id);

          error = fallbackResult.error;
        }
      }

      if (error) {
        setError(error.message);
        return false;
      }

      await fetchUserData(); // Refresh data
      return true;
    } catch (err) {
      setError("Failed to update user data");
      return false;
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file: File) => {
    if (!user?.id) return null;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      setError("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Delete profile image
  const deleteProfileImage = async () => {
    if (!user?.id || !profileImage) return false;

    try {
      // Extract file path from URL
      const urlParts = profileImage.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      setError("Failed to delete image");
      return false;
    }
  };

  // Hide profile page for admin users
  if (user?.role === "admin") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 pt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                Administrator Account
              </CardTitle>
              <CardDescription>
                Profile management is not available for administrator accounts.
                Use the admin dashboard to manage users and system settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => (window.location.href = "/admin")}
                className="w-full"
              >
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [user?.id]);

  // Fetch notifications when userData changes
  useEffect(() => {
    if (userData) {
      fetchNotifications();
    }
  }, [userData]);

  // Handle clicking outside notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications from user data
  const fetchNotifications = async () => {
    if (!userData?.notifications) return;

    try {
      let notificationData = userData.notifications;

      // Handle corrupted JSON data
      if (typeof notificationData === "string") {
        try {
          notificationData = JSON.parse(notificationData);
        } catch (parseError) {
          console.error("Error parsing notifications:", parseError);
          // Try to clean corrupted data
          notificationData = [];
        }
      }

      // Ensure it's an array and filter out invalid notifications
      if (Array.isArray(notificationData)) {
        // Filter out invalid notifications - only keep properly formatted ones
        const validNotifications = notificationData.filter(
          (notification: any) => {
            // Check if notification has all required fields and valid structure
            return (
              notification &&
              typeof notification === "object" &&
              notification.id &&
              notification.title &&
              notification.message &&
              notification.type &&
              notification.timestamp &&
              typeof notification.read === "boolean" &&
              // Validate timestamp format
              !isNaN(new Date(notification.timestamp).getTime()) &&
              // Validate type is one of the expected values
              ["info", "success", "warning", "error"].includes(
                notification.type
              )
            );
          }
        );

        console.log("Valid notifications found:", validNotifications.length);
        console.log(
          "Invalid notifications filtered out:",
          notificationData.length - validNotifications.length
        );

        // If we found corrupted data, clean it up in the database
        if (validNotifications.length < notificationData.length) {
          console.log("Cleaning up corrupted notifications in database...");
          // Update the database with only valid notifications
          updateUserData({ notifications: validNotifications }).catch((err) => {
            console.error("Error cleaning up notifications:", err);
          });
        }

        setNotifications(validNotifications);
        const unread = validNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error processing notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const updatedNotifications = notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      const success = await updateUserData({
        notifications: updatedNotifications,
      });
      if (success) {
        setNotifications(updatedNotifications);
        const unread = updatedNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const updatedNotifications = notifications.map((n: any) => ({
        ...n,
        read: true,
      }));

      const success = await updateUserData({
        notifications: updatedNotifications,
      });
      if (success) {
        setNotifications(updatedNotifications);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Clean up corrupted notifications manually
  const cleanupCorruptedNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log("Manual cleanup of corrupted notifications...");
      // Set to empty array to clear all corrupted data
      const success = await updateUserData({ notifications: [] });
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: "Notifications Cleaned",
          description: "Corrupted notifications have been removed.",
        });
      }
    } catch (err) {
      console.error("Error cleaning up notifications:", err);
      toast({
        title: "Error",
        description: "Failed to clean up notifications.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateUserData(formData);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error(error || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadProfileImage(file);
      if (imageUrl) {
        // Update the database with the new avatar URL
        const success = await updateUserData({ avatar_url: imageUrl });
        if (success) {
          setProfileImage(imageUrl);
          toast({
            title: "Success!",
            description: "Profile picture updated successfully.",
          });
        } else {
          throw new Error("Failed to save avatar to database");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async () => {
    try {
      const success = await deleteProfileImage();
      if (success) {
        // Update the database to remove avatar URL
        await updateUserData({ avatar_url: "" });
        setProfileImage(null);
        toast({
          title: "Success!",
          description: "Profile picture removed successfully.",
        });
      } else {
        throw new Error("Failed to remove profile picture");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove profile picture.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "withdrawn":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8 bg-gradient-card border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage
                      src={profileImage || undefined}
                      alt={formData.full_name}
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                      {formData.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Image Upload Controls */}
                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>

                    {profileImage && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={handleDeleteImage}
                        disabled={uploading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Upload notice */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground text-center whitespace-nowrap">
                    Max 100KB
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {formData.full_name}
                      </h1>
                      <p className="text-muted-foreground mb-2">
                        {formData.department} • {formData.year}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          GPA: {formData.gpa}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-success/10 text-success"
                        >
                          {user?.role
                            ? user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)
                            : "Student"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Notification Bell */}
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setShowNotifications(!showNotifications)
                          }
                          className="relative"
                        >
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                          <div
                            ref={notificationsRef}
                            className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                          >
                            <div className="p-3 border-b bg-gray-50">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                <div className="flex items-center gap-2">
                                  {unreadCount > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={markAllAsRead}
                                      className="text-xs"
                                    >
                                      Mark all as read
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cleanupCorruptedNotifications}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Clean Corrupted
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              {notifications.length > 0 ? (
                                notifications.map((notification: any) => (
                                  <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                                      notification.read
                                        ? "bg-gray-50 hover:bg-gray-100"
                                        : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                                    }`}
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm mb-1">
                                          {notification.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-2">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                              notification.type === "info"
                                                ? "bg-blue-100 text-blue-800"
                                                : notification.type ===
                                                  "success"
                                                ? "bg-green-100 text-green-800"
                                                : notification.type ===
                                                  "warning"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {notification.type}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(
                                              notification.timestamp
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 ml-2"></div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 text-gray-500">
                                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p>No notifications</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() =>
                          isEditing ? handleSave() : setIsEditing(true)
                        }
                        variant={isEditing ? "success" : "outline"}
                        disabled={saving || loading}
                        className="w-full md:w-auto"
                      >
                        {saving ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : isEditing ? (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center md:justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      {formData.email}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      {formData.phone}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <MapPin className="mr-2 h-4 w-4" />
                      {formData.address}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {formData.bio || "No bio information available."}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={formData.interests}
                        onChange={(e) =>
                          handleInputChange("interests", e.target.value)
                        }
                        placeholder="Enter your interests (comma separated)..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.interests ? (
                          formData.interests
                            .split(",")
                            .map((interest, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {interest.trim()}
                              </Badge>
                            ))
                        ) : (
                          <p className="text-muted-foreground">
                            No interests added yet.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={formData.achievements}
                        onChange={(e) =>
                          handleInputChange("achievements", e.target.value)
                        }
                        placeholder="Enter your achievements (one per line)..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <ul className="space-y-2">
                        {formData.achievements ? (
                          formData.achievements
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((achievement, index) => (
                              <li
                                key={index}
                                className="flex items-center text-sm"
                              >
                                <div className="h-2 w-2 rounded-full bg-primary mr-3" />
                                {achievement.trim()}
                              </li>
                            ))
                        ) : (
                          <li className="text-muted-foreground">
                            No achievements added yet.
                          </li>
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      {isEditing ? (
                        <Select
                          value={formData.department}
                          onValueChange={(value) =>
                            handleInputChange("department", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Science">
                              Computer Science
                            </SelectItem>
                            <SelectItem value="Electrical Engineering">
                              Electrical Engineering
                            </SelectItem>
                            <SelectItem value="Business Administration">
                              Business Administration
                            </SelectItem>
                            <SelectItem value="Economics">Economics</SelectItem>
                            <SelectItem value="Mathematics">
                              Mathematics
                            </SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Architecture">
                              Architecture
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.department} readOnly />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="year">Academic Year</Label>
                      {isEditing ? (
                        <Select
                          value={formData.year}
                          onValueChange={(value) =>
                            handleInputChange("year", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Freshman">1st Year</SelectItem>
                            <SelectItem value="Sophomore">2nd Year</SelectItem>
                            <SelectItem value="Junior">3rd Year</SelectItem>
                            <SelectItem value="Senior">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.year} readOnly />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gpa">Current CGPA</Label>
                      {isEditing ? (
                        <Input
                          value={formData.gpa}
                          onChange={(e) =>
                            handleInputChange("gpa", e.target.value)
                          }
                          placeholder="3.50"
                        />
                      ) : (
                        <Input value={formData.gpa} readOnly />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <Label>Student ID</Label>
                      <Input
                        value={user?.student_id || "Not Available"}
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={formData.email} readOnly />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Recent Joined Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : userEvents.length > 0 ? (
                      <div className="space-y-4">
                        {userEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">
                                  {event.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {formatDate(event.start_at)}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  event.registration_status === "registered"
                                    ? "default"
                                    : "secondary"
                                }
                                className="ml-2"
                              >
                                {event.registration_status}
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                event.status === "completed"
                                  ? "outline"
                                  : "secondary"
                              }
                              className="mt-2"
                            >
                              {event.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No events joined yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Join some events to see them here!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Club Applications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Club Applications
                    </CardTitle>
                    <CardDescription>
                      Your club membership applications and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applicationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : clubApplications.length > 0 ? (
                      <div className="space-y-4">
                        {clubApplications.map((application) => (
                          <div
                            key={application.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">
                                  {application.club_name}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Applied on{" "}
                                  {formatDate(application.application_date)}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {application.motivation}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {getStatusIcon(application.status)}
                                <Badge
                                  className={getStatusColor(application.status)}
                                  variant="outline"
                                >
                                  {application.status.charAt(0).toUpperCase() +
                                    application.status.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            {application.experience && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Experience:</strong>{" "}
                                  {application.experience}
                                </p>
                              </div>
                            )}

                            {application.skills && (
                              <div className="mt-1">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Skills:</strong> {application.skills}
                                </p>
                              </div>
                            )}

                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                <strong>Availability:</strong>{" "}
                                {application.availability}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No club applications yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Apply to some clubs to see them here!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
