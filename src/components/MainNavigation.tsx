import React from 'react';
import { Link } from 'react-router-dom';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { MainNavItem } from "@/types"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface MainNavigationProps {
  items?: MainNavItem[]
}

const MainNavigation: React.FC<MainNavigationProps> = ({ items }) => {
  const { isAuthenticated } = useClerkAuth();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          {/* Replace with your logo */}
          <span className="hidden font-bold sm:inline-block">{siteConfig.name}</span>
        </Link>
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          {items?.map(
            (item, index) =>
              item.href && (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base",
                    item.disabled && "cursor-not-allowed opacity-80"
                  )}
                >
                  {item.title}
                </Link>
              )
          )}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <SignedOut>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainNavigation;
