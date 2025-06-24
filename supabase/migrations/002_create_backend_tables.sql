-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('customer', 'provider', 'rider');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

CREATE TYPE rider_status AS ENUM ('pending', 'approved', 'suspended');

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings CASCADE;

DROP TABLE IF EXISTS riders CASCADE;

DROP TABLE IF EXISTS providers CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- Create users table (backend compatible)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_type user_type DEFAULT 'customer',
    last_login TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    services TEXT[] NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    availability TEXT,
    certifications TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create riders table (backend compatible)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100),
    license_number VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    current_location TEXT,
    coordinates JSONB,
    rating DECIMAL(3, 2) DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    status rider_status DEFAULT 'pending',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create bookings table (backend compatible)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    rider_id UUID REFERENCES riders(id),
    service_type VARCHAR(255) NOT NULL,
    services TEXT[] NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    coordinates JSONB,
    additional_details TEXT,
    status booking_status DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_phone ON users (phone);

CREATE INDEX idx_users_type ON users (user_type);

CREATE INDEX idx_providers_user_id ON providers (user_id);

CREATE INDEX idx_providers_status ON providers (status);

CREATE INDEX idx_riders_user_id ON riders (user_id);

CREATE INDEX idx_riders_online ON riders (is_online);

CREATE INDEX idx_riders_status ON riders (status);

CREATE INDEX idx_bookings_customer ON bookings (customer_id);

CREATE INDEX idx_bookings_provider ON bookings (provider_id);

CREATE INDEX idx_bookings_rider ON bookings (rider_id);

CREATE INDEX idx_bookings_status ON bookings (status);

CREATE INDEX idx_bookings_date ON bookings (scheduled_date);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backend access
-- Allow service role to access all data (for backend operations)
CREATE POLICY "Service role can access all users" ON users FOR ALL USING (
    current_setting ('role') = 'service_role'
);

CREATE POLICY "Service role can access all providers" ON providers FOR ALL USING (
    current_setting ('role') = 'service_role'
);

CREATE POLICY "Service role can access all riders" ON riders FOR ALL USING (
    current_setting ('role') = 'service_role'
);

CREATE POLICY "Service role can access all bookings" ON bookings FOR ALL USING (
    current_setting ('role') = 'service_role'
);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        auth.uid()::text = id::text
    ELSE false END
);

-- Allow users to update their own profiles
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        auth.uid()::text = id::text
    ELSE false END
);

-- Providers policies
CREATE POLICY "Providers can view own data" ON providers FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        user_id::text = auth.uid()::text
    ELSE false END
);

CREATE POLICY "Providers can update own data" ON providers FOR UPDATE USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        user_id::text = auth.uid()::text
    ELSE false END
);

-- Anyone can view approved providers
CREATE POLICY "Anyone can view approved providers" ON providers FOR
SELECT USING (status = 'approved');

-- Riders policies
CREATE POLICY "Riders can view own data" ON riders FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        user_id::text = auth.uid()::text
    ELSE false END
);

CREATE POLICY "Riders can update own data" ON riders FOR UPDATE USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        user_id::text = auth.uid()::text
    ELSE false END
);

-- Bookings policies
CREATE POLICY "Customers can view own bookings" ON bookings FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        customer_id::text = auth.uid()::text
    ELSE false END
);

CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT WITH CHECK (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        customer_id::text = auth.uid()::text
    ELSE false END
);

-- Riders can view pending bookings and their assigned bookings
CREATE POLICY "Riders can view available bookings" ON bookings FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        (status = 'pending' AND rider_id IS NULL) OR
        (rider_id IN (SELECT id FROM riders WHERE user_id::text = auth.uid()::text))
    ELSE false END
);

-- Insert some demo data for testing
INSERT INTO
    users (
        id,
        email,
        password_hash,
        full_name,
        phone,
        user_type
    )
VALUES (
        '123e4567-e89b-12d3-a456-426614174000',
        'customer@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Customer',
        '+91 98765 43210',
        'customer'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174001',
        'rider@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Rider',
        '+91 87654 32109',
        'rider'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174002',
        'provider@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Provider',
        '+91 76543 21098',
        'provider'
    );

-- Insert demo rider
INSERT INTO
    riders (
        user_id,
        is_online,
        current_location,
        coordinates,
        status
    )
VALUES (
        '123e4567-e89b-12d3-a456-426614174001',
        true,
        'Connaught Place, New Delhi',
        '{"lat": 28.6315, "lng": 77.2167}',
        'approved'
    );

-- Insert demo provider
INSERT INTO providers (user_id, services, hourly_rate, bio, status) VALUES
('123e4567-e89b-12d3-a456-426614174002', ARRAY['House Cleaning', 'Furniture Assembly'], 25.00, 'Professional service provider with 5 years experience', 'approved');
