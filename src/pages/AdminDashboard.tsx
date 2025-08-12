import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Plus, 
  Edit, 
  Trash2,
  BarChart3,
  Settings,
  UserCheck,
  Clock,
  GraduationCap
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import StudentManagement from "@/components/StudentManagement";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeClubs: 34,
    totalEvents: 89,
    pendingApprovals: 12
  };

  const recentUsers = [
    { id: 1, name: "Alice Johnson", email: "alice@university.edu", department: "Computer Science", joinDate: "2024-01-15" },
    { id: 2, name: "Bob Smith", email: "bob@university.edu", department: "Engineering", joinDate: "2024-01-14" },
    { id: 3, name: "Carol Davis", email: "carol@university.edu", department: "Business", joinDate: "2024-01-13" },
  ];

  const clubs = [
    { id: 1, name: "Robotics Club", members: 45, status: "Active", category: "Technology" },
    { id: 2, name: "Drama Society", members: 32, status: "Active", category: "Arts" },
    { id: 3, name: "Chess Club", members: 28, status: "Pending", category: "Games" },
  ];

  const handleApproveClub = (clubId: number) => {
    toast({
      title: "Club Approved",
      description: "The club has been successfully approved and activated.",
    });
  };

  const handleDeleteClub = (clubId: number) => {
    toast({
      title: "Club Deleted",
      description: "The club has been removed from the system.",
      variant: "destructive",
    });
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 pt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>You don't have permission to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage the university student activity platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="clubs">Clubs</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                        <p className="text-xs text-success">+12% from last month</p>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Clubs</p>
                        <p className="text-3xl font-bold text-foreground">{stats.activeClubs}</p>
                        <p className="text-xs text-success">+3 new this month</p>
                      </div>
                      <div className="bg-accent/10 p-3 rounded-lg">
                        <Shield className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                        <p className="text-3xl font-bold text-foreground">{stats.totalEvents}</p>
                        <p className="text-xs text-success">+8 this week</p>
                      </div>
                      <div className="bg-warning/10 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                        <p className="text-3xl font-bold text-foreground">{stats.pendingApprovals}</p>
                        <p className="text-xs text-warning">Requires attention</p>
                      </div>
                      <div className="bg-destructive/10 p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-destructive" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: "New club application", time: "2 hours ago", type: "club" },
                        { action: "Event registration opened", time: "4 hours ago", type: "event" },
                        { action: "New user registered", time: "6 hours ago", type: "user" },
                        { action: "Club meeting scheduled", time: "1 day ago", type: "meeting" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">Add New Club</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <Calendar className="h-5 w-5" />
                        <span className="text-sm">Create Event</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => setActiveTab("students")}
                      >
                        <GraduationCap className="h-5 w-5" />
                        <span className="text-sm">Manage Students</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm">View Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <StudentManagement />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage registered users and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.department} • Joined {user.joinDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Student</Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clubs Tab */}
            <TabsContent value="clubs" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Club Management</CardTitle>
                      <CardDescription>Approve new clubs and manage existing ones</CardDescription>
                    </div>
                    <Button className="bg-gradient-hero">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Club
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clubs.map((club) => (
                      <div key={club.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{club.name}</h4>
                          <p className="text-sm text-muted-foreground">{club.members} members • {club.category}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={club.status === 'Active' ? 'success' : 'secondary'}>
                            {club.status}
                          </Badge>
                          {club.status === 'Pending' && (
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => handleApproveClub(club.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClub(club.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>Oversee all university events and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Event management interface coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Configure platform settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="platform-name">Platform Name</Label>
                        <Input id="platform-name" defaultValue="UniConnect" />
                      </div>
                      <div>
                        <Label htmlFor="university-name">University Name</Label>
                        <Input id="university-name" defaultValue="University of Excellence" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input id="admin-email" defaultValue="admin@university.edu" />
                      </div>
                      <div>
                        <Label htmlFor="max-clubs">Max Clubs per User</Label>
                        <Input id="max-clubs" type="number" defaultValue="5" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full md:w-auto">Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;