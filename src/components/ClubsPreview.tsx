import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, ArrowRight, Star } from "lucide-react";

const ClubsPreview = () => {
  const featuredClubs = [
    {
      id: 1,
      name: "Computer Science Society",
      description: "Building the future through code, innovation, and collaboration.",
      members: 245,
      category: "Academic",
      location: "Tech Building",
      nextEvent: "Hackathon 2024",
      eventDate: "Dec 15",
      rating: 4.8,
      image: "bg-gradient-to-br from-blue-500 to-purple-600"
    },
    {
      id: 2,
      name: "Photography Club",
      description: "Capturing moments, creating memories, and exploring visual storytelling.",
      members: 128,
      category: "Creative",
      location: "Arts Center",
      nextEvent: "Photo Walk",
      eventDate: "Dec 8",
      rating: 4.6,
      image: "bg-gradient-to-br from-orange-500 to-pink-600"
    },
    {
      id: 3,
      name: "Debate Society",
      description: "Sharpening minds through discourse, argumentation, and public speaking.",
      members: 89,
      category: "Academic",
      location: "Main Hall",
      nextEvent: "Inter-Uni Debate",
      eventDate: "Dec 20",
      rating: 4.9,
      image: "bg-gradient-to-br from-green-500 to-teal-600"
    },
    {
      id: 4,
      name: "Music Ensemble",
      description: "Harmonizing voices and instruments to create beautiful melodies.",
      members: 156,
      category: "Creative",
      location: "Music Wing",
      nextEvent: "Winter Concert",
      eventDate: "Dec 18",
      rating: 4.7,
      image: "bg-gradient-to-br from-purple-500 to-indigo-600"
    }
  ];

  const categories = ["All", "Academic", "Creative", "Sports", "Community", "Technology"];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discover Student Clubs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find your community among 150+ active student organizations. From academic societies to creative clubs, there's something for everyone.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Badge 
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredClubs.map((club, index) => (
            <Card 
              key={club.id} 
              className="group hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Club Image/Header */}
              <div className={`h-32 ${club.image} relative`}>
                <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-white text-xs font-medium">{club.rating}</span>
                </div>
                <Badge 
                  className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  {club.category}
                </Badge>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{club.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Club Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{club.members} members</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{club.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{club.nextEvent} • {club.eventDate}</span>
                  </div>
                </div>

                {/* Join Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Join Club
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" className="group">
            Explore All Clubs
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ClubsPreview;