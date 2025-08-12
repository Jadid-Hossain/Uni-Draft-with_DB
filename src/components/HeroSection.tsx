import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, MessageSquare, Trophy, BookOpen, Sparkles } from "lucide-react";

const HeroSection = () => {
  const stats = [
    { icon: Users, label: "BRACU Students", value: "15,000+" },
    { icon: Users, label: "Student Clubs", value: "50+" },
    { icon: Calendar, label: "Campus Events", value: "200+" },
    { icon: Trophy, label: "Academic Programs", value: "45+" },
  ];

  const features = [
    {
      icon: Users,
      title: "Join Clubs",
      description: "Discover and join student organizations at BRAC University that match your interests and passions."
    },
    {
      icon: Calendar,
      title: "Campus Events",
      description: "Stay updated with BRACU campus events, competitions, and important academic deadlines."
    },
    {
      icon: MessageSquare,
      title: "Connect & Discuss",
      description: "Engage in meaningful discussions with fellow BRACU students through university forums."
    },
    {
      icon: BookOpen,
      title: "Academic Resources",
      description: "Access BRAC University course materials, career opportunities, and educational resources."
    }
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 pt-16">
      {/* Hero Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in shadow-lg">
            <Sparkles className="h-4 w-4" />
            <span>BRAC University Student Portal</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in">
            BRACU Student
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Community</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Connect with fellow BRAC University students, join clubs, attend campus events, 
            and participate in the vibrant BRACU community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Button variant="hero" size="xl" className="group">
              Get Started Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 animate-fade-in">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center bg-card rounded-lg p-6 shadow-card hover:shadow-md transition-all duration-200 hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-primary p-3 rounded-lg inline-flex mb-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your BRACU Campus Connection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay connected with campus life at BRAC University through clubs, events, and academic resources.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-gradient-card rounded-xl p-6 shadow-card hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-primary p-3 rounded-lg inline-flex mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;