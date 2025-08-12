import { useState } from "react";
import { Search, Plus, MessageSquare, Users, Clock, Pin, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const mockThreads = [
  {
    id: 1,
    title: "Best Programming Languages to Learn in 2024",
    author: "Alex Chen",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40",
    category: "Academic",
    subcategory: "Computer Science",
    replies: 45,
    views: 1250,
    lastActivity: "2 hours ago",
    isPinned: true,
    tags: ["Programming", "Career", "Tech"],
    preview: "What are your thoughts on the most valuable programming languages to focus on this year? I'm particularly interested in..."
  },
  {
    id: 2,
    title: "Photography Club Meet-up This Weekend",
    author: "Sarah Johnson",
    authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b9bc5b00?w=40",
    category: "Clubs",
    subcategory: "Photography Club",
    replies: 12,
    views: 340,
    lastActivity: "5 hours ago",
    isPinned: false,
    tags: ["Photography", "Meetup", "Weekend"],
    preview: "Hey everyone! We're planning a photo walk around the campus this Saturday. Meeting at 8 AM near the library..."
  },
  {
    id: 3,
    title: "Study Group for Advanced Mathematics",
    author: "David Park",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40",
    category: "Academic",
    subcategory: "Mathematics",
    replies: 28,
    views: 580,
    lastActivity: "1 day ago",
    isPinned: false,
    tags: ["Study Group", "Mathematics", "Exam Prep"],
    preview: "Looking for serious students to form a study group for the upcoming advanced mathematics exam. We'll meet twice a week..."
  },
  {
    id: 4,
    title: "Campus Food Recommendations",
    author: "Emily Rodriguez",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40",
    category: "General",
    subcategory: "Campus Life",
    replies: 67,
    views: 2100,
    lastActivity: "3 hours ago",
    isPinned: false,
    tags: ["Food", "Campus", "Recommendations"],
    preview: "What are your favorite spots to eat on and around campus? I'm new here and looking for some good recommendations..."
  },
  {
    id: 5,
    title: "Internship Opportunities Discussion",
    author: "Michael Kim",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40",
    category: "Career",
    subcategory: "Internships",
    replies: 89,
    views: 3200,
    lastActivity: "6 hours ago",
    isPinned: true,
    tags: ["Internship", "Career", "Summer"],
    preview: "Let's share internship opportunities and experiences. I'll start with some great companies that are currently hiring..."
  }
];

const categories = [
  { name: "All", count: 234 },
  { name: "Academic", count: 89 },
  { name: "Clubs", count: 67 },
  { name: "Career", count: 45 },
  { name: "General", count: 33 }
];

const Forum = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  const filteredThreads = mockThreads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || thread.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === "popular") return b.views - a.views;
    if (sortBy === "replies") return b.replies - a.replies;
    return 0; // Keep original order for "recent"
  });

  // Separate pinned and regular threads
  const pinnedThreads = sortedThreads.filter(thread => thread.isPinned);
  const regularThreads = sortedThreads.filter(thread => !thread.isPinned);

  return (
    <Layout>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              University Forum
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect, discuss, and share knowledge with fellow students
            </p>
          </div>
          <Button size="lg" className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Start New Thread
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-0 bg-gradient-card mb-6">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-0 bg-gradient-card">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Threads</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-medium">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Posts</span>
                  <span className="font-medium">89</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={sortBy} onValueChange={setSortBy} className="w-auto">
                <TabsList>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="replies">Most Replies</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Pinned Threads */}
            {pinnedThreads.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Pinned Discussions
                </h2>
                <div className="space-y-4">
                  {pinnedThreads.map((thread) => (
                    <Card key={`pinned-${thread.id}`} className="p-6 border-0 bg-gradient-hero">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <img src={thread.authorAvatar} alt={thread.author} />
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-primary-foreground hover:text-primary-foreground/80 cursor-pointer">
                                {thread.title}
                              </h3>
                              <p className="text-sm text-primary-foreground/70">
                                by {thread.author} in {thread.subcategory}
                              </p>
                            </div>
                            <Badge className="bg-warning text-warning-foreground">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          </div>
                          <p className="text-primary-foreground/80 text-sm mb-3 line-clamp-2">
                            {thread.preview}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {thread.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-primary-foreground/70">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {thread.replies}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {thread.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {thread.lastActivity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Threads */}
            <div className="space-y-4">
              {regularThreads.map((thread) => (
                <Card key={thread.id} className="p-6 border-0 bg-gradient-card hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <img src={thread.authorAvatar} alt={thread.author} />
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors cursor-pointer">
                            {thread.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {thread.author} in {thread.subcategory}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {thread.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {thread.preview}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {thread.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {thread.replies}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {thread.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {thread.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Discussions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Forum;