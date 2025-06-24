-- Complete database setup with all tables and validation
-- This migration ensures all tables exist and handles email validation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('customer', 'provider', 'rider');

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rider_status AS ENUM ('pending', 'approved', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS password_resets CASCADE;

DROP TABLE IF EXISTS bookings CASCADE;

DROP TABLE IF EXISTS riders CASCADE;

DROP TABLE IF EXISTS providers CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- Create users table with proper validation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_type user_type DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Constraints
CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT valid_name CHECK (LENGTH(TRIM(full_name)) >= 2)
);

-- Create password reset tokens table
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    services TEXT[] NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0),
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    availability TEXT,
    certifications TEXT,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    completed_jobs INTEGER DEFAULT 0 CHECK (completed_jobs >= 0),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Constraints
CONSTRAINT valid_services CHECK (array_length(services, 1) > 0) );

-- Create riders table
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100),
    license_number VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    current_location TEXT,
    coordinates JSONB,
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (
        rating >= 0
        AND rating <= 5
    ),
    completed_deliveries INTEGER DEFAULT 0 CHECK (completed_deliveries >= 0),
    status rider_status DEFAULT 'pending',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create bookings table
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
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Constraints
CONSTRAINT valid_scheduled_date CHECK (scheduled_date >= CURRENT_DATE),
    CONSTRAINT valid_services CHECK (array_length(services, 1) > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_phone ON users (phone);

CREATE INDEX idx_users_type ON users (user_type);

CREATE INDEX idx_users_created_at ON users (created_at);

CREATE INDEX idx_password_resets_token ON password_resets (token);

CREATE INDEX idx_password_resets_user_id ON password_resets (user_id);

CREATE INDEX idx_password_resets_expires_at ON password_resets (expires_at);

CREATE INDEX idx_providers_user_id ON providers (user_id);

CREATE INDEX idx_providers_status ON providers (status);

CREATE INDEX idx_providers_rating ON providers (rating);

CREATE INDEX idx_providers_services ON providers USING GIN (services);

CREATE INDEX idx_riders_user_id ON riders (user_id);

CREATE INDEX idx_riders_online ON riders (is_online);

CREATE INDEX idx_riders_status ON riders (status);

CREATE INDEX idx_riders_coordinates ON riders USING GIN (coordinates);

CREATE INDEX idx_bookings_customer ON bookings (customer_id);

CREATE INDEX idx_bookings_provider ON bookings (provider_id);

CREATE INDEX idx_bookings_rider ON bookings (rider_id);

CREATE INDEX idx_bookings_status ON bookings (status);

CREATE INDEX idx_bookings_date ON bookings (scheduled_date);

CREATE INDEX idx_bookings_created_at ON bookings (created_at);

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

-- Function to clean up expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_resets
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to check for duplicate email (case-insensitive)
CREATE OR REPLACE FUNCTION check_duplicate_email(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE LOWER(email) = LOWER(email_to_check)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check for duplicate phone
CREATE OR REPLACE FUNCTION check_duplicate_phone(phone_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE phone = phone_to_check
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Service role can access all users" ON users FOR ALL USING (
    current_setting ('role') = 'service_role'
);

CREATE POLICY "Users can view own data" ON users FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        auth.uid()::text = id::text
    ELSE false END
);

CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        auth.uid()::text = id::text
    ELSE false END
);

-- Password resets policies
CREATE POLICY "Service role can access all password resets" ON password_resets FOR ALL USING (
    current_setting ('role') = 'service_role'
);

CREATE POLICY "Users can view own password resets" ON password_resets FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        user_id::text = auth.uid()::text
    ELSE false END
);

-- Providers policies
CREATE POLICY "Service role can access all providers" ON providers FOR ALL USING (
    current_setting ('role') = 'service_role'
);

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

CREATE POLICY "Anyone can view approved providers" ON providers FOR
SELECT USING (status = 'approved');

-- Riders policies
CREATE POLICY "Service role can access all riders" ON riders FOR ALL USING (
    current_setting ('role') = 'service_role'
);

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
CREATE POLICY "Service role can access all bookings" ON bookings FOR ALL USING (
    current_setting ('role') = 'service_role'
);

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

CREATE POLICY "Riders can view available bookings" ON bookings FOR SELECT USING (
    CASE WHEN current_setting('role') = 'authenticated' THEN
        (status = 'pending' AND rider_id IS NULL) OR
        (rider_id IN (SELECT id FROM riders WHERE user_id::text = auth.uid()::text))
    ELSE false END
);

-- Insert demo data with proper password hashing (bcrypt hash for demo passwords)
INSERT INTO
    users (
        id,
        email,
        password_hash,
        full_name,
        phone,
        user_type,
        email_verified
    )
VALUES (
        '123e4567-e89b-12d3-a456-426614174000',
        'customer@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Customer',
        '+91 98765 43210',
        'customer',
        true
    ),
    (
        '123e4567-e89b-12d3-a456-426614174001',
        'rider@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Rider',
        '+91 87654 32109',
        'rider',
        true
    ),
    (
        '123e4567-e89b-12d3-a456-426614174002',
        'provider@demo.com',
        '$2b$12$DEMO_BCRYPT_HASH_PLACEHOLDER_FOR_PASSWORD123',
        'Demo Provider',
        '+91 76543 21098',
        'provider',
        true
    ) ON CONFLICT (email) DO NOTHING;

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
    ) ON CONFLICT DO NOTHING;

-- Insert demo provider
INSERT INTO providers (user_id, services, hourly_rate, bio, status) VALUES
('123e4567-e89b-12d3-a456-426614174002', ARRAY['House Cleaning', 'Furniture Assembly'], 25.00, 'Professional service provider with 5 years experience', 'approved')
ON CONFLICT DO NOTHING;

-- Create a view for user authentication
CREATE OR REPLACE VIEW user_auth_view AS
SELECT
    id,
    email,
    password_hash,
    full_name,
    phone,
    user_type,
    email_verified,
    phone_verified,
    last_login,
    created_at
FROM users;

-- Grant necessary permissions
GRANT SELECT ON user_auth_view TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create function to handle user registration with duplicate checking
CREATE OR REPLACE FUNCTION register_user(
    p_email TEXT,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_user_type user_type DEFAULT 'customer'
)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID) AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check for duplicate email (case-insensitive)
    IF check_duplicate_email(p_email) THEN
        RETURN QUERY SELECT false, 'Email address already exists', NULL::UUID;
        RETURN;
    END IF;

    -- Check for duplicate phone
    IF check_duplicate_phone(p_phone) THEN
        RETURN QUERY SELECT false, 'Phone number already exists', NULL::UUID;
        RETURN;
    END IF;

    -- Insert new user
    INSERT INTO users (email, password_hash, full_name, phone, user_type)
    VALUES (LOWER(p_email), p_password_hash, p_full_name, p_phone, p_user_type)
    RETURNING id INTO new_user_id;

    RETURN QUERY SELECT true, 'User registered successfully', new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle password reset
CREATE OR REPLACE FUNCTION create_password_reset(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, token TEXT) AS $$
DECLARE
    user_id_found UUID;
    reset_token TEXT;
BEGIN
    -- Find user by email
    SELECT id INTO user_id_found
    FROM users
    WHERE LOWER(email) = LOWER(p_email);

    IF user_id_found IS NULL THEN
        RETURN QUERY SELECT false, 'Email not found', NULL::TEXT;
        RETURN;
    END IF;

    -- Generate reset token
    reset_token := encode(gen_random_bytes(32), 'hex');

    -- Invalidate existing tokens for this user
    UPDATE password_resets
    SET used = true
    WHERE user_id = user_id_found AND used = false;

    -- Insert new reset token
    INSERT INTO password_resets (user_id, token, expires_at)
    VALUES (user_id_found, reset_token, NOW() + INTERVAL '1 hour');

    RETURN QUERY SELECT true, 'Password reset token created', reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset password using token
CREATE OR REPLACE FUNCTION reset_password_with_token(p_token TEXT, p_new_password_hash TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    reset_record RECORD;
BEGIN
    -- Find valid, unused token
    SELECT pr.*, u.id as user_id
    INTO reset_record
    FROM password_resets pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.token = p_token
      AND pr.used = false
      AND pr.expires_at > NOW();

    IF reset_record IS NULL THEN
        RETURN QUERY SELECT false, 'Invalid or expired reset token';
        RETURN;
    END IF;

    -- Update password
    UPDATE users
    SET password_hash = p_new_password_hash, updated_at = NOW()
    WHERE id = reset_record.user_id;

    -- Mark token as used
    UPDATE password_resets
    SET used = true
    WHERE id = reset_record.id;

    RETURN QUERY SELECT true, 'Password updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
