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
  Package,
  Plus,
  Minus,
  Menu,
  X,
  ArrowRight,
  Smartphone,
  Monitor,
  Bell,
} from "lucide-react";
import {
  laundryServices,
  getPopularServices,
  getSortedServices,
  searchServices,
  LaundryService,
} from "@/data/laundryServices";
import PhoneOtpAuthModal from "./PhoneOtpAuthModal";
import EnhancedBookingHistoryModal from "./EnhancedBookingHistoryModal";
import UserMenuDropdown from "./UserMenuDropdown";
import DebugPanel from "./DebugPanel";
import BookingDebugPanel from "./BookingDebugPanel";
import ConnectionStatus from "./ConnectionStatus";
import NotificationPanel from "./NotificationPanel";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { saveCartData, getCartData } from "@/utils/formPersistence";

interface ResponsiveLaundryHomeProps {
  currentUser?: any;
  userLocation?: string;
  onLoginSuccess: (user: any) => void;
  onViewCart: () => void;
  onViewBookings: () => void;
  onLogout?: () => void;
}

const ResponsiveLaundryHome: React.FC<ResponsiveLaundryHomeProps> = ({
  currentUser,
  userLocation,
  onLoginSuccess,
  onViewCart,
  onViewBookings,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showBookingDebugPanel, setShowBookingDebugPanel] = useState(false);
  const dvhostingSmsService = DVHostingSmsService.getInstance();

  // Add keyboard shortcut for booking debug panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+B to open booking debug panel
      if (event.ctrlKey && event.shiftKey && event.key === "B") {
        event.preventDefault();
        setShowBookingDebugPanel(true);
      }
      // Ctrl+Shift+D to open debug panel
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setShowDebugPanel(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{ [key: string]: number }>(() => {
    // Load cart from localStorage on initialization
    return getCartData();
  });
  const [deliveryTime, setDeliveryTime] = useState("2-3 hours");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      saveCartData(cart);
    }
  }, [cart]);

  // Simplified mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;

      // Simplified and more reliable mobile detection
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
          userAgent,
        );
      const isMobileViewport = width <= 768;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Use OR logic - any one of these conditions makes it mobile
      const isMobileDevice =
        isMobileUserAgent ||
        isMobileViewport ||
        (isTouchDevice && width <= 1024);

      setIsMobile(isMobileDevice);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    window.addEventListener("orientationchange", checkScreenSize);
    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("orientationchange", checkScreenSize);
    };
  }, []);

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
      services = getSortedServices();
    } else {
      const category = laundryServices.find((c) => c.id === selectedCategory);
      services = category
        ? category.services.sort((a, b) => {
            // Sort by popular first, then alphabetically
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return a.name.localeCompare(b.name);
          })
        : [];
    }

    return services;
  };

  const handleLogin = () => {
    console.log("handleLogin clicked, setting showAuthModal to true");
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: any) => {
    setShowAuthModal(false);
    onLoginSuccess(user);
  };

  const handleLogout = () => {
    // DVHosting SMS service doesn't have logout method - user logout handled at app level
    if (onLogout) {
      onLogout();
    }
  };

  const handleViewBookings = () => {
    if (currentUser) {
      // Use parent navigation to go to bookings view
      onViewBookings();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleUpdateProfile = (updatedUser: any) => {
    // Update user data in the parent component or storage
    onLoginSuccess(updatedUser);
  };

  const handleBookService = () => {
    // Scroll to services section
    const servicesSection = document.getElementById("services-section");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const EmptyStateCard = () => (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden mx-auto max-w-md">
      <CardContent className="text-center py-12 px-6">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          No Services Selected
        </h3>

        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Browse our professional laundry services and add them to your cart to
          get started.
        </p>

        <Button
          onClick={handleBookService}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Browse Services
        </Button>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    // Mobile Interface
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white sticky top-0 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {currentUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={handleViewBookings}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <div className="text-white">
                      <NotificationPanel />
                    </div>
                  </>
                )}
              </div>

              <div>
                <h1 className="text-lg font-bold">CleanCare</h1>
                <div className="flex items-center gap-1 text-xs text-green-100">
                  <Smartphone className="h-3 w-3" />
                  <span>Mobile</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification button removed as per user requirements */}

              {currentUser ? (
                <UserMenuDropdown
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onViewBookings={handleViewBookings}
                  onUpdateProfile={handleUpdateProfile}
                />
              ) : (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Mobile signin button clicked");
                    handleLogin();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 active:bg-white/30 px-4 py-2 min-h-[48px] min-w-[80px] mobile-button mobile-touch rounded-lg transition-all duration-200 font-medium"
                  type="button"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm">Sign In</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-40">
              <div className="p-4 space-y-3">
                <Button
                  onClick={() => {
                    setShowMobileMenu(false);
                    if (currentUser) {
                      onViewBookings();
                    } else {
                      handleLogin();
                    }
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-700"
                >
                  <User className="mr-3 h-4 w-4" />
                  {currentUser ? "My Bookings" : "Sign In"}
                </Button>
                <Button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleBookService();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-700"
                >
                  <ShoppingBag className="mr-3 h-4 w-4" />
                  Browse Services
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Content */}
        <div className="p-4 space-y-4">
          {/* Delivery Time & Location */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                🕐 Delivery in {deliveryTime}
              </span>
              <Badge className="bg-white/20 text-white">Available</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{userLocation || "Detect Location"}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-800 rounded-xl flex items-center px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Input
              placeholder="Search laundry services"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 p-0 text-sm"
            />
            <Mic className="h-5 w-5 text-gray-400 ml-3" />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 rounded-xl text-xs px-3 py-2 ${
                selectedCategory === "all"
                  ? "bg-white text-green-600"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              All
            </Button>

            {laundryServices.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 rounded-xl text-xs px-3 py-2 ${
                  selectedCategory === category.id
                    ? "bg-white text-green-600"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                <span className="whitespace-nowrap">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div
          id="services-section"
          className="bg-white rounded-t-3xl min-h-screen p-4"
        >
          {getFilteredServices().length === 0 ? (
            <EmptyStateCard />
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-20">
              {getFilteredServices().map((service) => {
                const quantity = cart[service.id] || 0;

                return (
                  <Card
                    key={service.id}
                    className="border-0 shadow-lg rounded-2xl overflow-hidden"
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-3 flex items-center justify-center">
                        <span className="text-3xl">
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
                        <h4 className="font-semibold text-xs text-gray-900 leading-tight line-clamp-2">
                          {service.name}
                        </h4>

                        <div className="text-xs text-gray-600">
                          {service.category}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-gray-900">
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

                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(service.id)}
                              className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="font-semibold text-green-700 text-sm">
                              {quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addToCart(service.id)}
                              className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(service.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs py-2"
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
          )}
        </div>

        {/* Floating Cart Button - Mobile */}
        {getCartItemCount() > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={onViewCart}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                View Cart
              </span>
            </Button>
          </div>
        )}
        {/* Empty State */}
        {!getPopularServices().length && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to CleanCare Pro
            </h2>
            <p className="text-gray-600 mb-6">
              Your trusted home services partner
            </p>
            <Button
              onClick={handleBookService}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-8 py-3 rounded-xl text-lg font-medium"
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Auth Modal */}
        <PhoneOtpAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Desktop Interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    CleanCare Pro
                  </h1>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Monitor className="h-3 w-3" />
                    <span>Desktop</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Delivery in {deliveryTime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{userLocation || "Set Location"}</span>
              </div>

              {currentUser && (
                <Button variant="ghost" size="sm" onClick={handleViewBookings}>
                  <Package className="h-4 w-4 mr-2" />
                  Bookings
                </Button>
              )}

              {currentUser && <NotificationPanel />}

              {currentUser ? (
                <UserMenuDropdown
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onViewBookings={handleViewBookings}
                  onUpdateProfile={handleUpdateProfile}
                />
              ) : (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Desktop signin button clicked");
                    handleLogin();
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer"
                  type="button"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl text-white p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Professional Laundry & Dry Cleaning
              </h2>
              <p className="text-green-100 mb-6 text-lg">
                Quality service delivered to your doorstep in {deliveryTime}
              </p>
              <Button
                onClick={handleBookService}
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl"
              >
                Browse Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {laundryServices.slice(0, 4).map((category) => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <span className="text-3xl block mb-2">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for laundry services..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-12 py-3 rounded-xl border-gray-200 focus:border-green-500"
              />
              <Mic className="absolute right-4 top-3 h-5 w-5 text-gray-400 cursor-pointer hover:text-green-500" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 rounded-xl ${
                selectedCategory === "all"
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-50 hover:border-green-200"
              }`}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              All Services
            </Button>

            {laundryServices.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 rounded-xl ${
                  selectedCategory === category.id
                    ? "bg-green-600 text-white"
                    : "hover:bg-green-50 hover:border-green-200"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div id="services-section">
          {getFilteredServices().length === 0 ? (
            <div className="flex justify-center py-12">
              <EmptyStateCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {getFilteredServices().map((service) => {
                const quantity = cart[service.id] || 0;

                return (
                  <Card
                    key={service.id}
                    className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-5xl">
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

                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-gray-900 leading-tight">
                          {service.name}
                        </h4>

                        <div className="text-sm text-gray-600">
                          {service.category}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{service.price}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              {service.unit}
                            </span>
                          </div>

                          {service.popular && (
                            <Badge className="bg-green-100 text-green-700">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                        </div>

                        {service.minQuantity && service.minQuantity > 1 && (
                          <div className="text-sm text-orange-600">
                            Min {service.minQuantity}
                            {service.unit.includes("kg") ? "kg" : " pcs"}
                          </div>
                        )}

                        {quantity > 0 ? (
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(service.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <span className="font-semibold text-green-700 text-lg">
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold"
                          >
                            ADD TO CART
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Button - Desktop */}
        {getCartItemCount() > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              onClick={onViewCart}
              className="bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 px-6 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingBag className="h-5 w-5" />
              <div>
                <div className="font-semibold">
                  {getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}
                </div>
                <div className="text-sm opacity-90">₹{getCartTotal()}</div>
              </div>
            </Button>
          </div>
        )}

        {/* Authentication Modal */}
        {console.log(
          "Rendering PhoneOtpAuthModal, showAuthModal:",
          showAuthModal,
        )}
        <PhoneOtpAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            console.log("PhoneOtpAuthModal onClose called");
            setShowAuthModal(false);
          }}
          onSuccess={handleAuthSuccess}
        />

        {/* Removed local booking history modal - using main navigation */}

        {/* Debug Panel */}
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />

        {/* Booking Debug Panel */}
        <BookingDebugPanel
          currentUser={currentUser}
          isOpen={showBookingDebugPanel}
          onClose={() => setShowBookingDebugPanel(false)}
        />

        {/* Connection Status */}
        <ConnectionStatus />
      </div>
    </div>
  );
};
export default ResponsiveLaundryHome;
