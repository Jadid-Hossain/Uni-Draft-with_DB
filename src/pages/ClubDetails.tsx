import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, Award, Building2, Mail, Phone, MapPin, Clock, Info, UserCheck, Trophy, Briefcase, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useClubSubscriptions } from "@/hooks/useClubSubscriptions";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    isSubscribedToClub, 
    subscribeToClub, 
    unsubscribeFromClub,
    getClubMemberCount,
    getClubSubscriptionCount
  } = useClubSubscriptions();

  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Fetch club details
  useEffect(() => {
    const fetchClubDetails = async () => {
      if (!id) return;

      try {
        console.log('🔍 Fetching club details for ID:', id);
        
        // Fetch club info with all fields
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', id)
          .single();

        if (clubError) {
          console.error('❌ Error fetching club:', clubError);
          return;
        }

        console.log('✅ Club data fetched:', clubData);
        setClub(clubData);

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('club_memberships')
          .select(`
            id,
            user_id,
            role,
            detailed_role,
            joined_at,
            status,
            user:users!club_memberships_user_id_fkey(
              full_name,
              email,
              department,
              student_id
            )
          `)
          .eq('club_id', id)
          .eq('status', 'active');

        if (!membersError && membersData) {
          console.log('✅ Members data fetched:', membersData);
          setMembers(membersData);
        } else {
          console.error('❌ Error fetching members:', membersError);
        }

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('club_id', id)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(10);

        if (!eventsError && eventsData) {
          console.log('✅ Events data fetched:', eventsData);
          setEvents(eventsData);
        } else {
          console.error('❌ Error fetching events:', eventsError);
        }

        // Fetch counts
        const [memberCountResult, subscriberCountResult] = await Promise.all([
          getClubMemberCount(id),
          getClubSubscriptionCount(id)
        ]);

        setMemberCount(memberCountResult);
        setSubscriberCount(subscriberCountResult);

      } catch (error) {
        console.error('❌ Error fetching club details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [id, getClubMemberCount, getClubSubscriptionCount]);

  // Handle subscription toggle
  const handleSubscriptionToggle = async () => {
    if (!user || !club) return;

    setSubscriptionLoading(true);
    try {
      if (isSubscribedToClub(club.id)) {
        await unsubscribeFromClub(club.id);
        setSubscriberCount(prev => prev - 1);
      } else {
        await subscribeToClub(club.id);
        setSubscriberCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Club not found</h1>
          <Button onClick={() => navigate('/clubs')}>Back to Clubs</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/clubs')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Button>
            
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-80 h-48 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{club.name}</h1>
                    <Badge variant="secondary" className="mb-2">{club.category || 'General'}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <Button
                        variant={isSubscribedToClub(club.id) ? "default" : "outline"}
                        size="sm"
                        onClick={handleSubscriptionToggle}
                        disabled={subscriptionLoading}
                        className={isSubscribedToClub(club.id) ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {subscriptionLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : isSubscribedToClub(club.id) ? (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Unsubscribe
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    )}
                    <Button size="lg">
                      <Users className="h-4 w-4 mr-2" />
                      Join Club
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {memberCount} members
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Bell className="h-4 w-4 mr-2" />
                    {subscriberCount} subscribers
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {new Date(club.created_at).toLocaleDateString()}
                  </div>
                  {club.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {club.location}
                    </div>
                  )}
                  {club.address && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {club.address}
                    </div>
                  )}
                  {club.meeting_day && club.meeting_time && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {club.meeting_day}, {club.meeting_time}
                    </div>
                  )}
                  {club.contact_email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {club.contact_email}
                    </div>
                  )}
                  {club.club_mail && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {club.club_mail}
                    </div>
                  )}
                  {club.contact_phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {club.contact_phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm">
              <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="panel" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Panels</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Awards</span>
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Teams</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-8 animate-fade-in">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">About {club.name}</CardTitle>
                      <CardDescription className="mt-1">Learn more about our mission and vision</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none space-y-6">
                    {club.description && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Description</h3>
                        <p className="text-foreground leading-relaxed">{club.description}</p>
                      </div>
                    )}
                    
                    {club.club_details && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Club Details</h3>
                        <div className="text-foreground leading-relaxed whitespace-pre-line">{club.club_details}</div>
                      </div>
                    )}
                    
                    {club.mission_statement && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Mission Statement</h3>
                        <p className="text-foreground leading-relaxed">{club.mission_statement}</p>
                      </div>
                    )}
                    
                    {club.vision_statement && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Vision Statement</h3>
                        <p className="text-foreground leading-relaxed">{club.vision_statement}</p>
                      </div>
                    )}
                    
                    {club.requirements && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Requirements</h3>
                        <p className="text-foreground leading-relaxed">{club.requirements}</p>
                      </div>
                    )}
                    
                    {club.founded_date && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Founded</h3>
                        <p className="text-foreground leading-relaxed">{new Date(club.founded_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {club.website && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Website</h3>
                        <a 
                          href={club.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline"
                        >
                          {club.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="panel" className="mt-8 animate-fade-in">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Executive Panel</CardTitle>
                      <CardDescription className="mt-1">Meet our current leadership team</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {club.panel_members ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <h3 className="font-semibold text-foreground mb-2">Panel Information</h3>
                        <div className="text-foreground leading-relaxed whitespace-pre-line">{club.panel_members}</div>
                      </div>
                      
                      {members.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-foreground mb-4">Current Members</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {members
                              .filter(member => 
                                member.role === 'president' || 
                                member.role === 'vice_president' || 
                                member.role === 'director' || 
                                member.role === 'secretary' || 
                                member.role === 'treasurer' || 
                                member.role === 'coordinator' ||
                                member.detailed_role?.toLowerCase().includes('president') ||
                                member.detailed_role?.toLowerCase().includes('director') ||
                                member.detailed_role?.toLowerCase().includes('secretary') ||
                                member.detailed_role?.toLowerCase().includes('treasurer') ||
                                member.detailed_role?.toLowerCase().includes('coordinator')
                              )
                              .map((member) => {
                                const fullName = member.user?.full_name || 'Unknown User';
                                const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
                                const role = member.detailed_role || member.role;
                                const department = member.user?.department || 'N/A';
                                const deptAbbr = department.length > 3 ? department.substring(0, 3).toUpperCase() : department.toUpperCase();
                                
                                return (
                                  <div key={member.id} className="group flex items-center space-x-4 p-6 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-border/50">
                                    <div className="relative w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                      <span className="text-lg font-semibold text-primary">{initials}</span>
                                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-foreground text-lg mb-1">{fullName}</h3>
                                      <p className="text-sm text-primary font-medium mb-1">{role}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{deptAbbr}</p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No panel members found for this club.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {members
                        .filter(member => 
                          member.role === 'president' || 
                          member.role === 'vice_president' || 
                          member.role === 'director' || 
                          member.role === 'secretary' || 
                          member.role === 'treasurer' || 
                          member.role === 'coordinator' ||
                          member.detailed_role?.toLowerCase().includes('president') ||
                          member.detailed_role?.toLowerCase().includes('director') ||
                          member.detailed_role?.toLowerCase().includes('secretary') ||
                          member.detailed_role?.toLowerCase().includes('treasurer') ||
                          member.detailed_role?.toLowerCase().includes('coordinator')
                        )
                        .map((member) => {
                          const fullName = member.user?.full_name || 'Unknown User';
                          const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
                          const role = member.detailed_role || member.role;
                          const department = member.user?.department || 'N/A';
                          const deptAbbr = department.length > 3 ? department.substring(0, 3).toUpperCase() : department.toUpperCase();
                          
                          return (
                            <div key={member.id} className="group flex items-center space-x-4 p-6 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-border/50">
                              <div className="relative w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                <span className="text-lg font-semibold text-primary">{initials}</span>
                                <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground text-lg mb-1">{fullName}</h3>
                                <p className="text-sm text-primary font-medium mb-1">{role}</p>
                                <p className="text-xs text-muted-foreground font-mono">{deptAbbr}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="mt-8 animate-fade-in">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Events</CardTitle>
                      <CardDescription className="mt-1">Our upcoming and previous events</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {club.previous_events && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Previous Events</h3>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-foreground leading-relaxed whitespace-pre-line">{club.previous_events}</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Upcoming Events</h3>
                      {events.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No upcoming events found for this club.</p>
                      ) : (
                        <div className="space-y-4">
                          {events.map((event) => (
                            <div key={event.id} className="group p-6 border border-border/50 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-foreground">{event.title}</h3>
                                <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors duration-300">{event.type}</Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{event.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(event.start_date).toLocaleDateString()}
                                </div>
                                {event.start_time && (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {event.start_time}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-8 animate-fade-in">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Our Achievements</CardTitle>
                      <CardDescription className="mt-1">Celebrating our milestones and successes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {club.achievements ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="text-foreground leading-relaxed whitespace-pre-line">{club.achievements}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="group flex gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all duration-300">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Award className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">Best Computer Club Award</h3>
                            <Badge variant="secondary">2024</Badge>
                          </div>
                          <p className="text-muted-foreground">Recognized as the best computer club in the university for outstanding contributions.</p>
                        </div>
                      </div>
                      <div className="group flex gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all duration-300">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Award className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">Inter-University Programming Contest Winners</h3>
                            <Badge variant="secondary">2023</Badge>
                          </div>
                          <p className="text-muted-foreground">Our team secured 1st position in the national programming contest.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="mt-8 animate-fade-in">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Club Teams</CardTitle>
                      <CardDescription className="mt-1">Explore our specialized teams and departments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {club.departments ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <h3 className="font-semibold text-foreground mb-2">Our Departments</h3>
                        <div className="text-foreground leading-relaxed">{club.departments}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group p-6 border border-border/50 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Web Development</h3>
                          </div>
                          <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors duration-300">{Math.floor(members.length * 0.3)} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team Lead: <span className="font-medium">Team Lead</span>
                        </p>
                      </div>
                      <div className="group p-6 border border-border/50 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Mobile App Development</h3>
                          </div>
                          <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors duration-300">{Math.floor(members.length * 0.25)} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team Lead: <span className="font-medium">Team Lead</span>
                        </p>
                      </div>
                      <div className="group p-6 border border-border/50 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Data Science & AI</h3>
                          </div>
                          <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors duration-300">{Math.floor(members.length * 0.2)} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team Lead: <span className="font-medium">Team Lead</span>
                        </p>
                      </div>
                      <div className="group p-6 border border-border/50 hover:border-primary/30 rounded-xl bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Cybersecurity</h3>
                          </div>
                          <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors duration-300">{Math.floor(members.length * 0.15)} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team Lead: <span className="font-medium">Team Lead</span>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ClubDetails;
