// Demo client that exports all demo helpers for easy import
// This replaces the MongoDB client for demo purposes

import { demoAuthHelpers } from "./authHelpers";
import { demoBookingHelpers } from "./bookingHelpers";

// Export auth helpers
export const authHelpers = demoAuthHelpers;

// Export booking helpers
export const bookingHelpers = demoBookingHelpers;

// Export individual functions for backward compatibility
export const getCurrentUser = demoAuthHelpers.getCurrentUser;
export const isLoggedIn = demoAuthHelpers.isLoggedIn;
export const clearAuthData = demoAuthHelpers.clearAuthData;

// Demo notification helper
export const sendNotification = async (
  userId: string,
  message: string,
  type: string = "info",
) => {
  console.log(`Demo notification for ${userId}: ${message} (${type})`);
  return { success: true, message: "Notification sent (demo mode)" };
};

// Demo provider helpers
export const providerHelpers = {
  getNearbyProviders: async (location: any, service: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const demoProviders = [
      {
        id: "provider-1",
        name: "QuickFix Pro Services",
        rating: 4.8,
        completedJobs: 245,
        distance: "0.8 miles",
        phone: "+1-555-QUICK",
        email: "contact@quickfixpro.com",
        services: ["plumbing", "electrical", "handyman"],
        priceRange: "$80-150",
        availability: "Available now",
        image: "/placeholder.svg",
      },
      {
        id: "provider-2",
        name: "CleanMaster Solutions",
        rating: 4.9,
        completedJobs: 189,
        distance: "1.2 miles",
        phone: "+1-555-CLEAN",
        email: "info@cleanmaster.com",
        services: ["cleaning", "deep-cleaning", "carpet-cleaning"],
        priceRange: "$120-200",
        availability: "Available in 2 hours",
        image: "/placeholder.svg",
      },
      {
        id: "provider-3",
        name: "GreenThumb Landscaping",
        rating: 4.7,
        completedJobs: 156,
        distance: "2.1 miles",
        phone: "+1-555-GREEN",
        email: "service@greenthumb.com",
        services: ["landscaping", "lawn-care", "gardening"],
        priceRange: "$100-180",
        availability: "Available tomorrow",
        image: "/placeholder.svg",
      },
    ];

    return {
      data: demoProviders.filter((p) =>
        p.services.some((s) => s.toLowerCase().includes(service.toLowerCase())),
      ),
      error: null,
    };
  },
};

// Demo rider helpers (for delivery/rider services)
export const riderHelpers = {
  registerRider: async (riderData: any) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const rider = {
      id: "rider-" + Date.now(),
      ...riderData,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
    };

    return {
      data: rider,
      error: null,
    };
  },

  getRiderBookings: async (riderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      data: [],
      error: null,
    };
  },
};

export default {
  authHelpers,
  bookingHelpers,
  providerHelpers,
  riderHelpers,
  getCurrentUser,
  isLoggedIn,
  clearAuthData,
  sendNotification,
};
