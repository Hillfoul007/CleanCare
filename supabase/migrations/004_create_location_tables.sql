-- Create user_locations table for storing user's saved locations
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  formatted_address TEXT,
  coordinates JSONB NOT NULL,
  place_id TEXT,
  address_components JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  location_type TEXT CHECK (location_type IN ('home', 'work', 'other')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id and coordinates for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_favorites ON user_locations(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_locations_coordinates ON user_locations USING GIN (coordinates);

-- Create location_search_history table for storing user's search history
CREATE TABLE IF NOT EXISTS location_search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  selected_address TEXT,
  coordinates JSONB,
  place_id TEXT,
  search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id and search_timestamp
CREATE INDEX IF NOT EXISTS idx_location_search_history_user_id ON location_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_search_history_timestamp ON location_search_history(user_id, search_timestamp DESC);

-- Add location columns to existing bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS formatted_address TEXT,
ADD COLUMN IF NOT EXISTS coordinates JSONB,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

-- Create index for bookings coordinates
CREATE INDEX IF NOT EXISTS idx_bookings_coordinates ON bookings USING GIN (coordinates);

-- Add enhanced location columns to riders table
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_location TEXT,
ADD COLUMN IF NOT EXISTS base_coordinates JSONB,
ADD COLUMN IF NOT EXISTS current_coordinates JSONB,
ADD COLUMN IF NOT EXISTS service_radius_km DECIMAL(10,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS operating_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_services TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS availability_hours JSONB DEFAULT '{"start": "08:00", "end": "20:00"}',
ADD COLUMN IF NOT EXISTS documents JSONB,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Create index for riders coordinates
CREATE INDEX IF NOT EXISTS idx_riders_coordinates ON riders USING GIN (current_coordinates);
CREATE INDEX IF NOT EXISTS idx_riders_online_location ON riders(is_online, current_coordinates) WHERE is_online = TRUE;

-- Create function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371.0; -- Earth radius in kilometers
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

-- Create function to find nearby riders within radius
CREATE OR REPLACE FUNCTION find_nearby_riders(booking_lat DECIMAL, booking_lng DECIMAL, radius_km DECIMAL DEFAULT 5.0)
RETURNS TABLE (
  rider_id UUID,
  user_id UUID,
  distance_km DECIMAL,
  current_location TEXT,
  current_coordinates JSONB,
  rating DECIMAL,
  completed_deliveries INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as rider_id,
    r.user_id,
    calculate_distance_km(
      booking_lat,
      booking_lng,
      (r.current_coordinates->>'lat')::DECIMAL,
      (r.current_coordinates->>'lng')::DECIMAL
    ) as distance_km,
    r.current_location,
    r.current_coordinates,
    r.rating,
    r.completed_deliveries
  FROM riders r
  WHERE
    r.is_online = TRUE
    AND r.status = 'approved'
    AND r.current_coordinates IS NOT NULL
    AND calculate_distance_km(
      booking_lat,
      booking_lng,
      (r.current_coordinates->>'lat')::DECIMAL,
      (r.current_coordinates->>'lng')::DECIMAL
    ) <= COALESCE(r.service_radius_km, radius_km)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to update location timestamp automatically
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_coordinates IS DISTINCT FROM NEW.current_coordinates THEN
    NEW.last_location_update = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic location timestamp update
DROP TRIGGER IF EXISTS trigger_update_rider_location_timestamp ON riders;
CREATE TRIGGER trigger_update_rider_location_timestamp
  BEFORE UPDATE ON riders
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

-- Create function to update user_locations timestamp
CREATE OR REPLACE FUNCTION update_user_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_locations timestamp
DROP TRIGGER IF EXISTS trigger_update_user_locations_timestamp ON user_locations;
CREATE TRIGGER trigger_update_user_locations_timestamp
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_locations_timestamp();

-- Create RLS (Row Level Security) policies
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_search_history ENABLE ROW LEVEL SECURITY;

-- Policy for user_locations: users can only access their own locations
CREATE POLICY "Users can view their own locations" ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON user_locations
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for location_search_history: users can only access their own search history
CREATE POLICY "Users can view their own search history" ON location_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON location_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON location_search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_locations TO authenticated;
GRANT ALL ON location_search_history TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_riders TO authenticated;

-- Insert some sample data for testing (optional)
-- This will only run if the tables are empty
DO $$
BEGIN
  -- Add sample user locations (only if user_locations table is empty)
  IF NOT EXISTS (SELECT 1 FROM user_locations LIMIT 1) THEN
    -- Note: In production, you would insert real user data
    -- This is just for development testing
    INSERT INTO user_locations (user_id, address, formatted_address, coordinates, location_type, name, is_favorite) VALUES
    (
      'sample-user-id-1',
      'Times Square, New York, NY, USA',
      'Times Square, New York, NY 10036, USA',
      '{"lat": 40.7580, "lng": -73.9855}',
      'other',
      'Times Square',
      true
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Create view for location analytics (optional)
CREATE OR REPLACE VIEW location_analytics AS
SELECT
  u.email,
  COUNT(ul.id) as total_locations,
  COUNT(CASE WHEN ul.is_favorite THEN 1 END) as favorite_locations,
  COUNT(CASE WHEN ul.location_type = 'home' THEN 1 END) as home_locations,
  COUNT(CASE WHEN ul.location_type = 'work' THEN 1 END) as work_locations,
  MAX(ul.created_at) as last_location_added
FROM auth.users u
LEFT JOIN user_locations ul ON u.id = ul.user_id
GROUP BY u.id, u.email;

-- Grant access to the view
GRANT SELECT ON location_analytics TO authenticated;

COMMENT ON TABLE user_locations IS 'Stores user saved locations with Google Places data';
COMMENT ON TABLE location_search_history IS 'Tracks user location search history for analytics';
COMMENT ON FUNCTION calculate_distance_km IS 'Calculates distance between two geographic points using Haversine formula';
COMMENT ON FUNCTION find_nearby_riders IS 'Finds available riders within specified radius of a booking location';
