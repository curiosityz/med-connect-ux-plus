
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-medblue-100 to-white">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-medblue-800 leading-tight animate-fade-in">
            Connect with Medication Specialists
          </h1>
          <p className="text-lg text-gray-700 animate-fade-in" style={{animationDelay: "0.2s"}}>
            Find prescribers specializing in the exact medications you need. 
            Simplified appointments, expert care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in" style={{animationDelay: "0.3s"}}>
            <Button asChild size="lg" className="bg-medblue-600 hover:bg-medblue-700 text-lg font-medium">
              <Link to="/medications">Find Medications</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-medteal-500 text-medteal-600 hover:bg-medteal-50 text-lg font-medium">
              <Link to="/providers">Browse Providers</Link>
            </Button>
          </div>
          
          <div className="relative mt-8 max-w-md animate-fade-in" style={{animationDelay: "0.4s"}}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text"
              placeholder="Search medications or conditions..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-medblue-500 focus:border-medblue-500"
            />
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-medteal-100 rounded-full z-0"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-medblue-100 rounded-full z-0"></div>
            <div className="relative z-10 bg-white rounded-xl shadow-xl p-4 transform rotate-1 animate-fade-in" style={{animationDelay: "0.5s"}}>
              <div className="bg-medblue-50 p-6 rounded-lg">
                <h3 className="font-bold text-xl mb-2 text-medblue-800">Personalized Provider Matching</h3>
                <p className="text-gray-600 mb-4">Match with providers specialized in your specific medication needs</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-medblue-200 rounded-full"></div>
                  <div>
                    <p className="font-medium text-medblue-800">Dr. Sarah Chen</p>
                    <p className="text-sm text-gray-600">Psychiatrist - Medication Specialist</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-medteal-600 bg-medteal-50 px-2 py-1 rounded">4.9 ★</span>
                    <span className="text-sm text-gray-500 ml-2">98% match</span>
                  </div>
                  <button className="text-sm font-medium text-medblue-600 hover:text-medblue-700">View Profile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
