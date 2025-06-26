import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
} from "@/utils/notificationUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  RefreshCw,
  Star,
  ArrowLeft,
  Plus,
  Package,
  CreditCard,
  User,
  MessageCircle,
} from "lucide-react";
import { BookingService } from "@/services/bookingService";
import EditBookingModal from "./EditBookingModal";

interface EnhancedBookingHistoryProps {
  currentUser?: any;
  onBack?: () => void;
  onLoginRequired?: () => void;
}

const EnhancedBookingHistory: React.FC<EnhancedBookingHistoryProps> = ({
  currentUser,
  onBack,
  onLoginRequired,
}) => {
  const { addNotification } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addingServicesBooking, setAddingServicesBooking] = useState(null);
  const [showAddServicesModal, setShowAddServicesModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(
    null,
  );
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactBookingId, setContactBookingId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!currentUser?.id && !currentUser?._id && !currentUser?.phone) {
      console.log("No user ID found for loading bookings");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const bookingService = BookingService.getInstance();

      console.log("Loading bookings for current user...");
      // Use the new method that automatically handles user ID resolution
      const response = await bookingService.getCurrentUserBookings();

      if (response.success && response.bookings) {
        console.log("Bookings loaded successfully:", response.bookings.length);
        setBookings(response.bookings);
      } else {
        console.log("No bookings found or error:", response.error);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
      addNotification(
        createErrorNotification(
          "Loading Error",
          "Failed to load bookings. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshBookings = async () => {
    setRefreshing(true);
    try {
      await loadBookings();
      addNotification(
        createSuccessNotification(
          "Refreshed",
          "Booking history updated successfully",
        ),
      );
    } catch (error) {
      console.error("Error refreshing bookings:", error);
      addNotification(
        createErrorNotification("Refresh Failed", "Failed to refresh bookings"),
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "in_progress":
      case "in-progress":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canCancelBooking = (booking: any) => {
    const status = booking.status?.toLowerCase();
    return status !== "cancelled" && status !== "completed";
  };

  const canEditBooking = (booking: any) => {
    const status = booking.status?.toLowerCase();
    return status === "pending" || status === "confirmed";
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!bookingId) {
      addNotification(createErrorNotification("Error", "Invalid booking ID"));
      return;
    }

    setCancellingBooking(bookingId);

    try {
      const bookingService = BookingService.getInstance();
      const result = await bookingService.cancelBooking(bookingId);

      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking: any) =>
            booking.id === bookingId || booking._id === bookingId
              ? {
                  ...booking,
                  status: "cancelled",
                  updatedAt: new Date().toISOString(),
                }
              : booking,
          ),
        );

        addNotification(
          createSuccessNotification(
            "Booking Cancelled",
            "Your booking has been cancelled successfully",
          ),
        );
      } else {
        addNotification(
          createErrorNotification(
            "Cancellation Failed",
            result.error || "Failed to cancel booking",
          ),
        );
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      addNotification(
        createErrorNotification(
          "Cancellation Failed",
          "Network error. Please check your connection and try again.",
        ),
      );
    } finally {
      setCancellingBooking(null);
    }
  };

  const handleEditBooking = (booking: any) => {
    if (!canEditBooking(booking)) {
      addNotification(
        createWarningNotification(
          "Cannot Edit",
          "This booking cannot be edited in its current status",
        ),
      );
      return;
    }
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const handleSaveEditedBooking = async (updatedBooking: any) => {
    try {
      const bookingService = BookingService.getInstance();
      const bookingId = updatedBooking.id || updatedBooking._id;

      const result = await bookingService.updateBooking(
        bookingId,
        updatedBooking,
      );

      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking: any) =>
            booking.id === bookingId || booking._id === bookingId
              ? {
                  ...booking,
                  ...updatedBooking,
                  updatedAt: new Date().toISOString(),
                }
              : booking,
          ),
        );

        setShowEditModal(false);
        setEditingBooking(null);

        addNotification(
          createSuccessNotification(
            "Booking Updated",
            "Your booking has been updated successfully",
          ),
        );
      } else {
        addNotification(
          createErrorNotification(
            "Update Failed",
            result.error || "Failed to update booking",
          ),
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      addNotification(
        createErrorNotification(
          "Update Failed",
          "Failed to update booking. Please try again.",
        ),
      );
    }
  };

  const handleAddServices = (booking: any) => {
    if (!canEditBooking(booking)) {
      addNotification(
        createWarningNotification(
          "Cannot Add Services",
          "Services cannot be added to this booking in its current status",
        ),
      );
      return;
    }
    setAddingServicesBooking(booking);
    setShowAddServicesModal(true);
  };

  const handleSaveAddedServices = async (updatedBooking: any) => {
    try {
      const bookingService = BookingService.getInstance();
      const bookingId = updatedBooking.id || updatedBooking._id;

      const result = await bookingService.updateBooking(
        bookingId,
        updatedBooking,
      );

      if (result.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking: any) =>
            booking.id === bookingId || booking._id === bookingId
              ? {
                  ...booking,
                  ...updatedBooking,
                  updatedAt: new Date().toISOString(),
                }
              : booking,
          ),
        );

        setShowAddServicesModal(false);
        setAddingServicesBooking(null);

        addNotification(
          createSuccessNotification(
            "Services Added",
            "Services have been added to your booking successfully",
          ),
        );
      } else {
        addNotification(
          createErrorNotification(
            "Update Failed",
            result.error || "Failed to add services",
          ),
        );
      }
    } catch (error) {
      console.error("Error adding services:", error);
      addNotification(
        createErrorNotification(
          "Update Failed",
          "Failed to add services. Please try again.",
        ),
      );
    }
  };

  const handleContactSupport = (bookingId: string) => {
    setContactBookingId(bookingId);
    setShowContactDialog(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD";

    try {
      let date;
      if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-").map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return "Date TBD";

      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
      return "Date TBD";
    }
  };

  const calculateTotal = (booking: any) => {
    if (booking.totalAmount) return booking.totalAmount;
    if (booking.total_price) return booking.total_price;
    if (booking.final_amount) return booking.final_amount;

    // Calculate from services if available
    if (Array.isArray(booking.services)) {
      return booking.services.reduce((total: number, service: any) => {
        const price = service.price || service.amount || 0;
        const quantity = service.quantity || 1;
        return total + price * quantity;
      }, 0);
    }

    return 0;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your booking history.
            </p>
            <Button
              onClick={onLoginRequired}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full py-3 rounded-xl text-white font-medium"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Booking History
                </h1>
                <p className="text-gray-600 mt-1">
                  {bookings.length}{" "}
                  {bookings.length === 1 ? "booking" : "bookings"} found
                </p>
              </div>
            </div>
            <Button
              onClick={refreshBookings}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No Bookings Yet
              </h3>
              <p className="text-gray-600 mb-8">
                Your booking history will appear here once you book a service.
              </p>
              <Button
                onClick={onBack}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                Book Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking: any, index) => {
              const bookingId = booking.id || booking._id || `booking_${index}`;
              const services = Array.isArray(booking.services)
                ? booking.services
                : [booking.service || "Home Service"];
              const total = calculateTotal(booking);

              return (
                <Card
                  key={bookingId}
                  className="overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {booking.service || "Home Service"}
                        </CardTitle>
                        <p className="text-sm text-blue-600 font-medium">
                          by {booking.provider_name || "HomeServices Pro"}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(booking.status)} border font-medium flex items-center gap-1`}
                      >
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">
                          {booking.status || "pending"}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Services */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Booked Services
                      </h4>
                      <div className="space-y-2">
                        {services.map((service: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {typeof service === "object"
                                  ? service.name || service.service
                                  : service}
                              </p>
                              <p className="text-sm text-gray-600">
                                Qty:{" "}
                                {typeof service === "object"
                                  ? service.quantity || 1
                                  : 1}
                              </p>
                            </div>
                            {typeof service === "object" && service.price && (
                              <p className="font-semibold text-blue-600">
                                ₹{service.price}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-900">
                            Pickup
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(
                            booking.pickupDate || booking.scheduled_date,
                          )}
                        </p>
                        <p className="text-xs text-green-600">
                          {booking.pickupTime ||
                            booking.scheduled_time ||
                            "10:00"}
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium text-gray-900">
                            Delivery
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.deliveryDate) || "Date TBD"}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {booking.deliveryTime || "18:00"}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 mb-1">
                            Service Address
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {typeof booking.address === "object" &&
                            booking.address !== null
                              ? booking.address.fullAddress ||
                                [
                                  booking.address.flatNo,
                                  booking.address.street,
                                  booking.address.landmark,
                                  booking.address.village,
                                  booking.address.city,
                                  booking.address.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ") ||
                                "Address not provided"
                              : booking.address || "Address not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        Price Breakdown
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Services Total
                          </span>
                          <span className="font-medium">₹{total}</span>
                        </div>

                        {booking.discount_amount &&
                          booking.discount_amount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">
                                Discount
                              </span>
                              <span className="font-medium text-green-600">
                                -₹{booking.discount_amount}
                              </span>
                            </div>
                          )}

                        <Separator />

                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">
                            Total Amount
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            ₹{total}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Payment Status
                          </span>
                          <Badge
                            variant={
                              (booking.payment_status ||
                                booking.paymentStatus) === "paid"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {(
                              booking.payment_status ||
                              booking.paymentStatus ||
                              "pending"
                            ).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
                      {canEditBooking(booking) && (
                        <Button
                          onClick={() => handleEditBooking(booking)}
                          variant="outline"
                          className="flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Order
                        </Button>
                      )}

                      {canCancelBooking(booking) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                              disabled={cancellingBooking === bookingId}
                            >
                              <Trash2 className="h-4 w-4" />
                              {cancellingBooking === bookingId
                                ? "Cancelling..."
                                : "Cancel"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancel Booking?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Keep Booking
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(bookingId)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {canEditBooking(booking) && (
                        <Button
                          onClick={() => handleAddServices(booking)}
                          variant="outline"
                          className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4" />
                          Add More Services
                        </Button>
                      )}

                      <Button
                        onClick={() => handleContactSupport(bookingId)}
                        variant="outline"
                        className="flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingBooking(null);
          }}
          booking={editingBooking}
          onSave={handleSaveEditedBooking}
        />
      )}

      {/* Add Services Modal */}
      {addingServicesBooking && (
        <EditBookingModal
          isOpen={showAddServicesModal}
          onClose={() => {
            setShowAddServicesModal(false);
            setAddingServicesBooking(null);
          }}
          booking={addingServicesBooking}
          onSave={handleSaveAddedServices}
          mode="add-services"
        />
      )}

      {/* Contact Support Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Contact Support
            </DialogTitle>
            <DialogDescription>
              Get help with your booking #{contactBookingId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Phone Support</h4>
              <p className="text-blue-800 font-mono text-lg">+91 9876543210</p>
              <p className="text-sm text-blue-600 mt-1">Available 24/7</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                WhatsApp Support
              </h4>
              <p className="text-green-800 font-mono text-lg">+91 9876543210</p>
              <p className="text-sm text-green-600 mt-1">Quick responses</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContactDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.open("tel:+919876543210", "_self");
                setShowContactDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedBookingHistory;
