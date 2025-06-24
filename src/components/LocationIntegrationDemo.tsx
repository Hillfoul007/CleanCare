import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Users, Calendar, TrendingUp } from "lucide-react";
import LocationManager from "./LocationManager";
import { useLocation } from "@/hooks/useLocation";
import { providerLocationService } from "@/services/providerLocationService";
import { locationService, type Coordinates } from "@/services/locationService";
import type {
  NearbyProvider,
  NearbyRider,
} from "@/services/providerLocationService";

const LocationIntegrationDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    coordinates: Coordinates;
  } | null>(null);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyRider[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "House Cleaning",
  ]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [bookingDemo, setBookingDemo] = useState<{
    serviceType: string;
    scheduledDate: string;
    scheduledTime: string;
  }>({
    serviceType: "House Cleaning",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "14:00",
  });

  const {
    currentLocation,
    currentAddress,
    isDetecting,
    error,
    savedLocations,
    favoriteLocations,
    refreshSavedLocations,
  } = useLocation({
    enableHighAccuracy: true,
    autoGeocoding: true,
  });

  const serviceTypes = [
    "House Cleaning",
    "Furniture Assembly",
    "Home Repair",
    "Moving & Packing",
    "Laundry Service",
    "Electrical Work",
    "Plumbing",
    "Painting",
    "Gardening",
    "Car Wash",
  ];

  // Handle location selection from LocationManager
  const handleLocationChange = (address: string, coordinates?: Coordinates) => {
    if (coordinates) {
      setSelectedLocation({ address, coordinates });
    }
  };

  // Search for nearby providers
  const searchNearbyProviders = async () => {
    if (!selectedLocation) return;

    setIsSearching(true);
    try {
      const providers = await providerLocationService.findNearbyProviders({
        center: selectedLocation.coordinates,
        radius_km: searchRadius,
        service_types: selectedServices,
        rating_min: 4.0,
      });
      setNearbyProviders(providers);
    } catch (error) {
      console.error("Error searching providers:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for nearby riders
  const searchNearbyRiders = async () => {
    if (!selectedLocation) return;

    setIsSearching(true);
    try {
      const riders = await providerLocationService.findNearbyRiders(
        selectedLocation.coordinates,
        searchRadius,
      );
      setNearbyRiders(riders);
    } catch (error) {
      console.error("Error searching riders:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Create demo booking
  const createDemoBooking = async () => {
    if (!selectedLocation) return;

    try {
      const booking = await providerLocationService.createBookingWithLocation({
        customer_id: "demo-user-id", // In real app, use actual user ID
        service_type: bookingDemo.serviceType,
        services: [bookingDemo.serviceType],
        scheduled_date: bookingDemo.scheduledDate,
        scheduled_time: bookingDemo.scheduledTime,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates,
        total_price: 80,
        status: "pending",
      });

      if (booking) {
        alert("Demo booking created successfully! (This is just a demo)");

        // Try to assign optimal rider
        const assignment = await providerLocationService.assignOptimalRider(
          booking.id,
        );
        if (assignment.success) {
          alert(`Optimal rider assigned: ${assignment.riderId}`);
        } else {
          alert(`Rider assignment failed: ${assignment.error}`);
        }
      }
    } catch (error) {
      console.error("Error creating demo booking:", error);
      alert("Failed to create demo booking");
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const analyticsData =
        await providerLocationService.getLocationAnalytics("week");
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      searchNearbyProviders();
      searchNearbyRiders();
    }
  }, [selectedLocation, searchRadius, selectedServices]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Supabase + Google Maps Integration Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo showcases the complete integration between Supabase and
            Google Maps API for location-based services. Features include
            location detection, geocoding, provider matching, and data
            persistence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Location</p>
                  <p className="font-medium">
                    {currentAddress || "Not detected"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Saved Locations</p>
                  <p className="font-medium">{savedLocations.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Favorites</p>
                  <p className="font-medium">{favoriteLocations.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Analytics</p>
                  <p className="font-medium">
                    {analytics
                      ? `${analytics.total_bookings} bookings`
                      : "Loading..."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Selection */}
        <div className="lg:col-span-1">
          <LocationManager
            onLocationChange={handleLocationChange}
            enableSaveToSupabase={true}
            showFavorites={true}
            showHistory={true}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="riders">Riders</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Providers</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label>Search Radius (km)</Label>
                      <Input
                        type="number"
                        value={searchRadius}
                        onChange={(e) =>
                          setSearchRadius(Number(e.target.value))
                        }
                        className="w-20"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label>Services</Label>
                      <select
                        multiple
                        value={selectedServices}
                        onChange={(e) =>
                          setSelectedServices(
                            Array.from(
                              e.target.selectedOptions,
                              (option) => option.value,
                            ),
                          )
                        }
                        className="w-full p-2 border rounded"
                      >
                        {serviceTypes.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedLocation ? (
                    <p className="text-gray-500 text-center py-8">
                      Please select a location to find nearby providers
                    </p>
                  ) : isSearching ? (
                    <p className="text-center py-8">
                      Searching for providers...
                    </p>
                  ) : nearbyProviders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No providers found within {searchRadius}km radius
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {nearbyProviders.map((provider) => (
                        <Card key={provider.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {provider.user.full_name || "Provider"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {provider.user.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">
                                  {provider.distance_km.toFixed(1)} km away
                                </Badge>
                                <Badge variant="secondary">
                                  ★ {provider.rating.toFixed(1)}
                                </Badge>
                                <Badge>${provider.hourly_rate}/hr</Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {provider.services
                                  .slice(0, 3)
                                  .map((service) => (
                                    <Badge
                                      key={service}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {service}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                            <Button size="sm">Book Now</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="riders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Riders</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedLocation ? (
                    <p className="text-gray-500 text-center py-8">
                      Please select a location to find available riders
                    </p>
                  ) : isSearching ? (
                    <p className="text-center py-8">Searching for riders...</p>
                  ) : nearbyRiders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No riders available within {searchRadius}km radius
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {nearbyRiders.map((rider) => (
                        <Card key={rider.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {rider.user.full_name || "Rider"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {rider.current_location}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">
                                  {rider.distance_km.toFixed(1)} km away
                                </Badge>
                                <Badge variant="secondary">
                                  ★ {rider.rating.toFixed(1)}
                                </Badge>
                                <Badge className="bg-green-100 text-green-800">
                                  Online
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {rider.completed_deliveries} completed
                                deliveries
                              </p>
                            </div>
                            <div className="text-right">
                              <Navigation className="w-5 h-5 text-blue-600" />
                              <p className="text-xs text-gray-500 mt-1">
                                ETA: ~{Math.ceil(rider.distance_km * 3)} min
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Demo Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedLocation ? (
                    <p className="text-gray-500 text-center py-8">
                      Please select a location to create a booking
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Service Type</Label>
                        <select
                          value={bookingDemo.serviceType}
                          onChange={(e) =>
                            setBookingDemo({
                              ...bookingDemo,
                              serviceType: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          {serviceTypes.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={bookingDemo.scheduledDate}
                            onChange={(e) =>
                              setBookingDemo({
                                ...bookingDemo,
                                scheduledDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={bookingDemo.scheduledTime}
                            onChange={(e) =>
                              setBookingDemo({
                                ...bookingDemo,
                                scheduledTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2">Booking Summary</h4>
                        <p>
                          <strong>Service:</strong> {bookingDemo.serviceType}
                        </p>
                        <p>
                          <strong>Location:</strong> {selectedLocation.address}
                        </p>
                        <p>
                          <strong>Date & Time:</strong>{" "}
                          {bookingDemo.scheduledDate} at{" "}
                          {bookingDemo.scheduledTime}
                        </p>
                        <p>
                          <strong>Coordinates:</strong>{" "}
                          {selectedLocation.coordinates.lat.toFixed(6)},{" "}
                          {selectedLocation.coordinates.lng.toFixed(6)}
                        </p>
                      </div>

                      <Button onClick={createDemoBooking} className="w-full">
                        Create Demo Booking with Auto-Assignment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Location Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {!analytics ? (
                    <p className="text-center py-8">Loading analytics...</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-800">
                            Total Bookings
                          </h4>
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics.total_bookings}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800">
                            Total Revenue
                          </h4>
                          <p className="text-2xl font-bold text-green-600">
                            ${analytics.total_revenue}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">
                          Average Distance
                        </h4>
                        <p className="text-xl font-bold text-purple-600">
                          {analytics.average_distance.toFixed(1)} km
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Status Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(analytics.status_breakdown).map(
                            ([status, count]) => (
                              <div
                                key={status}
                                className="flex justify-between items-center"
                              >
                                <span className="capitalize">
                                  {status.replace("_", " ")}
                                </span>
                                <Badge variant="outline">
                                  {count as number}
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LocationIntegrationDemo;
