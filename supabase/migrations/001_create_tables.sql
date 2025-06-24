-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('customer', 'provider', 'rider');

CREATE TYPE provider_status AS ENUM ('pending', 'approved', 'suspended');

CREATE TYPE rider_status AS ENUM ('pending', 'approved', 'suspended');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    user_type user_type DEFAULT 'customer',
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
    experience_years INTEGER,
    availability TEXT,
    certifications TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    status provider_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create riders table
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100),
    license_number VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    current_location TEXT,
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
    additional_details TEXT,
    status booking_status DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
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

-- Create RLS policies
-- Users can read/update their own data
CREATE POLICY "Users can view own data" ON users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update own data" ON users FOR
UPDATE USING (auth.uid () = id);

-- Providers can read/update their own data
CREATE POLICY "Providers can view own data" ON providers FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Providers can update own data" ON providers FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Providers can insert own data" ON providers FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Anyone can view approved providers
CREATE POLICY "Anyone can view approved providers" ON providers FOR
SELECT USING (status = 'approved');

-- Riders can read/update their own data
CREATE POLICY "Riders can view own data" ON riders FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Riders can update own data" ON riders FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Riders can insert own data" ON riders FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Bookings policies
CREATE POLICY "Customers can view own bookings" ON bookings FOR
SELECT USING (auth.uid () = customer_id);

CREATE POLICY "Customers can create bookings" ON bookings FOR
INSERT
WITH
    CHECK (auth.uid () = customer_id);

CREATE POLICY "Customers can update own bookings" ON bookings FOR
UPDATE USING (auth.uid () = customer_id);

-- Providers can view bookings assigned to them
CREATE POLICY "Providers can view assigned bookings" ON bookings FOR
SELECT USING (
        provider_id IN (
            SELECT id
            FROM providers
            WHERE
                user_id = auth.uid ()
        )
    );

-- Riders can view all pending bookings and their assigned bookings
CREATE POLICY "Riders can view pending bookings" ON bookings FOR
SELECT USING (
        (
            status = 'pending'
            AND rider_id IS NULL
        )
        OR (
            rider_id IN (
                SELECT id
                FROM riders
                WHERE
                    user_id = auth.uid ()
            )
        )
    );

-- Riders can update bookings assigned to them
CREATE POLICY "Riders can update assigned bookings" ON bookings FOR
UPDATE USING (
    rider_id IN (
        SELECT id
        FROM riders
        WHERE
            user_id = auth.uid ()
    )
);

-- Function to handle user creation and profile setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, phone, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')::user_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();