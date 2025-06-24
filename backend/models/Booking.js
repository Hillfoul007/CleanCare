const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    service: {
      type: String,
      required: [true, "Service is required"],
    },
    service_type: {
      type: String,
      required: [true, "Service type is required"],
    },
    services: [
      {
        type: String,
        required: true,
      },
    ],
    scheduled_date: {
      type: String,
      required: [true, "Scheduled date is required"],
    },
    scheduled_time: {
      type: String,
      required: [true, "Scheduled time is required"],
    },
    provider_name: {
      type: String,
      required: [true, "Provider name is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    coordinates: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    additional_details: {
      type: String,
      default: "",
    },
    total_price: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price must be non-negative"],
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount must be non-negative"],
    },
    final_amount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: [0, "Final amount must be non-negative"],
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    estimated_duration: {
      type: Number,
      default: 60, // minutes
    },
    special_instructions: {
      type: String,
      default: "",
    },
    charges_breakdown: {
      base_price: {
        type: Number,
        default: 0,
      },
      tax_amount: {
        type: Number,
        default: 0,
      },
      service_fee: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
    },
    completed_at: {
      type: Date,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate final amount before saving
bookingSchema.pre("save", function (next) {
  this.updated_at = new Date();

  // Calculate final amount if not already set
  if (!this.final_amount) {
    this.final_amount = this.total_price - (this.discount_amount || 0);
  }

  // Ensure final amount is not negative
  if (this.final_amount < 0) {
    this.final_amount = 0;
  }

  // Set completion timestamp if status is completed
  if (this.status === "completed" && !this.completed_at) {
    this.completed_at = new Date();
  }

  next();
});

// Create indexes
bookingSchema.index({ customer_id: 1 });
bookingSchema.index({ rider_id: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ payment_status: 1 });
bookingSchema.index({ scheduled_date: 1 });
bookingSchema.index({ created_at: -1 });
bookingSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });

// Static method to find bookings within radius
bookingSchema.statics.findNearby = function (lat, lng, radiusKm = 5) {
  const radiusInRadians = radiusKm / 6371; // Earth's radius in km

  return this.find({
    "coordinates.lat": {
      $gte: lat - radiusInRadians,
      $lte: lat + radiusInRadians,
    },
    "coordinates.lng": {
      $gte: lng - radiusInRadians,
      $lte: lng + radiusInRadians,
    },
  });
};

module.exports = mongoose.model("Booking", bookingSchema);
