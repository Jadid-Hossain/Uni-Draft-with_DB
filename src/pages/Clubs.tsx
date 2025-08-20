import { useState } from "react";
import { Search, Filter, Users, Calendar, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useClubs } from "@/hooks/useDatabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const categories = [
  "All",
  "Academic",
  "Creative",
  "Social",
  "Sports",
  "Cultural",
];

const Clubs = () => {
  const { clubs, loading, createClub } = useClubs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Temporary function to create test clubs
  const createTestClub = async () => {
    try {
      await createClub({
        name: "Test Programming Club",
        description:
          "A club for programming enthusiasts to learn and share knowledge.",
        cover_image_url: null,
        is_public: true,
      });
      console.log("Test club created successfully");
    } catch (error) {
      console.error("Error creating test club:", error);
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.description &&
        club.description.toLowerCase().includes(searchTerm.toLowerCase()));
    // For now, we'll skip category filtering since it's not in our database schema
    // const matchesCategory = selectedCategory === "All" || club.category === selectedCategory;
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Discover University Clubs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your passion, connect with like-minded students, and make
            lasting memories
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clubs by name or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {filteredClubs.length} clubs
          </p>
          {/* Temporary test button */}
          {/* <Button onClick={createTestClub} variant="outline" size="sm">
            Create Test Club
          </Button> */}
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Clubs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No clubs have been created yet"}
                </p>
              </div>
            ) : (
              filteredClubs.map((club) => (
                <Card
                  key={club.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-card"
                >
                  <div className="relative">
                    <div className="w-full h-48 bg-gradient-to-br from-green-500 to-blue-600 rounded-t-lg flex items-center justify-center">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-background/80">
                        {club.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {club.name}
                      </h3>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {club.description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created{" "}
                          {new Date(club.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link
                          to={`/join-club/${club.id}`}
                          onClick={() => {
                            console.log("Clubs - Navigating to club:", {
                              clubId: club.id,
                              clubName: club.name,
                              fullPath: `/join-club/${club.id}`,
                            });
                          }}
                        >
                          Join Club
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="p-8 bg-gradient-accent border-0">
            <h2 className="text-2xl font-bold text-accent-foreground mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-accent-foreground/80 mb-6">
              Start your own club and bring together students with similar
              interests
            </p>
            <Button variant="secondary" size="lg">
              Contact Us
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
