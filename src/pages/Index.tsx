import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ClubsPreview from "@/components/ClubsPreview";
import EventsPreview from "@/components/EventsPreview";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {



  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <HeroSection />
        




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

            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
