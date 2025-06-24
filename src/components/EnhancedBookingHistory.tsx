import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { bookingHelpers } from "@/integrations/mongodb/client";
import DateTimePicker from "./DateTimePicker";

interface BookingHistoryProps {
  currentUser?: any;
}

const EnhancedBookingHistory: React.FC<BookingHistoryProps> = ({
  currentUser,
}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    scheduled_date: new Date(),
    scheduled_time: "",
    address: "",
    additional_details: "",
  });

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser?._id && !currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = currentUser._id || currentUser.id;
        const { data, error } = await bookingHelpers.getUserBookings(userId);

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
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canEditBooking = (booking: any) => {
    // Can edit if booking is pending or confirmed and not in the past
    const bookingDate = new Date(
      `${booking.scheduled_date} ${booking.scheduled_time}`,
    );
    const now = new Date();
    return (
      (booking.status === "pending" || booking.status === "confirmed") &&
      bookingDate > now
    );
  };

  const canCancelBooking = (booking: any) => {
    // Can cancel if booking is not completed and not already cancelled
    return booking.status !== "completed" && booking.status !== "cancelled";
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setEditForm({
      scheduled_date: new Date(booking.scheduled_date),
      scheduled_time: booking.scheduled_time,
      address: booking.address,
      additional_details: booking.additional_details || "",
    });
  };

  const saveBookingChanges = async () => {
    if (!editingBooking) return;

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://auth-back-ula7.onrender.com/api";

      // Call backend API to update booking
      const response = await fetch(
        `${API_BASE_URL}/bookings/${editingBooking._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            scheduled_date: editForm.scheduled_date.toISOString().split("T")[0],
            scheduled_time: editForm.scheduled_time,
            address: editForm.address,
            additional_details: editForm.additional_details,
          }),
        },
      );

      if (response.ok) {
        // Update the booking in the local state only if backend update succeeds
        const updatedBookings = bookings.map((booking: any) =>
          booking._id === editingBooking._id
            ? {
                ...booking,
                scheduled_date: editForm.scheduled_date
                  .toISOString()
                  .split("T")[0],
                scheduled_time: editForm.scheduled_time,
                address: editForm.address,
                additional_details: editForm.additional_details,
                updated_at: new Date(),
              }
            : booking,
        );

        setBookings(updatedBookings);
        setEditingBooking(null);

        // Show success message
        alert("Booking updated successfully!");
      } else {
        const errorData = await response.json();
        alert(
          `Failed to update booking: ${errorData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      // Use the booking helper to cancel the booking
      const { data, error } = await bookingHelpers.cancelBooking(
        bookingId,
        currentUser._id || currentUser.id,
        "customer",
      );

      if (error) {
        alert(`Failed to cancel booking: ${error.message}`);
        return;
      }

      // Update booking status to cancelled in local state
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
      alert("Booking cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Please Sign In
            </h2>
            <p className="text-gray-600">
              You need to sign in to view your booking history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading your bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Booking History</h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {bookings.length} {bookings.length === 1 ? "Booking" : "Bookings"}
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h2>
            <p className="text-gray-600">
              Your booking history will appear here once you book a service.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking: any) => (
            <Card key={booking._id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{booking.service}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Booking ID: {booking._id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`border ${getStatusColor(booking.status)}`}
                    >
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{booking.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{booking.scheduled_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm truncate">{booking.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold">
                      ${booking.final_amount}
                    </span>
                  </div>
                </div>

                {booking.additional_details && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {booking.additional_details}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {canEditBooking(booking) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBooking(booking)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Booking</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Service</Label>
                            <Input value={booking.service} disabled />
                          </div>

                          <DateTimePicker
                            selectedDate={editForm.scheduled_date}
                            selectedTime={editForm.scheduled_time}
                            onDateChange={(date) =>
                              setEditForm((prev) => ({
                                ...prev,
                                scheduled_date: date!,
                              }))
                            }
                            onTimeChange={(time) =>
                              setEditForm((prev) => ({
                                ...prev,
                                scheduled_time: time,
                              }))
                            }
                          />

                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={editForm.address}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="details">Additional Details</Label>
                            <Textarea
                              id="details"
                              value={editForm.additional_details}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  additional_details: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingBooking(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={saveBookingChanges}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canCancelBooking(booking) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelBooking(booking._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedBookingHistory;
