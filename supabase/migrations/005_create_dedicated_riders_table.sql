-- Create dedicated riders table (separate from providers)
-- This table is specifically for delivery/transport riders, not service providers

-- Drop existing riders table if it exists (to create clean separation)
DROP TABLE IF EXISTS riders CASCADE;

-- Create rider status enum
DO $$ BEGIN
    DROP TYPE IF EXISTS rider_status CASCADE;
    CREATE TYPE rider_status AS ENUM ('pending', 'approved', 'active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create vehicle type enum
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('bike', 'scooter', 'motorcycle', 'car', 'bicycle', 'on_foot');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create dedicated riders table
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
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
    service_radius_km DECIMAL(8,2) DEFAULT 10.0 CHECK (service_radius_km > 0),
    
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
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_deliveries INTEGER DEFAULT 0 CHECK (total_deliveries >= 0),
    completed_deliveries INTEGER DEFAULT 0 CHECK (completed_deliveries >= 0),
    cancelled_deliveries INTEGER DEFAULT 0 CHECK (cancelled_deliveries >= 0),
    average_delivery_time INTEGER DEFAULT 0, -- in minutes
    
    -- Financial Information
    earnings_total DECIMAL(12,2) DEFAULT 0.0 CHECK (earnings_total >= 0),
    earnings_this_month DECIMAL(12,2) DEFAULT 0.0 CHECK (earnings_this_month >= 0),
    commission_rate DECIMAL(5,2) DEFAULT 15.0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    
    -- Documents & Verification
    documents JSONB DEFAULT '{
        "drivers_license": {"uploaded": false, "verified": false, "url": null},
        "vehicle_registration": {"uploaded": false, "verified": false, "url": null},
        "insurance": {"uploaded": false, "verified": false, "url": null},
        "background_check": {"uploaded": false, "verified": false, "url": null}
    }',
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Account Status
    status rider_status DEFAULT 'pending',
    approved_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    preferred_delivery_types TEXT[] DEFAULT ARRAY['standard', 'express', 'scheduled'],
    max_delivery_distance DECIMAL(8,2) DEFAULT 25.0,
    accepts_cash_payments BOOLEAN DEFAULT TRUE,
    accepts_card_payments BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_name CHECK (LENGTH(TRIM(full_name)) >= 2),
    CONSTRAINT valid_rating_calculation CHECK (
        total_deliveries = 0 OR 
        (completed_deliveries + cancelled_deliveries) <= total_deliveries
    )
);

-- Create delivery_requests table for riders
CREATE TABLE delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
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
    package_weight DECIMAL(8,2), -- in kg
    package_dimensions JSONB, -- {"length": 0, "width": 0, "height": 0}
    package_value DECIMAL(10,2),
    fragile BOOLEAN DEFAULT FALSE,
    
    -- Timing
    requested_pickup_time TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    
    -- Status and Progress
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'picked_up', 'in_transit', 
        'delivered', 'cancelled', 'failed'
    )),
    delivery_type VARCHAR(20) DEFAULT 'standard' CHECK (delivery_type IN (
        'standard', 'express', 'scheduled', 'same_day'
    )),
    
    -- Financial
    base_fee DECIMAL(10,2) NOT NULL CHECK (base_fee >= 0),
    distance_fee DECIMAL(10,2) DEFAULT 0.0 CHECK (distance_fee >= 0),
    express_fee DECIMAL(10,2) DEFAULT 0.0 CHECK (express_fee >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    rider_earnings DECIMAL(10,2) DEFAULT 0.0 CHECK (rider_earnings >= 0),
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Distance and Route
    distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    route_data JSONB,
    
    -- Tracking
    tracking_number VARCHAR(50) UNIQUE,
    current_location JSONB,
    delivery_proof JSONB, -- photos, signatures, etc.
    
    -- Ratings and Feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
    rider_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create rider_earnings table for detailed earnings tracking
CREATE TABLE rider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    delivery_request_id UUID REFERENCES delivery_requests(id) ON DELETE SET NULL,
    
    -- Earning Details
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    earning_type VARCHAR(30) NOT NULL CHECK (earning_type IN (
        'delivery_fee', 'tip', 'bonus', 'incentive', 'adjustment'
    )),
    description TEXT,
    
    -- Period Information
    earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_start DATE,
    month_year VARCHAR(7), -- Format: 2024-01
    
    -- Payment Status
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_batch_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_riders_user_id ON riders(user_id);
CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_riders_online ON riders(is_online);
CREATE INDEX idx_riders_location ON riders USING GIN (current_coordinates);
CREATE INDEX idx_riders_base_location ON riders USING GIN (base_coordinates);
CREATE INDEX idx_riders_rating ON riders(rating DESC);
CREATE INDEX idx_riders_vehicle_type ON riders(vehicle_type);
CREATE INDEX idx_riders_service_radius ON riders(service_radius_km);

CREATE INDEX idx_delivery_requests_rider ON delivery_requests(rider_id);
CREATE INDEX idx_delivery_requests_customer ON delivery_requests(customer_id);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_delivery_requests_created_at ON delivery_requests(created_at);
CREATE INDEX idx_delivery_requests_pickup_coords ON delivery_requests USING GIN (pickup_coordinates);
CREATE INDEX idx_delivery_requests_delivery_coords ON delivery_requests USING GIN (delivery_coordinates);
CREATE INDEX idx_delivery_requests_tracking ON delivery_requests(tracking_number);

CREATE INDEX idx_rider_earnings_rider ON rider_earnings(rider_id);
CREATE INDEX idx_rider_earnings_date ON rider_earnings(earned_date);
CREATE INDEX idx_rider_earnings_month ON rider_earnings(month_year);
CREATE INDEX idx_rider_earnings_paid ON rider_earnings(paid);

-- Create functions for rider operations

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
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
CREATE OR REPLACE FUNCTION find_available_riders(
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
        calculate_distance_km(
            pickup_lat,
            pickup_lng,
            (r.current_coordinates->>'lat')::DECIMAL,
            (r.current_coordinates->>'lng')::DECIMAL
        ) as distance_km,
        -- Estimate arrival time based on vehicle type and distance
        CASE 
            WHEN r.vehicle_type IN ('bike', 'scooter', 'motorcycle') THEN
                (calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 3)::INTEGER -- ~20 km/h average
            WHEN r.vehicle_type = 'car' THEN
                (calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 2)::INTEGER -- ~30 km/h average in city
            ELSE
                (calculate_distance_km(
                    pickup_lat, pickup_lng,
                    (r.current_coordinates->>'lat')::DECIMAL,
                    (r.current_coordinates->>'lng')::DECIMAL
                ) * 6)::INTEGER -- ~10 km/h for bicycle/walking
        END as estimated_arrival_minutes
    FROM riders r
    WHERE
        r.is_online = TRUE
        AND r.status = 'active'
        AND r.current_coordinates IS NOT NULL
        AND calculate_distance_km(
            pickup_lat,
            pickup_lng,
            (r.current_coordinates->>'lat')::DECIMAL,
            (r.current_coordinates->>'lng')::DECIMAL
        ) <= LEAST(r.service_radius_km, max_distance_km)
    ORDER BY distance_km ASC, rating DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    tracking_num VARCHAR(50);
    prefix VARCHAR(5) := 'TRK';
    timestamp_part VARCHAR(10);
    random_part VARCHAR(8);
BEGIN
    -- Get timestamp part (last 6 digits of unix timestamp)
    timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 6);
    
    -- Generate random alphanumeric string
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    tracking_num := prefix || timestamp_part || random_part;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM delivery_requests WHERE tracking_number = tracking_num) LOOP
        random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        tracking_num := prefix || timestamp_part || random_part;
    END LOOP;
    
    RETURN tracking_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_rider_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_coordinates IS DISTINCT FROM NEW.current_coordinates THEN
        NEW.last_location_update = NOW();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_delivery_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-complete when status changes to delivered
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.completed_at = NOW();
        NEW.actual_delivery_time = NOW();
    END IF;
    
    -- Generate tracking number for new requests
    IF TG_OP = 'INSERT' AND NEW.tracking_number IS NULL THEN
        NEW.tracking_number = generate_tracking_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_rider_location
    BEFORE UPDATE ON riders
    FOR EACH ROW
    EXECUTE FUNCTION update_rider_location_timestamp();

CREATE TRIGGER trigger_update_delivery_request
    BEFORE INSERT OR UPDATE ON delivery_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_request_timestamp();

-- Create trigger to update rider earnings when delivery is completed
CREATE OR REPLACE FUNCTION update_rider_earnings_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- When delivery is completed, add earnings record
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.rider_id IS NOT NULL THEN
        INSERT INTO rider_earnings (
            rider_id,
            delivery_request_id,
            amount,
            earning_type,
            description,
            earned_date,
            month_year
        ) VALUES (
            NEW.rider_id,
            NEW.id,
            NEW.rider_earnings,
            'delivery_fee',
            'Delivery completed: ' || NEW.tracking_number,
            CURRENT_DATE,
            TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        );
        
        -- Update rider statistics
        UPDATE riders 
        SET 
            total_deliveries = total_deliveries + 1,
            completed_deliveries = completed_deliveries + 1,
            earnings_total = earnings_total + NEW.rider_earnings,
            earnings_this_month = earnings_this_month + NEW.rider_earnings,
            last_active_at = NOW()
        WHERE id = NEW.rider_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rider_earnings
    AFTER UPDATE ON delivery_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_rider_earnings_on_completion();

-- Enable Row Level Security
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for riders table
CREATE POLICY "Riders can view their own profile" ON riders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Riders can update their own profile" ON riders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow rider registration" ON riders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for delivery_requests table
CREATE POLICY "Users can view their delivery requests" ON delivery_requests
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = (SELECT user_id FROM riders WHERE id = rider_id)
    );

CREATE POLICY "Customers can create delivery requests" ON delivery_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Riders can update assigned deliveries" ON delivery_requests
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM riders WHERE id = rider_id));

-- Create RLS policies for rider_earnings table
CREATE POLICY "Riders can view their own earnings" ON rider_earnings
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM riders WHERE id = rider_id));

-- Grant permissions
GRANT ALL ON riders TO authenticated;
GRANT ALL ON delivery_requests TO authenticated;
GRANT ALL ON rider_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION find_available_riders TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tracking_number TO authenticated;

-- Insert sample data for testing (optional)
DO $$
BEGIN
    -- Only insert if no riders exist
    IF NOT EXISTS (SELECT 1 FROM riders LIMIT 1) THEN
        INSERT INTO riders (
            user_id, full_name, email, phone, vehicle_type, license_number,
            current_location, service_radius_km, status
        ) VALUES (
            gen_random_uuid(),
            'Sample Rider',
            'rider@example.com',
            '+1234567890',
            'motorcycle',
            'DL123456789',
            'Downtown Area',
            15.0,
            'active'
        );
    END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE riders IS 'Dedicated riders table for delivery and transport personnel';
COMMENT ON TABLE delivery_requests IS 'Table for managing delivery requests assigned to riders';
COMMENT ON TABLE rider_earnings IS 'Detailed earnings tracking for riders';
COMMENT ON FUNCTION find_available_riders IS 'Find available riders within specified distance for pickup';
COMMENT ON FUNCTION generate_tracking_number IS 'Generate unique tracking numbers for delivery requests';
