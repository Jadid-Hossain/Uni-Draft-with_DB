import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Menu,
  X,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Briefcase,
  Bot,
  User,
  Settings,
  LogOut,
  Shield,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Clubs", href: "/clubs", icon: Users, requireAuth: true },
    { name: "Events", href: "/events", icon: Calendar, requireAuth: true },
    { name: "Forums", href: "/forum", icon: MessageSquare, requireAuth: true },
    {
      name: "Resources",
      href: "/resources",
      icon: BookOpen,
      requireAuth: true,
    },
    { name: "Lost & Found", href: "/lost-found", icon: Search, requireAuth: true },
    { name: "Careers", href: "/careers", icon: Briefcase, requireAuth: true },
    { name: "Assistant", href: "/assistant", icon: Bot, requireAuth: true },
  ];

  const authenticatedNavItems = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    ...(user?.role !== "admin"
      ? [{ name: "Profile", href: "/profile", icon: User }]
      : []),
    ...(user?.role === "admin"
      ? [{ name: "Admin", href: "/admin", icon: Shield }]
      : []),
    ...(user?.role === "faculty"
      ? [{ name: "Manage Events", href: "/events", icon: Calendar }]
      : []),
    { name: "Club Dashboard", href: "/club-dashboard", icon: Users },
  ];

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (item.requireAuth && !isAuthenticated) {
      e.preventDefault();
      navigate("/signin");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
          >
            <img src="/favicon.svg" alt="BRACU Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
                BRACU SAM Portal
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Student Activity Management Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            {isAuthenticated &&
              authenticatedNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform"
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                        <AvatarImage src="" alt={user?.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                          {user?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-background/95 backdrop-blur-lg border border-border/50"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.full_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      {/* <Link to="*" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link> */}
                    </DropdownMenuItem>
                    {user?.role !== "admin" && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/profile"
                          className="flex items-center cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="flex items-center cursor-pointer"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === "faculty" && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/events"
                          className="flex items-center cursor-pointer"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Manage Events</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:scale-105 transition-transform"
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  asChild
                  className="shadow-lg hover:shadow-xl"
                >
                  <Link to="/signup">Join Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in bg-background/95 backdrop-blur-lg">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  onClick={(e) => {
                    handleNavClick(item, e);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              {isAuthenticated &&
                authenticatedNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              <div className="pt-3 mt-3 border-t border-border/50 flex flex-col space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user?.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                          {user?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      asChild
                    >
                      <Link
                        to="/signin"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      variant="hero"
                      size="sm"
                      className="justify-start"
                      asChild
                    >
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Join Now
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
