// Demo booking helpers that simulate booking functionality without backend calls

export const demoBookingHelpers = {
  // Demo create booking
  createBooking: async (bookingData: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a demo booking ID
    const bookingId = "DEMO" + Date.now().toString().slice(-6);

    const booking = {
      _id: bookingId,
      bookingId: bookingId,
      userId: bookingData.userId || "demo-user-1",
      providerId: bookingData.providerId || "demo-provider-1",
      services: bookingData.services || [],
      totalAmount: bookingData.totalAmount || 0,
      scheduledDate: bookingData.scheduledDate,
      scheduledTime: bookingData.scheduledTime,
      address: bookingData.address,
      addressCoordinates: bookingData.addressCoordinates,
      addressDetails: bookingData.addressDetails,
      specialInstructions: bookingData.specialInstructions || "",
      status: "confirmed",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDuration: bookingData.estimatedDuration || "1-2 hours",
      provider: {
        name: bookingData.provider?.name || "Demo Service Provider",
        phone: bookingData.provider?.phone || "+1-555-DEMO",
        email: bookingData.provider?.email || "provider@demo.com",
        rating: 4.8,
        completedJobs: 156,
      },
    };

    // Store in localStorage for demo persistence
    const existingBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    existingBookings.push(booking);
    localStorage.setItem("demo_bookings", JSON.stringify(existingBookings));

    return {
      data: booking,
      error: null,
    };
  },

  // Demo get user bookings
  getUserBookings: async (userId: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Get bookings from localStorage
    const allBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    const userBookings = allBookings.filter(
      (booking: any) =>
        booking.userId === userId || booking.userId === "demo-user-1",
    );

    // If no bookings exist, create some demo bookings
    if (userBookings.length === 0) {
      const demoBookings = [
        {
          _id: "DEMO001",
          bookingId: "DEMO001",
          userId: userId,
          services: [
            { name: "House Cleaning", price: 150, duration: "2 hours" },
          ],
          totalAmount: 150,
          scheduledDate: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          scheduledTime: "10:00 AM",
          address: "123 Demo Street, Demo City",
          status: "confirmed",
          paymentStatus: "paid",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          provider: {
            name: "CleanPro Services",
            phone: "+1-555-CLEAN",
            rating: 4.9,
            completedJobs: 234,
          },
        },
        {
          _id: "DEMO002",
          bookingId: "DEMO002",
          userId: userId,
          services: [
            { name: "Plumbing Repair", price: 120, duration: "1 hour" },
          ],
          totalAmount: 120,
          scheduledDate: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          scheduledTime: "2:00 PM",
          address: "456 Demo Avenue, Demo City",
          status: "completed",
          paymentStatus: "paid",
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          provider: {
            name: "FixIt Plumbing",
            phone: "+1-555-FIXIT",
            rating: 4.7,
            completedJobs: 187,
          },
        },
      ];

      // Store demo bookings
      const existingBookings = JSON.parse(
        localStorage.getItem("demo_bookings") || "[]",
      );
      const updatedBookings = [...existingBookings, ...demoBookings];
      localStorage.setItem("demo_bookings", JSON.stringify(updatedBookings));

      return {
        data: demoBookings,
        error: null,
      };
    }

    return {
      data: userBookings,
      error: null,
    };
  },

  // Demo update booking status
  updateBookingStatus: async (bookingId: string, status: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const allBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    const bookingIndex = allBookings.findIndex(
      (booking: any) => booking._id === bookingId,
    );

    if (bookingIndex === -1) {
      return {
        data: null,
        error: { message: "Booking not found" },
      };
    }

    allBookings[bookingIndex].status = status;
    allBookings[bookingIndex].updatedAt = new Date().toISOString();

    localStorage.setItem("demo_bookings", JSON.stringify(allBookings));

    return {
      data: allBookings[bookingIndex],
      error: null,
    };
  },

  // Demo cancel booking
  cancelBooking: async (bookingId: string, reason?: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    const bookingIndex = allBookings.findIndex(
      (booking: any) => booking._id === bookingId,
    );

    if (bookingIndex === -1) {
      return {
        data: null,
        error: { message: "Booking not found" },
      };
    }

    allBookings[bookingIndex].status = "cancelled";
    allBookings[bookingIndex].cancellationReason =
      reason || "Cancelled by user";
    allBookings[bookingIndex].updatedAt = new Date().toISOString();

    localStorage.setItem("demo_bookings", JSON.stringify(allBookings));

    return {
      data: allBookings[bookingIndex],
      error: null,
    };
  },

  // Demo reschedule booking
  rescheduleBooking: async (
    bookingId: string,
    newDate: string,
    newTime: string,
  ) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    const bookingIndex = allBookings.findIndex(
      (booking: any) => booking._id === bookingId,
    );

    if (bookingIndex === -1) {
      return {
        data: null,
        error: { message: "Booking not found" },
      };
    }

    allBookings[bookingIndex].scheduledDate = newDate;
    allBookings[bookingIndex].scheduledTime = newTime;
    allBookings[bookingIndex].status = "rescheduled";
    allBookings[bookingIndex].updatedAt = new Date().toISOString();

    localStorage.setItem("demo_bookings", JSON.stringify(allBookings));

    return {
      data: allBookings[bookingIndex],
      error: null,
    };
  },

  // Demo update booking
  updateBooking: async (bookingId: string, updatedData: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allBookings = JSON.parse(
      localStorage.getItem("demo_bookings") || "[]",
    );
    const bookingIndex = allBookings.findIndex(
      (booking: any) => booking._id === bookingId,
    );

    if (bookingIndex === -1) {
      return {
        data: null,
        error: { message: "Booking not found" },
      };
    }

    // Update the booking with new data
    allBookings[bookingIndex] = {
      ...allBookings[bookingIndex],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("demo_bookings", JSON.stringify(allBookings));

    return {
      data: allBookings[bookingIndex],
      error: null,
    };
  },
};

export default demoBookingHelpers;
