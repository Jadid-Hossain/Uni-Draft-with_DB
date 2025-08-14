import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Camera, Edit, Save, Mail, Phone, MapPin, Calendar, BookOpen, Users, Award, Upload, X, Trash2, Loader } from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useUserEvents } from "@/hooks/useUserEvents";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useProfile } from "@/hooks/useProfile";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { events: userEvents, loading: eventsLoading } = useUserEvents();
  const { uploadProfileImage, deleteProfileImage, uploading, error: uploadError } = useProfileImage();
  const { profile, loading: profileLoading, error: profileError, updateProfile, updateAvatar, getFormData } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Initialize form data from profile
  const [formData, setFormData] = useState(() => getFormData());

    // Hide profile page for admin users
  if (user?.role === 'admin') {
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
                onClick={() => window.location.href = '/admin'}
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

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(getFormData());
      setProfileImage(profile.avatar_url || null);
    }
  }, [profile]);

  // Load profile image on component mount  
  useEffect(() => {
    const loadProfileImage = async () => {
      if (user?.id && profile?.avatar_url) {
        setProfileImage(profile.avatar_url);
      }
    };

    loadProfileImage();
  }, [user?.id, profile?.avatar_url]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error(profileError || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadProfileImage(file);
      if (imageUrl) {
        // Update the database with the new avatar URL
        const success = await updateAvatar(imageUrl);
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
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async () => {
    try {
      const success = await deleteProfileImage();
      if (success) {
        // Update the database to remove avatar URL
        await updateAvatar('');
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
        description: error instanceof Error ? error.message : "Failed to remove profile picture.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
                    <AvatarImage src={profileImage || undefined} alt={formData.name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                      {formData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
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
                      <h1 className="text-3xl font-bold text-foreground mb-2">{formData.name}</h1>
                      <p className="text-muted-foreground mb-2">{formData.department} • {formData.year}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          GPA: {formData.gpa}
                        </Badge>
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      variant={isEditing ? "success" : "outline"}
                      disabled={saving || profileLoading}
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
                      {formData.location}
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
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{formData.bio}</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest) => (
                        <Badge key={interest} variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                          {interest}
                        </Badge>
                      ))}
                    </div>
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
                    <ul className="space-y-2">
                      {formData.achievements.map((achievement) => (
                        <li key={achievement} className="flex items-center text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary mr-3" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
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
                        <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                            <SelectItem value="Business Administration">Business Administration</SelectItem>
                            <SelectItem value="Economics">Economics</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Architecture">Architecture</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.department} readOnly />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="year">Academic Year</Label>
                      {isEditing ? (
                        <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
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
                          onChange={(e) => handleInputChange('gpa', e.target.value)}
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
                      <Input value={user?.student_id || 'Not Available'} readOnly />
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
                          <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{event.title}</h4>
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
                                variant={event.registration_status === 'registered' ? 'default' : 'secondary'}
                                className="ml-2"
                              >
                                {event.registration_status}
                              </Badge>
                            </div>
                            <Badge 
                              variant={event.status === 'completed' ? 'outline' : 'secondary'} 
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
                        <p className="text-muted-foreground">No events joined yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Join some events to see them here!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Club Memberships */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Club Memberships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {formData.clubs.map((club) => (
                        <div key={club} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <h4 className="font-semibold mb-2">{club}</h4>
                          <p className="text-sm text-muted-foreground">Active Member</p>
                          <Badge variant="secondary" className="mt-2">2023-Present</Badge>
                        </div>
                      ))}
                    </div>
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
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
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