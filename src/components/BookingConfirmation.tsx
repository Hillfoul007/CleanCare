import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  User,
  Phone,
  Mail,
} from "lucide-react";

// BookingConfirmation.tsx
interface BookingConfirmationProps {
  bookingData: {
    services: { name: string; price: number; quantity?: number }[];
    selectedDate: Date;
    selectedTime: string;
    selectedAddress: string;
    additionalDetails: string;
    isMultipleServices: boolean;
    provider?: { name: string; image?: string; price?: number };
    currentUser: any;
  };
  onConfirmBooking: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingData,
  onConfirmBooking,
  onBack,
  isProcessing,
}) => {
  const {
    services,
    selectedDate,
    selectedTime,
    selectedAddress,
    additionalDetails,
    isMultipleServices,
    provider,
    currentUser,
  } = bookingData;

  // Calculate pricing breakdown
  const calculatePricing = () => {
    let basePrice = 0;

    if (isMultipleServices) {
      basePrice = services.reduce(
        (total, service) => total + service.price * (service.quantity || 1),
        0,
      );
    } else {
      basePrice = provider?.price || 80;
    }

    const serviceCharges = basePrice * 0.1; // 10% service charge
    const taxAmount = (basePrice + serviceCharges) * 0.12; // 12% tax (GST)
    const discount = basePrice > 200 ? basePrice * 0.05 : 0; // 5% discount for orders > $200

    const subtotal = basePrice + serviceCharges + taxAmount;
    const finalAmount = subtotal - discount;

    return {
      basePrice,
      serviceCharges,
      taxAmount,
      discount,
      subtotal,
      finalAmount,
    };
  };

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Your Booking
          </h1>
          <p className="text-gray-600">
            Review your booking details and confirm to proceed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center text-blue-900">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="font-medium">
                      {currentUser?.profile?.full_name ||
                        currentUser?.email ||
                        "Customer"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-3" />
                    <span>{currentUser?.email || "No email provided"}</span>
                  </div>
                  {currentUser?.profile?.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-500 mr-3" />
                      <span>{currentUser.profile.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center text-blue-900">
                  <FileText className="w-5 h-5 mr-2" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isMultipleServices ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Selected Services:
                    </h3>
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">
                            {service.name}
                          </Badge>
                          {service.quantity && service.quantity > 1 && (
                            <span className="text-sm text-gray-600">
                              × {service.quantity}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-blue-600">
                          ${service.price * (service.quantity || 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {provider?.image && (
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {provider?.name || "Service"}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        ${provider?.price || 80}/hr
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center text-blue-900">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="font-medium">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                    <span className="font-medium">{selectedAddress}</span>
                  </div>
                  {additionalDetails && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Additional Details:
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        {additionalDetails}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary */}
          <div className="lg:col-span-1">
            <Card className="border-green-200 shadow-lg sticky top-6">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center text-green-900">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-medium">
                      ${pricing.basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charges</span>
                    <span className="font-medium">
                      ${pricing.serviceCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST 12%)</span>
                    <span className="font-medium">
                      ${pricing.taxAmount.toFixed(2)}
                    </span>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${pricing.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Discount (5%)
                      </span>
                      <span className="font-medium">
                        -${pricing.discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="flex justify-between text-lg font-bold text-green-700">
                    <span>Total Amount</span>
                    <span>${pricing.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={onConfirmBooking}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirming...
                      </div>
                    ) : (
                      `✅ Confirm Booking - $${pricing.finalAmount.toFixed(2)}`
                    )}
                  </Button>

                  

                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    ← Back to Booking
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-xs text-center">
                    💡 No payment required now. Pay securely when the service is
                    completed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
