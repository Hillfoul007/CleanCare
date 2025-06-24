import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  RefreshCw,
  Star,
  ArrowLeft,
} from "lucide-react";
import { adaptiveBookingHelpers } from "@/integrations/adaptive/bookingHelpers";
import EditBookingModal from "./EditBookingModal";

interface MobileBookingHistoryProps {
  currentUser?: any;
  onBack?: () => void;
}

const MobileBookingHistory: React.FC<MobileBookingHistoryProps> = ({
  currentUser,
  onBack,
}) => {
  const { addNotification } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadBookings = async () => {
    if (!currentUser?._id && !currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = currentUser._id || currentUser.id;
      const { data, error } =
        await adaptiveBookingHelpers.getUserBookings(userId);

      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBookings = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
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
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { data, error } = await adaptiveBookingHelpers.cancelBooking(
        bookingId,
        "Cancelled by user",
      );

      if (error) {
        addNotification(
          createErrorNotification(
            "Cancellation Failed",
            `Failed to cancel booking: ${error.message}`,
          ),
        );
        return;
      }

      const updatedBookings = bookings.map((booking: any) =>
        booking._id === bookingId
          ? {
              ...booking,
              status: "cancelled",
              updated_at: new Date(),
            }
          : booking,
      );

      setBookings(updatedBookings);
      addNotification(
        createSuccessNotification(
          "Booking Cancelled",
          "Your booking has been cancelled successfully!",
        ),
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      addNotification(
        createErrorNotification(
          "Network Error",
          "Please check your connection and try again.",
        ),
      );
    }
  };

  const canCancelBooking = (booking: any) => {
    const bookingDate = new Date(booking.scheduled_date);
    const now = new Date();
    const diffHours =
      (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      booking.status !== "cancelled" &&
      booking.status !== "completed" &&
      diffHours > 2
    ); // Can cancel if more than 2 hours away
  };

  const canEditBooking = (booking: any) => {
    const bookingDate = new Date(booking.scheduled_date);
    const now = new Date();
    const diffHours =
      (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      booking.status !== "cancelled" &&
      booking.status !== "completed" &&
      diffHours > 4
    ); // Can edit if more than 4 hours away
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const handleSaveEditedBooking = async (updatedBooking: any) => {
    try {
      const { data, error } = await adaptiveBookingHelpers.updateBooking(
        updatedBooking._id,
        updatedBooking,
      );

      if (error) {
        addNotification(
          createErrorNotification(
            "Update Failed",
            `Failed to update booking: ${error.message}`,
          ),
        );
        return;
      }

      // Update the bookings list
      const updatedBookings = bookings.map((booking: any) =>
        booking._id === updatedBooking._id ? data : booking,
      );

      setBookings(updatedBookings);
      setShowEditModal(false);
      setEditingBooking(null);
      addNotification(
        createSuccessNotification(
          "Booking Updated",
          "Your booking has been updated successfully!",
        ),
      );
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view your booking history.
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full py-3 rounded-xl">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              Loading your bookings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-4 rounded-b-3xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack || (() => window.history.back())}
              variant="ghost"
              className="text-white hover:bg-white/10 p-2 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Bookings</h1>
              <p className="text-blue-200 text-sm">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"} found
              </p>
            </div>
          </div>
          <Button
            onClick={refreshBookings}
            variant="ghost"
            className="text-white hover:bg-white/10 p-3 rounded-xl"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 space-y-4">
        {bookings.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Bookings Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by booking your first service!
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full py-3 rounded-xl">
                Book a Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking: any, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg rounded-2xl overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                      {booking.service || "Home Service"}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      by {booking.provider_name || "HomeServices Pro"}
                    </p>
                  </div>
                  <Badge
                    className={`${getStatusColor(booking.status)} border font-medium`}
                  >
                    {getStatusIcon(booking.status)}
                    <span className="ml-1 capitalize">{booking.status}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {new Date(booking.scheduled_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      at {booking.scheduled_time}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      Service Address
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {booking.address}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${booking.final_amount || booking.total_price}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                {booking.additional_details && (
                  <div className="p-3 bg-yellow-50 rounded-xl">
                    <p className="font-medium text-gray-900 mb-1">
                      Additional Notes
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.additional_details}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2 flex-wrap">
                  {booking.status === "completed" && (
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px] rounded-xl border-2 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Rate Service
                    </Button>
                  )}

                  {canEditBooking(booking) && (
                    <Button
                      variant="outline"
                      onClick={() => handleEditBooking(booking)}
                      className="flex-1 min-w-[120px] rounded-xl border-2 border-green-200 hover:bg-green-50 text-green-600"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}

                  {canCancelBooking(booking) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 min-w-[120px] rounded-xl border-2 border-red-200 hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. You may be charged a
                            cancellation fee depending on the cancellation
                            policy.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">
                            Keep Booking
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelBooking(booking._id)}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                          >
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px] rounded-xl border-2 border-blue-200 hover:bg-blue-50"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
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
    </div>
  );
};

export default MobileBookingHistory;
