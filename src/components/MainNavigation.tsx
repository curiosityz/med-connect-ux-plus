
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth
import { useTheme } from "next-themes"; // Import useTheme
import { Moon, Sun, LogOut, UserCircle, LogIn } from "lucide-react"; // Icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MainNavigation = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to home after sign out
  };

  // Preload theme to avoid flash on initial load if possible
  useEffect(() => {
    // `theme` from `useTheme` might be undefined initially if system theme is used
    // and then resolved. This effect doesn't do much for SSR/SSG but helps client-side.
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (theme !== currentTheme) {
      // setTheme(currentTheme); // This might cause an extra render, next-themes handles it well.
    }
  }, [theme, setTheme]);


  const ThemeToggleButton = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );

  return (
    <header className="border-b bg-card sticky top-0 z-50"> {/* Increased z-index */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <svg // Your existing SVG logo
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary" // Use theme-aware color
          >
            <path d="m8 16 2-6 2 6" />
            <path d="M12 10v6" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
          <span className="text-xl font-bold text-primary">MedConnect</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground/80 hover:text-primary font-medium">
            Home
          </Link>
          {/* The /medications link seems to be a duplicate of /find-providers based on label */}
          {/* <Link to="/medications" className="text-foreground/80 hover:text-primary font-medium">
            Find Prescribers
          </Link> */}
          <Link to="/find-providers" className="text-foreground/80 hover:text-primary font-medium">
            Provider Search
          </Link>
          {/* <Link to="/about" className="text-foreground/80 hover:text-primary font-medium">
            About
          </Link> */}
        </nav>

        <div className="flex items-center space-x-3">
          <ThemeToggleButton />
          {authLoading ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded-md"></div> // Skeleton for auth buttons
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.email || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.id.substring(0,15)}...
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link to="/manage-locations">Manage Locations</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/auth">Sign Up</Link>
              </Button>
               <Button variant="ghost" size="icon" asChild className="sm:hidden">
                 <Link to="/auth" aria-label="Sign In / Sign Up">
                   <LogIn className="h-5 w-5" />
                 </Link>
               </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainNavigation;
