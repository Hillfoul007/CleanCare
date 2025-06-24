// TypeScript types for the dedicated riders table and related tables

export type VehicleType =
  | "bike"
  | "scooter"
  | "motorcycle"
  | "car"
  | "bicycle"
  | "on_foot";

export type RiderStatus =
  | "pending"
  | "approved"
  | "active"
  | "inactive"
  | "suspended";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export type DeliveryType = "standard" | "express" | "scheduled" | "same_day";

export type EarningType =
  | "delivery_fee"
  | "tip"
  | "bonus"
  | "incentive"
  | "adjustment";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WorkingHours {
  monday: { start: string; end: string; active: boolean };
  tuesday: { start: string; end: string; active: boolean };
  wednesday: { start: string; end: string; active: boolean };
  thursday: { start: string; end: string; active: boolean };
  friday: { start: string; end: string; active: boolean };
  saturday: { start: string; end: string; active: boolean };
  sunday: { start: string; end: string; active: boolean };
}

export interface DocumentStatus {
  uploaded: boolean;
  verified: boolean;
  url: string | null;
}

export interface RiderDocuments {
  drivers_license: DocumentStatus;
  vehicle_registration: DocumentStatus;
  insurance: DocumentStatus;
  background_check: DocumentStatus;
}

export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
}

export interface DeliveryProof {
  photos?: string[];
  signature?: string;
  notes?: string;
  recipient_name?: string;
}

// Main Rider interface
export interface Rider {
  id: string;
  user_id: string;

  // Personal Information
  full_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  profile_photo_url?: string;

  // Rider-specific Information
  vehicle_type: VehicleType;
  vehicle_model?: string;
  vehicle_registration?: string;
  license_number: string;
  license_expiry?: string;

  // Location & Availability
  is_online: boolean;
  current_location?: string;
  current_coordinates?: Coordinates;
  base_location?: string;
  base_coordinates?: Coordinates;
  service_radius_km: number;

  // Working Hours
  working_hours: WorkingHours;

  // Performance Metrics
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  average_delivery_time: number; // in minutes

  // Financial Information
  earnings_total: number;
  earnings_this_month: number;
  commission_rate: number;

  // Documents & Verification
  documents: RiderDocuments;
  verification_status: string;
  verified_at?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Account Status
  status: RiderStatus;
  approved_at?: string;
  last_active_at?: string;
  last_location_update?: string;

  // Preferences
  preferred_delivery_types: string[];
  max_delivery_distance: number;
  accepts_cash_payments: boolean;
  accepts_card_payments: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Delivery Request interface
export interface DeliveryRequest {
  id: string;
  rider_id?: string;
  customer_id: string;

  // Pickup Information
  pickup_address: string;
  pickup_coordinates: Coordinates;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_instructions?: string;

  // Delivery Information
  delivery_address: string;
  delivery_coordinates: Coordinates;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;

  // Package Details
  package_description?: string;
  package_weight?: number; // in kg
  package_dimensions?: PackageDimensions;
  package_value?: number;
  fragile: boolean;

  // Timing
  requested_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;

  // Status and Progress
  status: DeliveryStatus;
  delivery_type: DeliveryType;

  // Financial
  base_fee: number;
  distance_fee: number;
  express_fee: number;
  total_amount: number;
  rider_earnings: number;
  payment_method: string;
  payment_status: string;

  // Distance and Route
  distance_km?: number;
  estimated_duration_minutes?: number;
  route_data?: any;

  // Tracking
  tracking_number?: string;
  current_location?: Coordinates;
  delivery_proof?: DeliveryProof;

  // Ratings and Feedback
  customer_rating?: number;
  customer_feedback?: string;
  rider_rating?: number;
  rider_feedback?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Rider Earnings interface
export interface RiderEarning {
  id: string;
  rider_id: string;
  delivery_request_id?: string;

  // Earning Details
  amount: number;
  earning_type: EarningType;
  description?: string;

  // Period Information
  earned_date: string;
  week_start?: string;
  month_year?: string; // Format: 2024-01

  // Payment Status
  paid: boolean;
  paid_at?: string;
  payment_batch_id?: string;

  // Metadata
  created_at: string;
}

// API response types
export interface AvailableRider {
  rider_id: string;
  full_name: string;
  vehicle_type: VehicleType;
  rating: number;
  distance_km: number;
  estimated_arrival_minutes: number;
}

// Form types for creating/updating
export interface CreateRiderRequest {
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: VehicleType;
  license_number: string;
  base_location?: string;
  base_coordinates?: Coordinates;
  service_radius_km?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface UpdateRiderRequest {
  is_online?: boolean;
  current_location?: string;
  current_coordinates?: Coordinates;
  working_hours?: WorkingHours;
  service_radius_km?: number;
  preferred_delivery_types?: string[];
  max_delivery_distance?: number;
  accepts_cash_payments?: boolean;
  accepts_card_payments?: boolean;
}

export interface CreateDeliveryRequest {
  pickup_address: string;
  pickup_coordinates: Coordinates;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_instructions?: string;

  delivery_address: string;
  delivery_coordinates: Coordinates;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;

  package_description?: string;
  package_weight?: number;
  package_dimensions?: PackageDimensions;
  package_value?: number;
  fragile?: boolean;

  delivery_type?: DeliveryType;
  requested_pickup_time?: string;
  payment_method?: string;
}

// Statistics and analytics types
export interface RiderStats {
  total_riders: number;
  active_riders: number;
  online_riders: number;
  total_deliveries_today: number;
  total_earnings_today: number;
  average_rating: number;
  completion_rate: number;
}

export interface RiderPerformance {
  rider_id: string;
  full_name: string;
  total_deliveries: number;
  completed_deliveries: number;
  completion_rate: number;
  average_rating: number;
  total_earnings: number;
  average_delivery_time: number;
  on_time_percentage: number;
}

// Filter and search types
export interface RiderFilters {
  status?: RiderStatus[];
  vehicle_type?: VehicleType[];
  is_online?: boolean;
  min_rating?: number;
  location_radius_km?: number;
  location_center?: Coordinates;
}

export interface DeliveryFilters {
  status?: DeliveryStatus[];
  delivery_type?: DeliveryType[];
  rider_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}
