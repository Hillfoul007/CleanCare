import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Phone,
  User,
  Star,
  X,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
} from "lucide-react";
import { BookingService } from "@/services/bookingService";
import { laundryServices } from "@/data/laundryServices";

interface Booking {
  _id: string;
  id: string;
  userId: string;
  services: Array<{
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  pickupDate: string;
  deliveryDate: string;
  pickupTime: string;
  deliveryTime: string;
  address: {
    fullAddress: string;
    flatNo?: string;
    street?: string;
    landmark?: string;
    village?: string;
    city?: string;
    pincode?: string;
  };
  contactDetails: {
    phone: string;
    instructions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EnhancedBookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

const EnhancedBookingHistoryModal: React.FC<
  EnhancedBookingHistoryModalProps
> = ({ isOpen, onClose, currentUser }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(
    null,
  );
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddService, setShowAddService] = useState(false);

  const bookingService = BookingService.getInstance();

  // Get all available services
  const getAllServices = () => {
    return laundryServices.flatMap((category) => category.services);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadBookings();
    }
  }, [isOpen, currentUser]);

  const loadBookings = async () => {
    if (!currentUser?.id && !currentUser?.phone) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userId = currentUser.id || currentUser.phone;

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 10000);
      });

      const bookingPromise = bookingService.getUserBookings(userId);

      const result = (await Promise.race([
        bookingPromise,
        timeoutPromise,
      ])) as any;

      if (result.success) {
        setBookings(result.bookings || []);
        if (result.bookings && result.bookings.length === 0) {
          console.log("📝 No bookings found for user");
        }
      } else {
        console.warn("Booking service returned error:", result.error);
        setError(result.error || "Failed to load bookings");
        // Still show empty state rather than error for better UX
        setBookings([]);
      }
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      // Don't show error for network issues, just show empty state
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("timeout")
      ) {
        setBookings([]);
        setError(""); // Clear error to show empty state instead
      } else {
        setError(error.message || "Failed to load bookings");
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBooking(bookingId);
    try {
      const result = await bookingService.cancelBooking(bookingId);

      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "cancelled" as const }
              : booking,
          ),
        );
        alert("Booking cancelled successfully");
      } else {
        alert(result.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking");
    } finally {
      setCancellingBooking(null);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
  };

  const handleUpdateBooking = async (updatedBooking: Partial<Booking>) => {
    if (!editingBooking) return;

    try {
      const result = await bookingService.updateBooking(
        editingBooking.id,
        updatedBooking,
      );

      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === editingBooking.id
              ? { ...booking, ...updatedBooking }
              : booking,
          ),
        );
        setEditingBooking(null);
        alert("Booking updated successfully");
      } else {
        alert(result.error || "Failed to update booking");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Failed to update booking");
    }
  };

  const handleAddService = (serviceId: string) => {
    if (!editingBooking) return;

    const allServices = getAllServices();
    const service = allServices.find((s) => s.id === serviceId);

    if (!service) return;

    // Check if service already exists in booking
    const existingServiceIndex = editingBooking.services.findIndex(
      (s) => s.id === serviceId,
    );

    if (existingServiceIndex >= 0) {
      // Increase quantity if service already exists
      const newServices = [...editingBooking.services];
      newServices[existingServiceIndex].quantity += 1;
      setEditingBooking({ ...editingBooking, services: newServices });
    } else {
      // Add new service
      const newService = {
        id: service.id,
        name: service.name,
        category: service.category,
        price: service.price,
        quantity: 1,
      };

      setEditingBooking({
        ...editingBooking,
        services: [...editingBooking.services, newService],
      });
    }

    setShowAddService(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <Truck className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString; // Return original if formatting fails
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  };

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking History</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Please Sign In
            </h3>
            <p className="text-gray-600">
              You need to sign in to view your booking history.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Booking History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[60vh] pr-2 sm:pr-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2">Loading your bookings...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600">
                Your booking history will appear here once you place orders.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {bookings.map((booking) => (
                <Card
                  key={booking._id || booking.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge
                          className={`${getStatusColor(booking.status)} flex items-center gap-1 text-xs`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-500">
                          #{booking._id?.slice(-6) || booking.id?.slice(-6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(booking.status === "pending" ||
                          booking.status === "confirmed") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              title="Edit booking"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingBooking === booking.id}
                              className="text-red-600 hover:text-red-700"
                              title="Cancel booking"
                            >
                              {cancellingBooking === booking.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Services */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Services ({booking.services.length} items)
                      </h4>
                      <div className="space-y-1">
                        {(booking.services || []).map((service, index) => {
                          console.log("Service data:", service); // Debug log

                          const price = Number(service.price) || 0;
                          const quantity = Number(service.quantity) || 1;
                          const itemTotal = price * quantity;

                          // Handle missing service name or price
                          const serviceName =
                            service.name ||
                            service.category ||
                            "Unknown Service";

                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                            >
                              <div>
                                <div className="font-medium text-gray-900">
                                  {serviceName}
                                </div>
                                {service.category &&
                                  service.category !== serviceName && (
                                    <div className="text-xs text-gray-500">
                                      {service.category}
                                    </div>
                                  )}
                              </div>
                              <div className="text-right">
                                <div className="text-gray-600">x{quantity}</div>
                                <div className="font-medium text-green-600">
                                  ₹
                                  {itemTotal > 0 ? itemTotal.toFixed(0) : "N/A"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(!booking.services ||
                          booking.services.length === 0) && (
                          <div className="text-sm text-gray-500 italic">
                            No services found
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Pickup</div>
                          <div className="text-gray-600">
                            {formatDate(booking.pickupDate)} at{" "}
                            {formatTime(booking.pickupTime)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Delivery</div>
                          <div className="text-gray-600">
                            {formatDate(booking.deliveryDate)} at{" "}
                            {formatTime(booking.deliveryTime)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Address</div>
                        <div className="text-gray-600">
                          {booking.address.fullAddress}
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Contact:</span>
                      <span className="text-gray-600">
                        {booking.contactDetails.phone}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{Number(booking.totalAmount).toFixed(0)}
                      </span>
                    </div>

                    {/* Booking Date */}
                    <div className="text-xs text-gray-500">
                      Booked on{" "}
                      {new Date(booking.createdAt).toLocaleDateString()} at{" "}
                      {new Date(booking.createdAt).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Edit Booking Modal */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Edit Booking #{editingBooking.id.slice(-6)}
              </h3>

              <div className="space-y-4">
                {/* Services Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Services
                  </label>
                  <div className="space-y-2 p-3 bg-gray-50 rounded">
                    {editingBooking.services.map((service, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-white rounded"
                      >
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">
                            {service.category}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newServices = [...editingBooking.services];
                              if (newServices[index].quantity > 1) {
                                newServices[index].quantity -= 1;
                                setEditingBooking({
                                  ...editingBooking,
                                  services: newServices,
                                });
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">
                            {service.quantity}
                          </span>
                          <button
                            onClick={() => {
                              const newServices = [...editingBooking.services];
                              newServices[index].quantity += 1;
                              setEditingBooking({
                                ...editingBooking,
                                services: newServices,
                              });
                            }}
                            className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => {
                              const newServices =
                                editingBooking.services.filter(
                                  (_, i) => i !== index,
                                );
                              setEditingBooking({
                                ...editingBooking,
                                services: newServices,
                              });
                            }}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddService(true)}
                        className="text-green-600 hover:text-green-700"
                      >
                        + Add Service
                      </Button>
                      <span className="font-medium">
                        Total: ₹
                        {editingBooking.services
                          .reduce(
                            (total, service) =>
                              total + service.price * service.quantity,
                            0,
                          )
                          .toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Add Service Modal */}
                  {showAddService && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[70vh] overflow-y-auto">
                        <h4 className="font-semibold mb-3">Add Service</h4>
                        <div className="space-y-2">
                          {getAllServices().map((service) => (
                            <div
                              key={service.id}
                              onClick={() => handleAddService(service.id)}
                              className="p-3 border rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">
                                  {service.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {service.category}
                                </div>
                              </div>
                              <div className="text-green-600 font-medium">
                                ₹{service.price}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddService(false)}
                          className="w-full mt-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={editingBooking.pickupDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          pickupDate: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={editingBooking.pickupTime}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          pickupTime: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={editingBooking.deliveryDate}
                      min={editingBooking.pickupDate}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          deliveryDate: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      value={editingBooking.deliveryTime}
                      onChange={(e) =>
                        setEditingBooking({
                          ...editingBooking,
                          deliveryTime: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={editingBooking.contactDetails.phone}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        contactDetails: {
                          ...editingBooking.contactDetails,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={editingBooking.contactDetails.instructions || ""}
                    onChange={(e) =>
                      setEditingBooking({
                        ...editingBooking,
                        contactDetails: {
                          ...editingBooking.contactDetails,
                          instructions: e.target.value,
                        },
                      })
                    }
                    placeholder="Any special instructions for pickup or delivery..."
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => {
                    // Recalculate total amount
                    const newTotalAmount = editingBooking.services.reduce(
                      (total, service) =>
                        total + service.price * service.quantity,
                      0,
                    );
                    handleUpdateBooking({
                      ...editingBooking,
                      totalAmount: newTotalAmount,
                    });
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedBookingHistoryModal;
