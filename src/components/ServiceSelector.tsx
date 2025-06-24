import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  Wrench,
  Zap,
  Shield,
  Plus,
  Minus,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";

interface Service {
  name: string;
  provider: string;
  price: number;
  rating: number;
  duration: string;
}

interface Category {
  id: string;
  title: string;
  icon: any;
  color: string;
  services: Service[];
}

interface ServiceSelectorProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  onPriceChange: (totalPrice: number) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onServicesChange,
  onPriceChange,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [serviceQuantities, setServiceQuantities] = useState<{
    [key: string]: number;
  }>({});

  const categories: Category[] = [
    {
      id: "home-repair",
      title: "Home Repair",
      icon: Home,
      color: "from-blue-500 to-blue-600",
      services: [
        {
          name: "Plumbing Repair",
          provider: "AquaFix Pro",
          price: 149,
          rating: 4.8,
          duration: "1-2 hours",
        },
        {
          name: "Electrical Work",
          provider: "Spark Masters",
          price: 199,
          rating: 4.9,
          duration: "2-3 hours",
        },
        {
          name: "Appliance Repair",
          provider: "Fix-It Express",
          price: 129,
          rating: 4.7,
          duration: "1-2 hours",
        },
      ],
    },
    {
      id: "cleaning",
      title: "Cleaning",
      icon: Shield,
      color: "from-green-500 to-green-600",
      services: [
        {
          name: "House Cleaning",
          provider: "Spotless Home",
          price: 89,
          rating: 4.9,
          duration: "2-3 hours",
        },
        {
          name: "Deep Cleaning",
          provider: "Deep Clean Pro",
          price: 179,
          rating: 4.8,
          duration: "4-5 hours",
        },
        {
          name: "Carpet Cleaning",
          provider: "FreshCarpet Co",
          price: 119,
          rating: 4.7,
          duration: "2-3 hours",
        },
      ],
    },
    {
      id: "installation",
      title: "Installation",
      icon: Wrench,
      color: "from-purple-500 to-purple-600",
      services: [
        {
          name: "TV Mounting",
          provider: "Mount Masters",
          price: 99,
          rating: 4.8,
          duration: "1 hour",
        },
        {
          name: "Furniture Assembly",
          provider: "Build It Right",
          price: 79,
          rating: 4.7,
          duration: "1-2 hours",
        },
        {
          name: "Smart Home Setup",
          provider: "Tech Install Pro",
          price: 249,
          rating: 4.9,
          duration: "2-3 hours",
        },
      ],
    },
    {
      id: "maintenance",
      title: "Maintenance",
      icon: Zap,
      color: "from-orange-500 to-orange-600",
      services: [
        {
          name: "AC Service",
          provider: "Cool Comfort",
          price: 129,
          rating: 4.8,
          duration: "1-2 hours",
        },
        {
          name: "Geyser Service",
          provider: "Hot Water Pro",
          price: 99,
          rating: 4.7,
          duration: "1 hour",
        },
        {
          name: "Chimney Cleaning",
          provider: "Clean Smoke",
          price: 149,
          rating: 4.6,
          duration: "2 hours",
        },
      ],
    },
  ];

  // Initialize quantities from selected services
  useEffect(() => {
    const quantities: { [key: string]: number } = {};
    selectedServices.forEach((serviceName) => {
      // Extract quantity from service name if it exists (e.g., "House Cleaning (x2)")
      const match = serviceName.match(/^(.+?)\s*\(x(\d+)\)$/);
      if (match) {
        quantities[match[1]] = parseInt(match[2]);
      } else {
        quantities[serviceName] = 1;
      }
    });
    setServiceQuantities(quantities);
  }, [selectedServices]);

  // Calculate total price whenever services or quantities change
  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    onPriceChange(totalPrice);
  }, [serviceQuantities, selectedServices]);

  const getAllServices = () => {
    return categories.flatMap((category) =>
      category.services.map((service) => ({
        ...service,
        categoryId: category.id,
        categoryTitle: category.title,
      })),
    );
  };

  const getServicePrice = (serviceName: string) => {
    const allServices = getAllServices();
    const service = allServices.find((s) => s.name === serviceName);
    return service?.price || 0;
  };

  const calculateTotalPrice = () => {
    return Object.entries(serviceQuantities).reduce(
      (total, [serviceName, quantity]) => {
        const price = getServicePrice(serviceName);
        return total + price * quantity;
      },
      0,
    );
  };

  const isServiceSelected = (serviceName: string) => {
    return serviceQuantities[serviceName] > 0;
  };

  const getServiceQuantity = (serviceName: string) => {
    return serviceQuantities[serviceName] || 0;
  };

  const toggleService = (serviceName: string) => {
    const currentQuantity = serviceQuantities[serviceName] || 0;

    if (currentQuantity > 0) {
      // Remove service
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[serviceName];
      setServiceQuantities(newQuantities);

      // Update selected services
      const newServices = selectedServices.filter((service) => {
        const baseName = service.replace(/\s*\(x\d+\)$/, "");
        return baseName !== serviceName;
      });
      onServicesChange(newServices);
    } else {
      // Add service with quantity 1
      const newQuantities = { ...serviceQuantities, [serviceName]: 1 };
      setServiceQuantities(newQuantities);

      // Update selected services
      const newServices = [
        ...selectedServices.filter((service) => {
          const baseName = service.replace(/\s*\(x\d+\)$/, "");
          return baseName !== serviceName;
        }),
        serviceName,
      ];
      onServicesChange(newServices);
    }
  };

  const updateQuantity = (serviceName: string, change: number) => {
    const currentQuantity = serviceQuantities[serviceName] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      // Remove service
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[serviceName];
      setServiceQuantities(newQuantities);

      const newServices = selectedServices.filter((service) => {
        const baseName = service.replace(/\s*\(x\d+\)$/, "");
        return baseName !== serviceName;
      });
      onServicesChange(newServices);
    } else {
      // Update quantity
      const newQuantities = {
        ...serviceQuantities,
        [serviceName]: newQuantity,
      };
      setServiceQuantities(newQuantities);

      // Update selected services with quantity
      const newServices = selectedServices.filter((service) => {
        const baseName = service.replace(/\s*\(x\d+\)$/, "");
        return baseName !== serviceName;
      });

      const serviceWithQuantity =
        newQuantity > 1 ? `${serviceName} (x${newQuantity})` : serviceName;
      newServices.push(serviceWithQuantity);
      onServicesChange(newServices);
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-lg font-semibold">Select Services</h3>
        <div className="text-sm text-gray-600">
          Total:{" "}
          <span className="font-semibold text-blue-600">
            ${calculateTotalPrice()}
          </span>
        </div>
      </div>

      <div className="space-y-3 pb-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const hasSelectedServices = category.services.some((service) =>
            isServiceSelected(service.name),
          );

          return (
            <Card
              key={category.id}
              className={
                hasSelectedServices ? "border-blue-200 bg-blue-50/30" : ""
              }
            >
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors"
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id,
                  )
                }
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-semibold">
                      {category.title}
                    </span>
                    {hasSelectedServices && (
                      <Badge variant="secondary" className="text-xs">
                        {
                          category.services.filter((s) =>
                            isServiceSelected(s.name),
                          ).length
                        }{" "}
                        selected
                      </Badge>
                    )}
                  </div>
                  <div className="text-gray-400 text-xl font-semibold flex-shrink-0 ml-2">
                    {expandedCategory === category.id ? "−" : "+"}
                  </div>
                </CardTitle>
              </CardHeader>

              {expandedCategory === category.id && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {category.services.map((service) => {
                      const isSelected = isServiceSelected(service.name);
                      const quantity = getServiceQuantity(service.name);

                      return (
                        <div
                          key={service.name}
                          className={`p-4 border rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                          onClick={() => toggleService(service.name)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleService(service.name)
                                }
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-medium text-gray-900">
                                    {service.name}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                    {service.rating}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  by {service.provider}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {service.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />$
                                    {service.price}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(service.name, -1);
                                    }}
                                    className="w-7 h-7 p-0 hover:bg-gray-100"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium text-sm">
                                    {quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(service.name, 1);
                                    }}
                                    className="w-7 h-7 p-0 hover:bg-gray-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="text-sm font-medium text-blue-600 min-w-fit">
                                  ${service.price * quantity}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {Object.keys(serviceQuantities).length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold text-blue-600">
                ${calculateTotalPrice()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceSelector;
