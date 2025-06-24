import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Wrench,
  Zap,
  Droplets,
  Car,
  Shield,
  Paintbrush,
  Truck,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
} from "lucide-react";

interface ServiceCategoriesProps {
  onServiceSelect: (service: any) => void;
  onMultipleServicesSelect: (services: any[]) => void;
}

const MobileServiceCategories: React.FC<ServiceCategoriesProps> = ({
  onServiceSelect,
  onMultipleServicesSelect,
}) => {
  const [cart, setCart] = useState<any[]>([]);

  const categories = [
    {
      id: "home-repair",
      title: "Home Repair",
      icon: Home,
      color: "from-blue-500 to-blue-600",
      services: [
        {
          name: "Plumbing Repair",
          provider: "AquaFix Pro",
          price: 149,
          rating: 4.8,
          duration: "1-2 hours",
        },
        {
          name: "Electrical Work",
          provider: "Spark Masters",
          price: 199,
          rating: 4.9,
          duration: "2-3 hours",
        },
        {
          name: "Appliance Repair",
          provider: "Fix-It Express",
          price: 129,
          rating: 4.7,
          duration: "1-2 hours",
        },
      ],
    },
    {
      id: "cleaning",
      title: "Cleaning",
      icon: Shield,
      color: "from-green-500 to-green-600",
      services: [
        {
          name: "House Cleaning",
          provider: "Spotless Home",
          price: 89,
          rating: 4.9,
          duration: "2-3 hours",
        },
        {
          name: "Deep Cleaning",
          provider: "Deep Clean Pro",
          price: 179,
          rating: 4.8,
          duration: "4-5 hours",
        },
        {
          name: "Carpet Cleaning",
          provider: "FreshCarpet Co",
          price: 119,
          rating: 4.7,
          duration: "2-3 hours",
        },
      ],
    },
    {
      id: "installation",
      title: "Installation",
      icon: Wrench,
      color: "from-purple-500 to-purple-600",
      services: [
        {
          name: "TV Mounting",
          provider: "Mount Masters",
          price: 99,
          rating: 4.8,
          duration: "1 hour",
        },
        {
          name: "Furniture Assembly",
          provider: "Build It Right",
          price: 79,
          rating: 4.7,
          duration: "1-2 hours",
        },
        {
          name: "Smart Home Setup",
          provider: "Tech Install Pro",
          price: 249,
          rating: 4.9,
          duration: "2-3 hours",
        },
      ],
    },
    {
      id: "maintenance",
      title: "Maintenance",
      icon: Zap,
      color: "from-orange-500 to-orange-600",
      services: [
        {
          name: "AC Service",
          provider: "Cool Comfort",
          price: 129,
          rating: 4.8,
          duration: "1-2 hours",
        },
        {
          name: "Geyser Service",
          provider: "Hot Water Pro",
          price: 99,
          rating: 4.7,
          duration: "1 hour",
        },
        {
          name: "Chimney Cleaning",
          provider: "Clean Smoke",
          price: 149,
          rating: 4.6,
          duration: "2 hours",
        },
      ],
    },
  ];

  const addToCart = (service: any, category: any) => {
    const cartItem = {
      ...service,
      category: category.title,
      quantity: 1,
      id: `${category.id}-${service.name}`,
    };

    const existingItem = cart.find((item) => item.id === cartItem.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === cartItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, cartItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const getItemQuantity = (serviceId: string, categoryId: string) => {
    const itemId = `${categoryId}-${serviceId}`;
    const item = cart.find((item) => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 py-8 sm:py-12 rounded-b-3xl mb-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Professional
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Home Services
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 leading-relaxed">
            Book trusted professionals for all your home needs
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            <Shield className="h-4 w-4" />
            <span>Verified Professionals</span>
            <span>•</span>
            <Star className="h-4 w-4" />
            <span>4.8+ Rating</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>Same Day Service</span>
          </div>
        </div>
      </div>

      {/* Service Categories - Mobile Grid */}
      <div className="px-4 space-y-6">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <div key={category.id} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {category.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {category.services.length} services available
                  </p>
                </div>
              </div>

              {/* Services Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.services.map((service, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div
                        className={`h-2 bg-gradient-to-r ${category.color}`}
                      ></div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              by {service.provider}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              ${service.price}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="font-medium">
                              {service.rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{service.duration}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {getItemQuantity(service.name, category.id) > 0 ? (
                            <div className="flex items-center justify-between">
                              <Button
                                onClick={() =>
                                  updateQuantity(
                                    `${category.id}-${service.name}`,
                                    -1,
                                  )
                                }
                                variant="outline"
                                className="w-10 h-10 rounded-full p-0 border-2"
                              >
                                -
                              </Button>
                              <span className="text-lg font-semibold px-4">
                                {getItemQuantity(service.name, category.id)}
                              </span>
                              <Button
                                onClick={() =>
                                  updateQuantity(
                                    `${category.id}-${service.name}`,
                                    1,
                                  )
                                }
                                variant="outline"
                                className="w-10 h-10 rounded-full p-0 border-2"
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(service, category)}
                              className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-300`}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => onMultipleServicesSelect(cart)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl border-4 border-white"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Cart ({cart.length}) - ${getTotalPrice()}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileServiceCategories;
