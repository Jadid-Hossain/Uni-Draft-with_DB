import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Users, Calendar, MapPin, Star, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const mockClub = {
  id: 1,
  name: "Computer Science Society",
  description: "A community of programming enthusiasts, tech innovators, and future software engineers. We organize hackathons, tech talks, coding competitions, and industry networking events.",
  category: "Academic",
  members: 245,
  image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800",
  tags: ["Programming", "Tech", "Innovation"],
  rating: 4.8,
  president: {
    name: "Alex Chen",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40",
    contact: "alex.chen@university.edu"
  },
  activities: [
    "Weekly coding sessions",
    "Monthly hackathons",
    "Guest speaker series",
    "Industry networking events",
    "Open source contributions"
  ],
  requirements: [
    "Current university student",
    "Basic programming knowledge",
    "Commitment to participate actively",
    "Attendance at orientation session"
  ],
  meetings: {
    frequency: "Weekly",
    day: "Thursdays",
    time: "6:00 PM",
    location: "Computer Lab A"
  }
};

const JoinClub = () => {
  const { id } = useParams();
  const [applicationData, setApplicationData] = useState({
    motivation: "",
    experience: "",
    skills: "",
    availability: "",
    expectations: "",
    portfolio: null as File | null,
    resume: null as File | null,
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setApplicationData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setApplicationData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement application submission with Supabase
    console.log("Application submitted:", applicationData);
  };

  return (
    <Layout>
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/clubs" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clubs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Club Information */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-gradient-card overflow-hidden">
              <img
                src={mockClub.image}
                alt={mockClub.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{mockClub.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{mockClub.rating}</span>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-3">{mockClub.name}</h1>
                <p className="text-muted-foreground mb-4">{mockClub.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{mockClub.members} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{mockClub.meetings.frequency} - {mockClub.meetings.day}s at {mockClub.meetings.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{mockClub.meetings.location}</span>
                  </div>
                </div>

                {/* Club President */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Club President</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <img src={mockClub.president.avatar} alt={mockClub.president.name} />
                    </Avatar>
                    <div>
                      <p className="font-medium">{mockClub.president.name}</p>
                      <p className="text-sm text-muted-foreground">{mockClub.president.contact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Club Activities */}
            <Card className="mt-6 border-0 bg-gradient-card p-6">
              <h3 className="font-semibold mb-4">Club Activities</h3>
              <ul className="space-y-2">
                {mockClub.activities.map((activity, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {activity}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Requirements */}
            <Card className="mt-6 border-0 bg-gradient-card p-6">
              <h3 className="font-semibold mb-4">Membership Requirements</h3>
              <ul className="space-y-2">
                {mockClub.requirements.map((requirement, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-gradient-card p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Join {mockClub.name}</h2>
                <p className="text-muted-foreground">
                  Tell us about yourself and why you'd like to join our community
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Motivation */}
                <div className="space-y-2">
                  <Label htmlFor="motivation">Why do you want to join this club? *</Label>
                  <Textarea
                    id="motivation"
                    placeholder="Share your motivation and what you hope to gain from joining..."
                    value={applicationData.motivation}
                    onChange={(e) => handleInputChange("motivation", e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Relevant Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Describe any relevant experience, projects, or background..."
                    value={applicationData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills and Interests</Label>
                  <Textarea
                    id="skills"
                    placeholder="List your technical skills, programming languages, interests..."
                    value={applicationData.skills}
                    onChange={(e) => handleInputChange("skills", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability and Commitment *</Label>
                  <Textarea
                    id="availability"
                    placeholder="Describe your availability for meetings, events, and activities..."
                    value={applicationData.availability}
                    onChange={(e) => handleInputChange("availability", e.target.value)}
                    className="min-h-[80px]"
                    required
                  />
                </div>

                {/* Expectations */}
                <div className="space-y-2">
                  <Label htmlFor="expectations">What do you expect from this club?</Label>
                  <Textarea
                    id="expectations"
                    placeholder="Share your expectations and goals..."
                    value={applicationData.expectations}
                    onChange={(e) => handleInputChange("expectations", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Portfolio/Projects (Optional)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your portfolio or project samples
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.zip"
                        onChange={(e) => handleFileUpload("portfolio", e.target.files?.[0] || null)}
                        className="hidden"
                        id="portfolio-upload"
                      />
                      <Label htmlFor="portfolio-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" type="button">
                          Choose File
                        </Button>
                      </Label>
                      {applicationData.portfolio && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {applicationData.portfolio.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Resume/CV (Optional)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your resume or CV
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload("resume", e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-upload"
                      />
                      <Label htmlFor="resume-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" type="button">
                          Choose File
                        </Button>
                      </Label>
                      {applicationData.resume && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {applicationData.resume.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={applicationData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to attend the orientation session and actively participate in club activities. 
                    I understand that my application will be reviewed and I may be contacted for an interview.
                  </Label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={!applicationData.agreeToTerms}
                  >
                    Submit Application
                  </Button>
                  <Button variant="outline" size="lg" type="button" asChild>
                    <Link to="/clubs">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Application Process */}
            <Card className="mt-6 border-0 bg-gradient-accent p-6">
              <h3 className="font-semibold text-accent-foreground mb-4">Application Process</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-foreground text-accent rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <span className="text-accent-foreground">Submit your application</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-foreground text-accent rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <span className="text-accent-foreground">Application review (3-5 days)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-foreground text-accent rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <span className="text-accent-foreground">Interview/viva (if selected)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-foreground text-accent rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <span className="text-accent-foreground">Membership confirmation</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JoinClub;