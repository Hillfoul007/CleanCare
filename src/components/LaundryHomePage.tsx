import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  ShoppingBag,
  Clock,
  Star,
  Mic,
  User,
  Bell,
  Plus,
  Minus,
} from "lucide-react";
import {
  laundryServices,
  getPopularServices,
  searchServices,
  LaundryService,
} from "@/data/laundryServices";
import OTPAuth from "./OTPAuth";
import ApiTest from "./ApiTest";
import { OTPAuthService } from "@/services/otpAuthService";

interface LaundryHomePageProps {
  currentUser?: any;
  userLocation?: string;
  onLoginSuccess: (user: any) => void;
  onViewCart: () => void;
  onViewBookings: () => void;
}

const LaundryHomePage: React.FC<LaundryHomePageProps> = ({
  currentUser,
  userLocation,
  onLoginSuccess,
  onViewCart,
  onViewBookings,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("2-3 hours");

  const authService = OTPAuthService.getInstance();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("laundry_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("laundry_cart", JSON.stringify(cart));
  }, [cart]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const addToCart = (serviceId: string) => {
    setCart((prev) => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1,
    }));
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[serviceId] > 1) {
        newCart[serviceId] -= 1;
      } else {
        delete newCart[serviceId];
      }
      return newCart;
    });
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [serviceId, count]) => {
      const service = laundryServices
        .flatMap((cat) => cat.services)
        .find((s) => s.id === serviceId);
      return total + (service ? service.price * count : 0);
    }, 0);
  };

  const getFilteredServices = (): LaundryService[] => {
    let services: LaundryService[] = [];

    if (searchQuery) {
      services = searchServices(searchQuery);
    } else if (selectedCategory === "all") {
      services = getPopularServices();
    } else {
      const category = laundryServices.find((c) => c.id === selectedCategory);
      services = category ? category.services : [];
    }

    return services;
  };

  const handleLogin = () => {
    if (!currentUser) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="bg-green-600 bg-opacity-80 rounded-full px-4 py-2">
            <span className="text-white font-semibold text-sm">
              🕐 {deliveryTime}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="bg-green-700 bg-opacity-50 hover:bg-green-700 hover:bg-opacity-70 text-white rounded-full w-10 h-10 p-0"
            >
              <Bell className="h-4 w-4" />
            </Button>

            {currentUser ? (
              <Button
                onClick={onViewBookings}
                className="bg-green-700 bg-opacity-50 hover:bg-green-700 hover:bg-opacity-70 text-white rounded-full w-10 h-10 p-0"
              >
                <User className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-green-700 bg-opacity-50 hover:bg-green-700 hover:bg-opacity-70 text-white rounded-full w-10 h-10 p-0"
              >
                <User className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-2">
          <h1 className="text-white text-4xl font-bold">CleanCare in</h1>
          <h2 className="text-white text-4xl font-bold">
            {deliveryTime.split(" ")[0]} hours
          </h2>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-white text-lg font-medium">HOME</span>
          <span className="text-white">-</span>
          <span className="text-green-200 text-lg">
            {userLocation || "Select Location"}
          </span>
          <MapPin className="h-4 w-4 text-green-200" />
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="bg-gray-800 rounded-2xl flex items-center px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Input
              placeholder="Search laundry services"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 p-0"
            />
            <Mic className="h-5 w-5 text-gray-400 ml-3" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 rounded-xl ${
              selectedCategory === "all"
                ? "bg-white text-green-600"
                : "bg-green-700 bg-opacity-50 text-white hover:bg-green-700 hover:bg-opacity-70"
            }`}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            All
          </Button>

          {laundryServices.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 rounded-xl ${
                selectedCategory === category.id
                  ? "bg-white text-green-600"
                  : "bg-green-700 bg-opacity-50 text-white hover:bg-green-700 hover:bg-opacity-70"
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Powered By */}
      <div className="text-center mb-6">
        <span className="text-white text-sm font-medium tracking-wider">
          POWERED BY CleanCare
        </span>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-t-3xl min-h-screen p-4">
        {searchQuery && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search Results for "{searchQuery}"
            </h3>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pb-20">
          {getFilteredServices().map((service) => {
            const quantity = cart[service.id] || 0;

            return (
              <Card
                key={service.id}
                className="border-0 shadow-lg rounded-2xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-3 flex items-center justify-center">
                    <span className="text-4xl">
                      {service.category.includes("Men")
                        ? "👔"
                        : service.category.includes("Women")
                          ? "👗"
                          : service.category.includes("Woolen")
                            ? "🧥"
                            : service.category.includes("Steam")
                              ? "🔥"
                              : service.category.includes("Iron")
                                ? "🏷️"
                                : "👕"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                      {service.name}
                    </h4>

                    <div className="text-xs text-gray-600">
                      {service.category}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{service.price}
                        </span>
                        <span className="text-xs text-gray-600 ml-1">
                          {service.unit}
                        </span>
                      </div>

                      {service.popular && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>

                    {service.minQuantity && service.minQuantity > 1 && (
                      <div className="text-xs text-orange-600">
                        Min {service.minQuantity}
                        {service.unit.includes("kg") ? "kg" : " pcs"}
                      </div>
                    )}

                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(service.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="font-semibold text-green-700">
                          {quantity}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addToCart(service.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(service.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm py-2"
                      >
                        ADD
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {getFilteredServices().length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No services found" : "No services available"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? `Try searching for something else`
                : "Please select a category to view services"}
            </p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={onViewCart}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-semibold">
                {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
              </span>
            </div>

            <div className="text-right">
              <div className="font-bold">₹{getCartTotal()}</div>
              <div className="text-xs opacity-90">View Cart</div>
            </div>
          </Button>
        </div>
      )}

      {/* OTP Auth Modal */}
      <OTPAuth
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={onLoginSuccess}
      />

      {/* API Test Component - for debugging */}
      {process.env.NODE_ENV === "development" && <ApiTest />}
    </div>
  );
};

export default LaundryHomePage;
