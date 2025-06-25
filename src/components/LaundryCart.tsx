import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
} from "@/utils/notificationUtils";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { laundryServices, LaundryService } from "@/data/laundryServices";
import { OTPAuthService } from "@/services/otpAuthService";
import {
  saveBookingFormData,
  getBookingFormData,
  saveCartData,
  getCartData,
} from "@/utils/formPersistence";
import EnhancedAddressForm from "./EnhancedAddressForm";
import ProfessionalDateTimePicker from "./ProfessionalDateTimePicker";

interface LaundryCartProps {
  onBack: () => void;
  onProceedToCheckout: (cartData: any) => void;
  onLoginRequired?: () => void;
  currentUser?: any;
}

const LaundryCart: React.FC<LaundryCartProps> = ({
  onBack,
  onProceedToCheckout,
  onLoginRequired,
  currentUser,
}) => {
  const { addNotification } = useNotifications();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [addressData, setAddressData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const authService = OTPAuthService.getInstance();

  // Load saved form data on component mount
  useEffect(() => {
    const savedFormData = getBookingFormData();

    if (savedFormData.selectedDate) setSelectedDate(savedFormData.selectedDate);
    if (savedFormData.selectedTime) setSelectedTime(savedFormData.selectedTime);
    if (savedFormData.additionalDetails)
      setSpecialInstructions(savedFormData.additionalDetails);
    if (savedFormData.couponCode) setCouponCode(savedFormData.couponCode);
    if (savedFormData.appliedCoupon)
      setAppliedCoupon(savedFormData.appliedCoupon);
  }, []);

  // Auto-save form data when it changes
  useEffect(() => {
    saveBookingFormData({
      selectedDate,
      selectedTime,
      additionalDetails: specialInstructions,
      couponCode,
      appliedCoupon,
    });
  }, [
    selectedDate,
    selectedTime,
    specialInstructions,
    couponCode,
    appliedCoupon,
  ]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("laundry_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Pre-fill user data
    if (currentUser) {
      setPhoneNumber(currentUser.phone || "");
    }
  }, [currentUser]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("laundry_cart", JSON.stringify(cart));
  }, [cart]);

  const getAllServices = (): LaundryService[] => {
    return laundryServices.flatMap((category) => category.services);
  };

  const getServiceById = (id: string): LaundryService | undefined => {
    return getAllServices().find((service) => service.id === id);
  };

  const getCartItems = () => {
    return Object.entries(cart)
      .map(([serviceId, quantity]) => ({
        service: getServiceById(serviceId),
        quantity,
      }))
      .filter((item) => item.service && item.quantity > 0);
  };

  const getSubtotal = () => {
    return getCartItems().reduce((total, item) => {
      return total + item.service!.price * item.quantity;
    }, 0);
  };

  const getDeliveryCharge = () => {
    return 50; // Fixed delivery charge
  };

  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    return Math.round(subtotal * (appliedCoupon.discount / 100));
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryCharge() - getCouponDiscount();
  };

  const applyCoupon = () => {
    const validCoupons = {
      FIRST10: { discount: 10, description: "10% off on first order" },
      SAVE20: { discount: 20, description: "20% off" },
      WELCOME5: { discount: 5, description: "5% welcome discount" },
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: coupon.discount,
      });
      addNotification(
        createSuccessNotification(
          "Coupon Applied",
          `${coupon.discount}% discount applied successfully!`,
        ),
      );
    } else {
      addNotification(
        createErrorNotification(
          "Invalid Coupon",
          "The coupon code you entered is not valid.",
        ),
      );
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const updateQuantity = (serviceId: string, change: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      const currentQuantity = newCart[serviceId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);

      if (newQuantity === 0) {
        delete newCart[serviceId];
      } else {
        newCart[serviceId] = newQuantity;
      }

      return newCart;
    });
  };

  const removeItem = (serviceId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[serviceId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
    localStorage.removeItem("laundry_cart");
  };

  const handleProceedToCheckout = () => {
    // Check if user is authenticated first
    if (!currentUser) {
      if (onLoginRequired) {
        onLoginRequired();
        return;
      } else {
        addNotification(
          createWarningNotification(
            "Login Required",
            "Please login to confirm your booking",
          ),
        );
        return;
      }
    }

    if (!addressData) {
      addNotification(
        createWarningNotification(
          "Address Required",
          "Please enter pickup address",
        ),
      );
      return;
    }

    if (!phoneNumber.trim()) {
      addNotification(
        createWarningNotification(
          "Phone Required",
          "Please enter phone number",
        ),
      );
      return;
    }

    if (!selectedDate) {
      addNotification(
        createWarningNotification("Date Required", "Please select pickup date"),
      );
      return;
    }

    if (!selectedTime) {
      addNotification(
        createWarningNotification("Time Required", "Please select pickup time"),
      );
      return;
    }

    // Structure data to match booking service requirements
    const cartItems = getCartItems();
    console.log("Cart items:", cartItems);

    const services = cartItems
      .map((item) => {
        if (!item.service) {
          console.error("Service not found for cart item:", item);
          return null;
        }

        // Validate price and quantity
        const price = Number(item.service.price) || 0;
        const quantity = Number(item.quantity) || 1;

        if (price === 0) {
          console.warn("Service has zero price:", item.service);
        }

        return {
          id: item.service.id,
          name: item.service.name,
          category: item.service.category,
          price: price,
          quantity: quantity,
        };
      })
      .filter(Boolean);

    console.log("Formatted services:", services);

    // Calculate delivery time (2 days after pickup)
    const deliveryDate = new Date(selectedDate);
    deliveryDate.setDate(deliveryDate.getDate() + 2); // Add 2 days

    // Delivery time same as pickup time
    const deliveryTimeString = selectedTime;

    // Calculate total from services to ensure consistency
    const serviceTotal = services.reduce((total, service) => {
      const itemTotal = service.price * service.quantity || 0;
      return total + itemTotal;
    }, 0);

    const deliveryCharge = getDeliveryCharge() || 0;
    const couponDiscount = getCouponDiscount() || 0;
    const finalTotal = serviceTotal + deliveryCharge - couponDiscount;

    console.log("Price breakdown:", {
      serviceTotal,
      deliveryCharge,
      couponDiscount,
      appliedCoupon: appliedCoupon?.code,
      finalTotal,
    });

    const orderData = {
      services,
      totalAmount: finalTotal,
      pickupDate: selectedDate.toISOString().split("T")[0],
      deliveryDate: deliveryDate.toISOString().split("T")[0],
      pickupTime: selectedTime,
      deliveryTime: deliveryTimeString,
      address: addressData,
      phone: phoneNumber || currentUser?.phone,
      instructions: specialInstructions,
    };

    console.log("Final order data:", orderData);

    // Show confirmation dialog
    const confirmationMessage = `
Booking Confirmation:

Services: ${services.length} items
${services.map((s) => `• ${s.name} x${s.quantity} - ₹${s.price * s.quantity}`).join("\n")}

Pickup: ${selectedDate.toLocaleDateString()} at ${selectedTime}
Delivery: ${deliveryDate.toLocaleDateString()} at ${deliveryTimeString}

Total Amount: ₹${finalTotal}

Confirm this booking?`;

    if (confirm(confirmationMessage)) {
      onProceedToCheckout(orderData);
    }
  };

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-0 h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Cart</h1>
        </div>

        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">Add some items to get started</p>
          <Button onClick={onBack} className="bg-green-600 hover:bg-green-700">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-3 sm:px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={onBack} className="p-0 h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold">
            Cart ({cartItems.length} items)
          </h1>
        </div>

        <Button
          variant="ghost"
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Clear All
        </Button>
      </div>

      <div className="p-3 sm:p-4 space-y-4 pb-32">
        {/* Cart Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map(({ service, quantity }) => (
              <div
                key={service!.id}
                className="p-3 bg-gray-50 rounded-lg space-y-3"
              >
                {/* Top row: Icon, Details, and Remove button */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">
                      {service!.category.includes("Men")
                        ? "👔"
                        : service!.category.includes("Women")
                          ? "👗"
                          : service!.category.includes("Woolen")
                            ? "🧥"
                            : service!.category.includes("Steam")
                              ? "🔥"
                              : service!.category.includes("Iron")
                                ? "🏷️"
                                : "👕"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {service!.name}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {service!.category}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      ₹{service!.price} {service!.unit}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(service!.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Bottom row: Quantity controls and total price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(service!.id, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(service!.id, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{service!.price * quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Address Form */}
        <EnhancedAddressForm
          onAddressChange={setAddressData}
          initialAddress={addressData}
        />

        {/* Contact & Schedule Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Contact & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label>Pickup Schedule *</Label>
              <ProfessionalDateTimePicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />
            </div>

            <div>
              <Label htmlFor="instructions">
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for pickup or cleaning"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill Summary with Coupon */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{getSubtotal()}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>₹{getDeliveryCharge()}</span>
            </div>

            {/* Compact Coupon Section */}
            <div className="py-2 border-t border-gray-100">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    onClick={applyCoupon}
                    variant="outline"
                    disabled={!couponCode.trim()}
                    className="h-8 px-3 text-sm"
                  >
                    Apply
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-green-700 font-medium text-sm">
                      ✓ {appliedCoupon.code}
                    </span>
                    <span className="text-xs text-green-600">
                      ({appliedCoupon.discount}% off)
                    </span>
                  </div>
                  <Button
                    onClick={removeCoupon}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-₹{getCouponDiscount()}</span>
              </div>
            )}

            <hr />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-green-600">₹{getTotal()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 safe-area-bottom">
        <Button
          onClick={handleProceedToCheckout}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold"
        >
          Proceed to Checkout • ₹{getTotal()}
        </Button>
      </div>
    </div>
  );
};

export default LaundryCart;
