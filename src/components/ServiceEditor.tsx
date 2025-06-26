import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  Trash2,
  Package,
  ShirtIcon as Shirt,
  Sparkles,
  Zap,
} from "lucide-react";

interface ServiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface ServiceEditorProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  onPriceChange: (totalPrice: number) => void;
  mode: "edit" | "add-services";
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({
  selectedServices,
  onServicesChange,
  onPriceChange,
  mode,
}) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  // Laundry services that users can add
  const availableServices = [
    { name: "Shirt/T-Shirt", price: 25 },
    { name: "Trouser/Pant", price: 30 },
    { name: "Kurta", price: 35 },
    { name: "Saree", price: 45 },
    { name: "Dress", price: 40 },
    { name: "Blazer/Suit", price: 80 },
    { name: "Jeans", price: 35 },
    { name: "Bedsheet", price: 50 },
    { name: "Towel", price: 20 },
    { name: "Laundry and Fold", price: 70 },
    { name: "Dry Cleaning", price: 100 },
    { name: "Iron Only", price: 15 },
  ];

  // Parse selected services into ServiceItem format
  useEffect(() => {
    const parsedServices = selectedServices.map((service, index) => {
      // Handle both string and object formats
      if (typeof service === "object" && service !== null) {
        // Service is already an object with name, quantity, price
        return {
          name: service.name || service.service || "Unknown Service",
          quantity: service.quantity || 1,
          price: service.price || 35,
        };
      }

      // Handle string format
      const serviceStr = String(service);
      const match = serviceStr.match(/^(.+?)(?:\s*\(x(\d+)\))?$/);
      if (match) {
        const name = match[1].trim();
        const quantity = parseInt(match[2] || "1");
        const availableService = availableServices.find((s) => s.name === name);
        return {
          name,
          quantity,
          price: availableService?.price || 35, // Default price
        };
      }
      return {
        name: serviceStr,
        quantity: 1,
        price: 35,
      };
    });
    setServices(parsedServices);
  }, [selectedServices]);

  // Update parent when services change
  useEffect(() => {
    const serviceStrings = services.map((service) => ({
      name: service.name,
      quantity: service.quantity,
      price: service.price,
    }));
    onServicesChange(serviceStrings);

    const totalPrice = services.reduce(
      (total, service) => total + service.price * service.quantity,
      0,
    );
    onPriceChange(totalPrice);
  }, [services, onServicesChange, onPriceChange]);

  const updateServiceQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeService(index);
      return;
    }

    const updatedServices = [...services];
    updatedServices[index].quantity = newQuantity;
    setServices(updatedServices);
  };

  const removeService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
  };

  const addAvailableService = (serviceName: string, price: number) => {
    const existingIndex = services.findIndex((s) => s.name === serviceName);

    if (existingIndex >= 0) {
      // Increase quantity if already exists
      updateServiceQuantity(
        existingIndex,
        services[existingIndex].quantity + 1,
      );
    } else {
      // Add new service
      const newService = { name: serviceName, quantity: 1, price };
      setServices([...services, newService]);
    }
  };

  const addCustomService = () => {
    if (!newServiceName.trim()) return;

    const price = parseFloat(newServicePrice) || 35;
    const newService = { name: newServiceName.trim(), quantity: 1, price };
    setServices([...services, newService]);
    setNewServiceName("");
    setNewServicePrice("");
  };

  return (
    <div className="space-y-6">
      {/* Current Services */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Current Services
        </h3>

        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No services selected</p>
            <p className="text-sm">Add services from the options below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service, index) => (
              <Card key={index} className="border-blue-100 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {service.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ₹{service.price} per item
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateServiceQuantity(index, service.quantity - 1)
                          }
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {service.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateServiceQuantity(index, service.quantity + 1)
                          }
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          ₹{service.price * service.quantity}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeService(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Services Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Services
        </h3>

        {/* Available Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {availableServices.map((service) => {
            const isSelected = services.some((s) => s.name === service.name);

            return (
              <Card
                key={service.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                }`}
                onClick={() => addAvailableService(service.name, service.price)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{service.name}</h4>
                      <p className="text-xs text-gray-600">₹{service.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Added
                        </Badge>
                      )}
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Service */}
        <Card className="border-dashed border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Custom Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="service-name" className="text-sm">
                  Service Name
                </Label>
                <Input
                  id="service-name"
                  placeholder="e.g., Special Cleaning"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="service-price" className="text-sm">
                  Price (₹)
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  placeholder="35"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addCustomService}
              disabled={!newServiceName.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Service
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Total */}
      {services.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-green-600">
                ₹
                {services.reduce(
                  (total, service) => total + service.price * service.quantity,
                  0,
                )}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {services.reduce((total, service) => total + service.quantity, 0)}{" "}
              items total
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceEditor;
