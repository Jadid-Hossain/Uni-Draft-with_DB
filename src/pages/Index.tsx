import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ClubsPreview from "@/components/ClubsPreview";
import EventsPreview from "@/components/EventsPreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MessageSquare, BookOpen, TrendingUp, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Join Clubs",
      description: "Connect with like-minded students and pursue your passions",
      color: "text-primary"
    },
    {
      icon: Calendar,
      title: "Attend Events",
      description: "Never miss out on exciting campus activities and workshops",
      color: "text-accent"
    },
    {
      icon: MessageSquare,
      title: "Community Forums",
      description: "Engage in meaningful discussions and get academic help",
      color: "text-success"
    },
    {
      icon: BookOpen,
      title: "Academic Resources",
      description: "Access study materials, guides, and learning resources",
      color: "text-warning"
    }
  ];

  const stats = [
    { number: "50+", label: "Active Clubs", icon: Users },
    { number: "200+", label: "Monthly Events", icon: Calendar },
    { number: "15000+", label: "BRACU Students", icon: TrendingUp },
    { number: "12", label: "Schools & Institutes", icon: Award }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <HeroSection />
        
        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <Zap className="mr-1 h-3 w-3" />
                Platform Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your BRAC University Student Hub
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Connect with fellow BRACU students, join clubs, attend events, and make the most of your university experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className={`bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-primary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center text-primary-foreground">
                  <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-primary-foreground/80 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ClubsPreview />
        <EventsPreview />
        
        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join your fellow BRACU students in building an active and engaging campus community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" className="bg-gradient-hero shadow-lg hover:shadow-xl">
                <Link to="/signup">Join BRACU Community</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="border-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/clubs">Explore Clubs</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
