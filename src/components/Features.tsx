
import React from "react";
import { Search, UserRound, Calendar, Heart } from "lucide-react";

const Features = () => {
  const features = [
    {
      id: 1,
      icon: <Search className="h-10 w-10 text-medblue-600" />,
      title: "Find Specialists",
      description: "Search for providers who specialize in prescribing the exact medications you need."
    },
    {
      id: 2,
      icon: <UserRound className="h-10 w-10 text-medblue-600" />,
      title: "Qualified Providers",
      description: "Connect with board-certified prescribers with expertise in your specific treatment."
    },
    {
      id: 3,
      icon: <Calendar className="h-10 w-10 text-medblue-600" />,
      title: "Easy Scheduling",
      description: "Book appointments online with available providers in your area."
    },
    {
      id: 4,
      icon: <Heart className="h-10 w-10 text-medblue-600" />,
      title: "Continuity of Care",
      description: "Build ongoing relationships with providers who understand your medication needs."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-medblue-800">
            Superior Experience for Medication Access
          </h2>
          <p className="text-lg text-gray-600">
            Our platform focuses on connecting patients with the right prescribers 
            for their specific medication needs, simplifying the healthcare journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="p-6 rounded-xl shadow-sm border border-gray-100 card-hover bg-gradient-to-br from-white to-gray-50"
            >
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-medblue-50 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-medblue-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
