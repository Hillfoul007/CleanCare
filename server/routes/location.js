const express = require("express");
const router = express.Router();

// Geocoding using Google Maps API
router.post("/geocode", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=IN`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      // Try to get the most specific address
      let bestAddress = data.results[0].formatted_address;

      // Look for a more specific address in the results
      for (const result of data.results) {
        if (
          result.types.includes("street_address") ||
          result.types.includes("premise") ||
          result.types.includes("subpremise")
        ) {
          bestAddress = result.formatted_address;
          break;
        }
      }

      res.json({
        address: bestAddress,
        components: data.results[0].address_components,
        geometry: data.results[0].geometry,
      });
    } else {
      res.status(404).json({ error: "Address not found" });
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding service error" });
  }
});

// Reverse geocoding - convert address to coordinates
router.post("/coordinates", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=IN`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;

      res.json({
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        formatted_address: data.results[0].formatted_address,
        components: data.results[0].address_components,
      });
    } else {
      res
        .status(404)
        .json({ error: "Coordinates not found for the given address" });
    }
  } catch (error) {
    console.error("Address to coordinates error:", error);
    res.status(500).json({ error: "Geocoding service error" });
  }
});

// Places autocomplete
router.get("/autocomplete", async (req, res) => {
  try {
    const { input, location, radius = 50000 } = req.query;

    if (!input) {
      return res.status(400).json({ error: "Input query is required" });
    }

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=geocode&components=country:in`;

    // Add location bias if provided
    if (location) {
      url += `&location=${location}&radius=${radius}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      res.json({
        predictions: data.predictions.map((prediction) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text,
          types: prediction.types,
        })),
      });
    } else {
      res.json({ predictions: [] });
    }
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({ error: "Autocomplete service error" });
  }
});

// Get place details
router.get("/place/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,geometry,name,address_components`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.result) {
      res.json({
        formatted_address: data.result.formatted_address,
        coordinates: {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        },
        name: data.result.name,
        components: data.result.address_components,
      });
    } else {
      res.status(404).json({ error: "Place not found" });
    }
  } catch (error) {
    console.error("Place details error:", error);
    res.status(500).json({ error: "Place details service error" });
  }
});

// Calculate distance between two points
router.post("/distance", (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (
      !origin ||
      !destination ||
      !origin.lat ||
      !origin.lng ||
      !destination.lat ||
      !destination.lng
    ) {
      return res
        .status(400)
        .json({ error: "Origin and destination coordinates are required" });
    }

    // Haversine formula
    const R = 6371; // Radius of the Earth in km
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    res.json({
      distance: parseFloat(distance.toFixed(2)),
      unit: "km",
    });
  } catch (error) {
    console.error("Distance calculation error:", error);
    res.status(500).json({ error: "Distance calculation error" });
  }
});

module.exports = router;
