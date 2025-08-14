import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Plus, 
  Edit, 
  Trash2,
  BarChart3,
  Settings,
  Clock,
  GraduationCap,
  LayoutDashboard,
  UserCog,
  UserCheck
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import StudentManagement from "@/components/StudentManagement";
import EventManagement from "@/components/EventManagement";
import ClubManagement from "@/components/ClubManagement";


const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeClubs: 34,
    totalEvents: 89,
    activeUsers: 1200 // Changed from pendingApprovals to activeUsers
  };

  const recentUsers = [
    { id: 1, name: "Alice Johnson", email: "alice@university.edu", department: "Computer Science", joinDate: "2024-01-15" },
    { id: 2, name: "Bob Smith", email: "bob@university.edu", department: "Engineering", joinDate: "2024-01-14" },
    { id: 3, name: "Carol Davis", email: "carol@university.edu", department: "Business", joinDate: "2024-01-13" },
  ];



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

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "users", label: "Users", icon: UserCog },
    { id: "clubs", label: "Clubs", icon: Shield },
    { id: "events", label: "Events", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-20">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-card/50 backdrop-blur-sm border-r border-border/40 min-h-screen shadow-lg">
            <div className="p-6 border-b border-border/40">
              <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
              <p className="text-sm text-muted-foreground">Manage platform</p>
            </div>
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {sidebarItems.find(item => item.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === "overview" && "Dashboard overview and quick actions"}
                {activeTab === "students" && "Manage student data and information"}
                {activeTab === "users" && "Manage registered users and permissions"}
                {activeTab === "clubs" && "Approve and manage student clubs"}
                {activeTab === "events" && "Oversee university events and activities"}
                {activeTab === "analytics" && "View platform analytics and statistics"}
                {activeTab === "settings" && "Configure platform settings"}
              </p>
            </div>

            {/* Overview Section */}
            {activeTab === "overview" && (
              <div className="space-y-6">
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
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <p className="text-3xl font-bold text-foreground">{stats.activeUsers}</p>
                        <p className="text-xs text-success">All verified</p>
                      </div>
                      <div className="bg-success/10 p-3 rounded-lg">
                        <UserCheck className="h-6 w-6 text-success" />
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
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => setActiveTab("clubs")}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">Add New Club</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => setActiveTab("events")}
                      >
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
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => setActiveTab("analytics")}
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm">View Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
            )}

            {/* Students Section */}
            {activeTab === "students" && (
              <div className="space-y-6">
                <StudentManagement />
              </div>
            )}

            {/* Users Section */}
            {activeTab === "users" && (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Clubs Section */}
            {activeTab === "clubs" && (
              <div className="space-y-6">
                <ClubManagement />
              </div>
            )}

            {/* Events Section */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <EventManagement />
              </div>
            )}

            {/* Analytics Section */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-3xl font-bold text-foreground">1,247</p>
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
                        <p className="text-3xl font-bold text-foreground">34</p>
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
                        <p className="text-3xl font-bold text-foreground">89</p>
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
                        <p className="text-sm font-medium text-muted-foreground">Event Registrations</p>
                        <p className="text-3xl font-bold text-foreground">456</p>
                        <p className="text-xs text-success">+15% from last week</p>
                      </div>
                      <div className="bg-success/10 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>Monthly user registration growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Chart visualization coming soon...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Club Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Club Activity Overview</CardTitle>
                    <CardDescription>Most active clubs this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "Robotics Club", members: 45, events: 8, growth: "+12%" },
                        { name: "Drama Society", members: 32, events: 6, growth: "+8%" },
                        { name: "Chess Club", members: 28, events: 4, growth: "+15%" },
                        { name: "Photography Club", members: 25, events: 5, growth: "+20%" },
                      ].map((club, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{club.name}</p>
                            <p className="text-sm text-muted-foreground">{club.members} members • {club.events} events</p>
                          </div>
                          <Badge variant="default" className="text-xs">{club.growth}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Department Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Department-wise Statistics</CardTitle>
                  <CardDescription>User distribution across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { department: "Computer Science", users: 245, percentage: "19.7%" },
                      { department: "Engineering", users: 198, percentage: "15.9%" },
                      { department: "Business", users: 187, percentage: "15.0%" },
                      { department: "Arts & Humanities", users: 156, percentage: "12.5%" },
                      { department: "Medicine", users: 134, percentage: "10.8%" },
                      { department: "Others", users: 327, percentage: "26.2%" },
                    ].map((dept, index) => (
                      <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{dept.users}</p>
                        <p className="text-sm text-muted-foreground">{dept.department}</p>
                        <p className="text-xs text-primary">{dept.percentage}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeTab === "settings" && (
              <div className="space-y-6">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;