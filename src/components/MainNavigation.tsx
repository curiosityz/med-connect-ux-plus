
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MainNavigation = () => {
  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-medblue-600"
          >
            <path d="m8 16 2-6 2 6" />
            <path d="M12 10v6" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
          <span className="text-xl font-bold text-medblue-700">MedConnect</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-medblue-700 hover:text-medblue-500 font-medium">
            Home
          </Link>
          <Link to="/medications" className="text-gray-600 hover:text-medblue-500 font-medium">
            Find Medications
          </Link>
          <Link to="/providers" className="text-gray-600 hover:text-medblue-500 font-medium">
            Find Providers
          </Link>
          <Link to="/about" className="text-gray-600 hover:text-medblue-500 font-medium">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="outline" className="hidden md:flex">Sign In</Button>
          <Button className="bg-medblue-600 hover:bg-medblue-700">Sign Up</Button>
        </div>
      </div>
    </header>
  );
};

export default MainNavigation;
