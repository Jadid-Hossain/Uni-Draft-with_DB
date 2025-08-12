import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowRight, Bookmark } from "lucide-react";

const EventsPreview = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: "Annual Science Fair",
      description: "Showcase innovative projects and research from students across all departments.",
      date: "December 15, 2024",
      time: "10:00 AM - 6:00 PM",
      location: "Main Auditorium",
      attendees: 245,
      category: "Academic",
      organizer: "Science Department",
      image: "bg-gradient-to-br from-blue-500 to-cyan-600",
      featured: true
    },
    {
      id: 2,
      title: "Winter Festival 2024",
      description: "Celebrate the holiday season with music, food, and cultural performances.",
      date: "December 20, 2024",
      time: "7:00 PM - 11:00 PM",
      location: "University Grounds",
      attendees: 850,
      category: "Cultural",
      organizer: "Student Council",
      image: "bg-gradient-to-br from-purple-500 to-pink-600",
      featured: true
    },
    {
      id: 3,
      title: "Career Networking Night",
      description: "Connect with industry professionals and explore career opportunities.",
      date: "December 12, 2024",
      time: "6:00 PM - 9:00 PM",
      location: "Business Center",
      attendees: 156,
      category: "Professional",
      organizer: "Career Services",
      image: "bg-gradient-to-br from-green-500 to-emerald-600",
      featured: false
    },
    {
      id: 4,
      title: "Coding Championship",
      description: "Test your programming skills in this exciting coding competition.",
      date: "December 18, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Computer Lab",
      attendees: 89,
      category: "Competition",
      organizer: "CS Society",
      image: "bg-gradient-to-br from-orange-500 to-red-600",
      featured: false
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Never miss out on campus activities. From academic conferences to cultural festivals, stay connected with what's happening.
          </p>
        </div>

        {/* Featured Events */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {upcomingEvents.filter(event => event.featured).map((event, index) => (
            <Card 
              key={event.id}
              className="group hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Event Header */}
              <div className={`h-40 ${event.image} relative flex items-end p-6`}>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                    {event.category}
                  </Badge>
                </div>
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-white/90 text-sm">{event.organizer}</p>
                </div>
              </div>

              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                
                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button variant="hero" size="sm" className="flex-1">
                    Register Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Regular Events */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {upcomingEvents.filter(event => !event.featured).map((event, index) => (
            <Card 
              key={event.id}
              className="group hover:shadow-md transition-all duration-200 hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${(index + 2) * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1 mb-1">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{event.organizer}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {event.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                
                {/* Compact Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3 text-primary" />
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Learn More
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" className="group">
            View All Events
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsPreview;