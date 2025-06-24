const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");

const router = express.Router();

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Create a new booking
router.post("/", async (req, res) => {
  try {
    const {
      customer_id,
      service,
      service_type,
      services,
      scheduled_date,
      scheduled_time,
      provider_name,
      address,
      coordinates,
      additional_details,
      total_price,
      discount_amount,
      final_amount,
      special_instructions,
      charges_breakdown,
    } = req.body;

    // Validation
    if (
      !customer_id ||
      !service ||
      !service_type ||
      !services ||
      !scheduled_date ||
      !scheduled_time ||
      !provider_name ||
      !address ||
      !total_price
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one service must be selected" });
    }

    if (total_price <= 0) {
      return res
        .status(400)
        .json({ error: "Total price must be greater than 0" });
    }

    // Verify customer exists
    const customer = await User.findById(customer_id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Create booking
    const booking = new Booking({
      customer_id,
      service,
      service_type,
      services,
      scheduled_date,
      scheduled_time,
      provider_name,
      address,
      coordinates,
      additional_details,
      total_price,
      discount_amount: discount_amount || 0,
      final_amount: final_amount || total_price - (discount_amount || 0),
      special_instructions,
      charges_breakdown,
    });

    await booking.save();

    // Populate customer data
    await booking.populate("customer_id", "full_name phone email");

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get bookings for a customer
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = { customer_id: customerId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone")
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json({ bookings });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get pending bookings for riders (within 10km range)
router.get("/pending/:riderLat/:riderLng", async (req, res) => {
  try {
    const { riderLat, riderLng } = req.params;
    const lat = parseFloat(riderLat);
    const lng = parseFloat(riderLng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    // Get all pending bookings
    const bookings = await Booking.find({
      status: "pending",
      rider_id: null,
    })
      .populate("customer_id", "full_name phone email")
      .sort({ created_at: -1 });

    // Filter bookings within 10km range
    const nearbyBookings = bookings.filter((booking) => {
      if (
        !booking.coordinates ||
        !booking.coordinates.lat ||
        !booking.coordinates.lng
      ) {
        return false; // Skip bookings without coordinates
      }

      const distance = calculateDistance(
        lat,
        lng,
        booking.coordinates.lat,
        booking.coordinates.lng,
      );

      return distance <= 10; // 10km range
    });

    res.json({ bookings: nearbyBookings });
  } catch (error) {
    console.error("Pending bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get bookings for a rider
router.get("/rider/:riderId", async (req, res) => {
  try {
    const { riderId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = { rider_id: riderId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone")
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json({ bookings });
  } catch (error) {
    console.error("Rider bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept a booking (rider claims it)
router.put("/:bookingId/accept", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rider_id } = req.body;

    if (!rider_id) {
      return res.status(400).json({ error: "Rider ID is required" });
    }

    // Check if rider exists
    const rider = await User.findById(rider_id);
    if (!rider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    // Find and update booking atomically
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: "pending",
        rider_id: null,
      },
      {
        rider_id,
        status: "confirmed",
        updated_at: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone");

    if (!booking) {
      return res.status(409).json({
        error: "Booking not found or is no longer available",
      });
    }

    res.json({
      message: "Booking accepted successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking acceptance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update booking status
router.put("/:bookingId/status", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rider_id } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let query = { _id: bookingId };

    // If rider_id is provided, make sure only that rider can update
    if (rider_id) {
      query.rider_id = rider_id;
    }

    let updateData = {
      status,
      updated_at: new Date(),
    };

    // Add completion timestamp if completing
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const booking = await Booking.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone");

    if (!booking) {
      return res
        .status(404)
        .json({ error: "Booking not found or access denied" });
    }

    res.json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking status update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get booking by ID
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("Booking fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel booking
router.delete("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { user_id, user_type } = req.body;

    // Get booking details first
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user has permission to cancel
    const canCancel =
      (user_type === "customer" &&
        booking.customer_id.toString() === user_id) ||
      (user_type === "rider" &&
        booking.rider_id &&
        booking.rider_id.toString() === user_id);

    if (!canCancel) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Can't cancel if already completed
    if (booking.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel completed booking" });
    }

    // Update booking status to cancelled
    booking.status = "cancelled";
    booking.updated_at = new Date();
    await booking.save();

    res.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all bookings (admin/statistics)
router.get("/", async (req, res) => {
  try {
    const {
      status,
      customer_id,
      rider_id,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (customer_id) query.customer_id = customer_id;
    if (rider_id) query.rider_id = rider_id;

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name phone email")
      .populate("rider_id", "full_name phone")
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
