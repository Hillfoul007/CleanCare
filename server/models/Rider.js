const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    vehicle_type: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: ["motorcycle", "bicycle", "car", "van", "truck"],
    },
    vehicle_number: {
      type: String,
      required: [true, "Vehicle number is required"],
      trim: true,
    },
    license_number: {
      type: String,
      required: [true, "License number is required"],
      trim: true,
    },
    is_online: {
      type: Boolean,
      default: false,
    },
    current_location: {
      type: String,
      default: "",
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
    rating: {
      type: Number,
      default: 5.0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    completed_rides: {
      type: Number,
      default: 0,
      min: [0, "Completed rides cannot be negative"],
    },
    total_earnings: {
      type: Number,
      default: 0,
      min: [0, "Total earnings cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
    documents: {
      license_image: {
        type: String,
        default: "",
      },
      vehicle_registration: {
        type: String,
        default: "",
      },
      insurance_document: {
        type: String,
        default: "",
      },
    },
    bank_details: {
      account_number: {
        type: String,
        default: "",
      },
      routing_number: {
        type: String,
        default: "",
      },
      account_holder_name: {
        type: String,
        default: "",
      },
    },
    availability: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: true },
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

// Update the updated_at field before saving
riderSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Create indexes
riderSchema.index({ user_id: 1 });
riderSchema.index({ is_online: 1 });
riderSchema.index({ status: 1 });
riderSchema.index({ rating: -1 });
riderSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });
riderSchema.index({ created_at: -1 });

// Static method to find online riders near location
riderSchema.statics.findOnlineNearby = function (lat, lng, radiusKm = 10) {
  const radiusInRadians = radiusKm / 6371; // Earth's radius in km

  return this.find({
    is_online: true,
    status: "approved",
    "coordinates.lat": {
      $gte: lat - radiusInRadians,
      $lte: lat + radiusInRadians,
    },
    "coordinates.lng": {
      $gte: lng - radiusInRadians,
      $lte: lng + radiusInRadians,
    },
  }).populate("user_id", "full_name phone email");
};

// Instance method to calculate distance from a point
riderSchema.methods.distanceFrom = function (lat, lng) {
  if (!this.coordinates?.lat || !this.coordinates?.lng) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((lat - this.coordinates.lat) * Math.PI) / 180;
  const dLng = ((lng - this.coordinates.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.coordinates.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

module.exports = mongoose.model("Rider", riderSchema);
