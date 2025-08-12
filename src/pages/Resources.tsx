import { useState } from "react";
import { Search, Download, Eye, BookOpen, FileText, Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";

const mockResources = [
  {
    id: 1,
    title: "Computer Science Study Materials",
    description: "Comprehensive collection of algorithms, data structures, and programming resources",
    type: "PDF",
    category: "Academic",
    size: "12.5 MB",
    downloads: 1250,
    uploadDate: "2024-07-15",
    tags: ["Programming", "Algorithms", "Data Structures"],
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"
  },
  {
    id: 2,
    title: "Photography Workshop Videos",
    description: "Professional photography techniques and editing tutorials",
    type: "Video",
    category: "Creative",
    size: "450 MB",
    downloads: 890,
    uploadDate: "2024-07-10",
    tags: ["Photography", "Tutorial", "Creative"],
    thumbnail: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=200"
  },
  {
    id: 3,
    title: "Business Plan Templates",
    description: "Ready-to-use templates for entrepreneurship and business courses",
    type: "Document",
    category: "Business",
    size: "2.1 MB",
    downloads: 670,
    uploadDate: "2024-07-08",
    tags: ["Business", "Templates", "Entrepreneurship"],
    thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200"
  },
  {
    id: 4,
    title: "Lab Report Guidelines",
    description: "Formatting and structure guidelines for scientific lab reports",
    type: "PDF",
    category: "Science",
    size: "1.8 MB",
    downloads: 1100,
    uploadDate: "2024-07-05",
    tags: ["Science", "Lab", "Guidelines"],
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=200"
  }
];

const categories = ["All", "Academic", "Creative", "Business", "Science", "Career"];
const resourceTypes = ["All", "PDF", "Video", "Document", "Image", "Audio"];

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    const matchesType = selectedType === "All" || resource.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="h-4 w-4" />;
      case "Video": return <Video className="h-4 w-4" />;
      case "Image": return <Image className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Course Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access study materials, templates, guides, and educational content shared by the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-auto">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {resourceTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          Showing {filteredResources.length} resources
        </p>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-card overflow-hidden">
              <div className="relative">
                <img
                  src={resource.thumbnail}
                  alt={resource.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/80 flex items-center gap-1">
                    {getTypeIcon(resource.type)}
                    {resource.type}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-background/80">
                    {resource.category}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                  {resource.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {resource.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{resource.size}</span>
                  <span>{resource.downloads} downloads</span>
                  <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Upload Section */}
        <div className="text-center mt-12">
          <Card className="p-8 bg-gradient-accent border-0">
            <h2 className="text-2xl font-bold text-accent-foreground mb-4">
              Share Your Resources
            </h2>
            <p className="text-accent-foreground/80 mb-6">
              Help fellow students by uploading your study materials, notes, and useful resources
            </p>
            <Button variant="secondary" size="lg">
              Upload Resource
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Resources;