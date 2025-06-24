-- QUICK SETUP: Copy and paste this entire script into Supabase SQL Editor
-- This will create the riders table and all necessary components

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE rider_status AS ENUM ('pending', 'approved', 'active', 'inactive', 'suspended');

EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Type rider_status already exists, skipping...';

END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('bike', 'scooter', 'motorcycle', 'car', 'bicycle', 'on_foot');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type vehicle_type already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed');
EXCEPTION WHEN duplicate_object THEN 
    RAISE NOTICE 'Type delivery_status already exists, skipping...';
END $$;

-- Create riders table
CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

-- Personal Information
full_name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
phone VARCHAR(20) NOT NULL,
date_of_birth DATE,
profile_photo_url TEXT,

-- Rider-specific Information
vehicle_type vehicle_type NOT NULL,
vehicle_model VARCHAR(100),
vehicle_registration VARCHAR(50),
license_number VARCHAR(50) NOT NULL,
license_expiry DATE,

-- Location & Availability
is_online BOOLEAN DEFAULT FALSE,
current_location TEXT,
current_coordinates JSONB,
base_location TEXT,
base_coordinates JSONB,
service_radius_km DECIMAL(8, 2) DEFAULT 10.0 CHECK (service_radius_km > 0),

-- Working Hours
working_hours JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "18:00", "active": true},
        "tuesday": {"start": "09:00", "end": "18:00", "active": true},
        "wednesday": {"start": "09:00", "end": "18:00", "active": true},
        "thursday": {"start": "09:00", "end": "18:00", "active": true},
        "friday": {"start": "09:00", "end": "18:00", "active": true},
        "saturday": {"start": "09:00", "end": "18:00", "active": true},
        "sunday": {"start": "09:00", "end": "18:00", "active": false}
    }',

-- Performance Metrics
rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (
    rating >= 0
    AND rating <= 5
),
total_deliveries INTEGER DEFAULT 0 CHECK (total_deliveries >= 0),
completed_deliveries INTEGER DEFAULT 0 CHECK (completed_deliveries >= 0),
cancelled_deliveries INTEGER DEFAULT 0 CHECK (cancelled_deliveries >= 0),
average_delivery_time INTEGER DEFAULT 0, -- in minutes

-- Financial Information
earnings_total DECIMAL(12, 2) DEFAULT 0.0 CHECK (earnings_total >= 0),
earnings_this_month DECIMAL(12, 2) DEFAULT 0.0 CHECK (earnings_this_month >= 0),
commission_rate DECIMAL(5, 2) DEFAULT 15.0 CHECK (
    commission_rate >= 0
    AND commission_rate <= 100
),

-- Documents & Verification
documents JSONB DEFAULT '{
        "drivers_license": {"uploaded": false, "verified": false, "url": null},
        "vehicle_registration": {"uploaded": false, "verified": false, "url": null},
        "insurance": {"uploaded": false, "verified": false, "url": null},
        "background_check": {"uploaded": false, "verified": false, "url": null}
    }',
verification_status VARCHAR(20) DEFAULT 'pending',
verified_at TIMESTAMP
WITH
    TIME ZONE,

-- Emergency Contact
emergency_contact_name VARCHAR(255),
emergency_contact_phone VARCHAR(20),
emergency_contact_relationship VARCHAR(50),

-- Account Status
status rider_status DEFAULT 'pending',
approved_at TIMESTAMP
WITH
    TIME ZONE,
    last_active_at TIMESTAMP
WITH
    TIME ZONE,
    last_location_update TIMESTAMP
WITH
    TIME ZONE,

-- Preferences
preferred_delivery_types TEXT[] DEFAULT ARRAY['standard', 'express', 'scheduled'],
    max_delivery_distance DECIMAL(8,2) DEFAULT 25.0,
    accepts_cash_payments BOOLEAN DEFAULT TRUE,
    accepts_card_payments BOOLEAN DEFAULT TRUE,

-- Metadata
created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW(),

-- Constraints
CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_name CHECK (LENGTH(TRIM(full_name)) >= 2)
);

-- Create delivery_requests table
CREATE TABLE IF NOT EXISTS public.delivery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

-- Pickup Information
pickup_address TEXT NOT NULL,
pickup_coordinates JSONB NOT NULL,
pickup_contact_name VARCHAR(255),
pickup_contact_phone VARCHAR(20),
pickup_instructions TEXT,

-- Delivery Information
delivery_address TEXT NOT NULL,
delivery_coordinates JSONB NOT NULL,
delivery_contact_name VARCHAR(255),
delivery_contact_phone VARCHAR(20),
delivery_instructions TEXT,

-- Package Details
package_description TEXT,
package_weight DECIMAL(8, 2), -- in kg
package_dimensions JSONB, -- {"length": 0, "width": 0, "height": 0}
package_value DECIMAL(10, 2),
fragile BOOLEAN DEFAULT FALSE,

-- Timing
requested_pickup_time TIMESTAMP
WITH
    TIME ZONE,
    estimated_delivery_time TIMESTAMP
WITH
    TIME ZONE,
    actual_pickup_time TIMESTAMP
WITH
    TIME ZONE,
    actual_delivery_time TIMESTAMP
WITH
    TIME ZONE,

-- Status and Progress
status delivery_status DEFAULT 'pending',
delivery_type VARCHAR(20) DEFAULT 'standard' CHECK (
    delivery_type IN (
        'standard',
        'express',
        'scheduled',
        'same_day'
    )
),

-- Financial
base_fee DECIMAL(10, 2) NOT NULL DEFAULT 5.0 CHECK (base_fee >= 0),
distance_fee DECIMAL(10, 2) DEFAULT 0.0 CHECK (distance_fee >= 0),
express_fee DECIMAL(10, 2) DEFAULT 0.0 CHECK (express_fee >= 0),
total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
rider_earnings DECIMAL(10, 2) DEFAULT 0.0 CHECK (rider_earnings >= 0),
payment_method VARCHAR(20) DEFAULT 'cash',
payment_status VARCHAR(20) DEFAULT 'pending',

-- Distance and Route
distance_km DECIMAL(8, 2),
estimated_duration_minutes INTEGER,
route_data JSONB,

-- Tracking
tracking_number VARCHAR(50) UNIQUE,
current_location JSONB,
delivery_proof JSONB, -- photos, signatures, etc.

-- Ratings and Feedback
customer_rating INTEGER CHECK (
    customer_rating >= 1
    AND customer_rating <= 5
),
customer_feedback TEXT,
rider_rating INTEGER CHECK (
    rider_rating >= 1
    AND rider_rating <= 5
),
rider_feedback TEXT,

-- Metadata
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create rider_earnings table
CREATE TABLE IF NOT EXISTS public.rider_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
    delivery_request_id UUID REFERENCES public.delivery_requests(id) ON DELETE SET NULL,

-- Earning Details
amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
earning_type VARCHAR(30) NOT NULL CHECK (
    earning_type IN (
        'delivery_fee',
        'tip',
        'bonus',
        'incentive',
        'adjustment'
    )
),
description TEXT,

-- Period Information
earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
week_start DATE,
month_year VARCHAR(7), -- Format: 2024-01

-- Payment Status
paid BOOLEAN DEFAULT FALSE,
paid_at TIMESTAMP
WITH
    TIME ZONE,
    payment_batch_id VARCHAR(100),

-- Metadata
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders (user_id);

CREATE INDEX IF NOT EXISTS idx_riders_status ON public.riders (status);

CREATE INDEX IF NOT EXISTS idx_riders_online ON public.riders (is_online);

CREATE INDEX IF NOT EXISTS idx_riders_location ON public.riders USING GIN (current_coordinates);

CREATE INDEX IF NOT EXISTS idx_riders_email ON public.riders (email);

CREATE INDEX IF NOT EXISTS idx_riders_phone ON public.riders (phone);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_rider ON public.delivery_requests (rider_id);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_customer ON public.delivery_requests (customer_id);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests (status);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_at ON public.delivery_requests (created_at);

CREATE INDEX IF NOT EXISTS idx_rider_earnings_rider ON public.rider_earnings (rider_id);

CREATE INDEX IF NOT EXISTS idx_rider_earnings_date ON public.rider_earnings (earned_date);

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371.0;
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find nearby available riders
CREATE OR REPLACE FUNCTION public.find_available_riders(
    pickup_lat DECIMAL, 
    pickup_lng DECIMAL, 
    max_distance_km DECIMAL DEFAULT 15.0
)
RETURNS TABLE (
    rider_id UUID,
    full_name VARCHAR,
    vehicle_type vehicle_type,
    rating DECIMAL,
    distance_km DECIMAL,
    estimated_arrival_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as rider_id,
        r.full_name,
        r.vehicle_type,
        r.rating,
        public.calculate_distance_km(
            pickup_lat,
            pickup_lng,
            (r.current_coordinates->>'lat')::DECIMAL,
            (r.current_coordinates->>'lng')::DECIMAL
        ) as distance_km,
        -- Estimate arrival time based on vehicle type and distance
        CASE 
            WHEN r.vehicle_type IN ('bike', 'scooter', 'motorcycle') THEN
                (public.calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 3)::INTEGER -- ~20 km/h average
            WHEN r.vehicle_type = 'car' THEN
                (public.calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 2)::INTEGER -- ~30 km/h average in city
            ELSE
                (public.calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 6)::INTEGER -- ~10 km/h for bicycle/walking
        END as estimated_arrival_minutes
    FROM public.riders r
    WHERE
        r.is_online = TRUE
        AND r.status = 'active'
        AND r.current_coordinates IS NOT NULL
        AND public.calculate_distance_km(
            pickup_lat,
            pickup_lng,
            (r.current_coordinates->>'lat')::DECIMAL,
            (r.current_coordinates->>'lng')::DECIMAL
        ) <= LEAST(r.service_radius_km, max_distance_km)
    ORDER BY distance_km ASC, rating DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for riders table
DROP POLICY IF EXISTS "Users can manage their own rider profile" ON public.riders;

CREATE POLICY "Users can manage their own rider profile" ON public.riders USING (auth.uid () = user_id);

-- Create RLS policies for delivery_requests table
DROP POLICY IF EXISTS "Users can view their delivery requests" ON public.delivery_requests;

CREATE POLICY "Users can view their delivery requests" ON public.delivery_requests FOR
SELECT USING (
        auth.uid () = customer_id
        OR auth.uid () = (
            SELECT user_id
            FROM public.riders
            WHERE
                id = rider_id
        )
    );

DROP POLICY IF EXISTS "Customers can create delivery requests" ON public.delivery_requests;

CREATE POLICY "Customers can create delivery requests" ON public.delivery_requests FOR
INSERT
WITH
    CHECK (auth.uid () = customer_id);

DROP POLICY IF EXISTS "Riders can update assigned deliveries" ON public.delivery_requests;

CREATE POLICY "Riders can update assigned deliveries" ON public.delivery_requests FOR
UPDATE USING (
    auth.uid () = (
        SELECT user_id
        FROM public.riders
        WHERE
            id = rider_id
    )
);

-- Create RLS policies for rider_earnings table
DROP POLICY IF EXISTS "Riders can view their own earnings" ON public.rider_earnings;

CREATE POLICY "Riders can view their own earnings" ON public.rider_earnings FOR
SELECT USING (
        auth.uid () = (
            SELECT user_id
            FROM public.riders
            WHERE
                id = rider_id
        )
    );

-- Grant permissions
GRANT ALL ON public.riders TO authenticated;

GRANT ALL ON public.delivery_requests TO authenticated;

GRANT ALL ON public.rider_earnings TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_distance_km TO authenticated;

GRANT
EXECUTE ON FUNCTION public.find_available_riders TO authenticated;

-- Insert sample test rider for Delhi
INSERT INTO
    public.riders (
        user_id,
        full_name,
        email,
        phone,
        vehicle_type,
        license_number,
        current_location,
        service_radius_km,
        status,
        base_location,
        current_coordinates,
        base_coordinates,
        is_online
    )
VALUES (
        '022df20c-db9f-4318-b691-f53f3c5eeac5',
        'Test Rider Delhi',
        'test.rider.delhi@example.com',
        '+919876543210',
        'motorcycle',
        'DL1234567890',
        'Connaught Place, New Delhi',
        15.0,
        'active',
        'CP Metro Station, New Delhi',
        '{"lat": 28.6315, "lng": 77.2167}',
        '{"lat": 28.6315, "lng": 77.2167}',
        true
    ) ON CONFLICT (email) DO NOTHING;

-- Insert another sample rider for Mumbai
INSERT INTO
    public.riders (
        user_id,
        full_name,
        email,
        phone,
        vehicle_type,
        license_number,
        current_location,
        service_radius_km,
        status,
        base_location,
        current_coordinates,
        base_coordinates,
        is_online
    )
VALUES (
        'ca832379-831d-4caa-a9d9-894f126b9970',
        'Test Rider Mumbai',
        'test.rider.mumbai@example.com',
        '+918765432109',
        'car',
        'MH1234567890',
        'Gateway of India, Mumbai',
        20.0,
        'active',
        'CST Station, Mumbai',
        '{"lat": 18.9220, "lng": 72.8347}',
        '{"lat": 18.9220, "lng": 72.8347}',
        false
    ) ON CONFLICT (email) DO NOTHING;

-- Verify the setup
SELECT
    'Setup completed!' as message,
    COUNT(*) as total_riders,
    COUNT(
        CASE
            WHEN is_online THEN 1
        END
    ) as online_riders,
    COUNT(
        CASE
            WHEN status = 'active' THEN 1
        END
    ) as active_riders
FROM public.riders;

-- Comments for documentation
COMMENT ON
TABLE public.riders IS 'Dedicated riders table for delivery and transport personnel';

COMMENT ON
TABLE public.delivery_requests IS 'Table for managing delivery requests assigned to riders';

COMMENT ON
TABLE public.rider_earnings IS 'Detailed earnings tracking for riders';

COMMENT ON FUNCTION public.find_available_riders IS 'Find available riders within specified distance for pickup';

COMMENT ON FUNCTION public.calculate_distance_km IS 'Calculate distance between two coordinates using Haversine formula';