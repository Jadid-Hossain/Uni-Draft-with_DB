import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const stats = [
    { icon: Users, label: "BRACU Students", value: "22,000+" },
    { icon: Users, label: "Student Clubs", value: "30+" },
    { icon: Calendar, label: "Campus Events", value: "50+" },
    { icon: Trophy, label: "Academic Programs", value: "30+" },
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-1
          {/* CTA Buttons */}6 animate-fade-in">
            <Button variant="hero" size="xl" className="group">
              Join the Community Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/learn-more">Learn More</Link>
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


      </div>
    </section>
  );
};

export default HeroSection;