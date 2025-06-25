import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Briefcase,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedAddressForm from "./EnhancedAddressForm";
import UserService from "@/services/userService";

interface SavedAddress {
  id: string;
  label: string;
  type: "home" | "work" | "other";
  flatHouseNo: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
  isDefault?: boolean;
}

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const SavedAddressesModal: React.FC<SavedAddressesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );
  const { toast } = useToast();
  const userService = UserService.getInstance();

  useEffect(() => {
    if (currentUser?.phone) {
      loadSavedAddresses();
    }
  }, [currentUser?.phone]);

  const loadSavedAddresses = () => {
    try {
      const saved = localStorage.getItem(`savedAddresses_${currentUser.phone}`);
      if (saved) {
        setAddresses(JSON.parse(saved));
      } else {
        // Start with no saved addresses - they will be added when user places orders
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error loading saved addresses:", error);
    }
  };

  const saveAddresses = (addressList: SavedAddress[]) => {
    try {
      localStorage.setItem(
        `savedAddresses_${currentUser.phone}`,
        JSON.stringify(addressList),
      );
    } catch (error) {
      console.error("Error saving addresses:", error);
    }
  };

  const handleAddAddress = (addressData: any) => {
    const newAddress: SavedAddress = {
      id: Date.now().toString(),
      label: addressData.label || `Address ${addresses.length + 1}`,
      type: addressData.type || "other",
      flatHouseNo: addressData.flatHouseNo,
      street: addressData.street,
      landmark: addressData.landmark,
      village: addressData.village,
      city: addressData.city,
      pincode: addressData.pincode,
      coordinates: addressData.coordinates,
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    saveAddresses(updatedAddresses);
    setShowAddressForm(false);

    toast({
      title: "Success",
      description: "Address saved successfully",
    });
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleUpdateAddress = (addressData: any) => {
    if (!editingAddress) return;

    const updatedAddress: SavedAddress = {
      ...editingAddress,
      label: addressData.label || editingAddress.label,
      type: addressData.type || editingAddress.type,
      flatHouseNo: addressData.flatHouseNo,
      street: addressData.street,
      landmark: addressData.landmark,
      village: addressData.village,
      city: addressData.city,
      pincode: addressData.pincode,
      coordinates: addressData.coordinates,
    };

    const updatedAddresses = addresses.map((addr) =>
      addr.id === editingAddress.id ? updatedAddress : addr,
    );

    setAddresses(updatedAddresses);
    saveAddresses(updatedAddresses);
    setShowAddressForm(false);
    setEditingAddress(null);

    toast({
      title: "Success",
      description: "Address updated successfully",
    });
  };

  const handleDeleteAddress = (addressId: string) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);
    setAddresses(updatedAddresses);
    saveAddresses(updatedAddresses);

    toast({
      title: "Success",
      description: "Address deleted successfully",
    });
  };

  const handleSetDefault = (addressId: string) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    setAddresses(updatedAddresses);
    saveAddresses(updatedAddresses);

    toast({
      title: "Success",
      description: "Default address updated",
    });
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "work":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getFullAddress = (address: SavedAddress) => {
    return [
      address.flatHouseNo,
      address.street,
      address.landmark,
      address.village,
      address.city,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  if (showAddressForm) {
    return (
      <Dialog open={isOpen} onOpenChange={() => setShowAddressForm(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <EnhancedAddressForm
            onAddressUpdate={
              editingAddress ? handleUpdateAddress : handleAddAddress
            }
            showLabel={true}
            initialData={
              editingAddress
                ? {
                    flatHouseNo: editingAddress.flatHouseNo,
                    street: editingAddress.street,
                    landmark: editingAddress.landmark,
                    village: editingAddress.village,
                    city: editingAddress.city,
                    pincode: editingAddress.pincode,
                    label: editingAddress.label,
                    type: editingAddress.type,
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Saved Addresses
            </span>
            <Button
              onClick={() => setShowAddressForm(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No saved addresses yet</p>
              <Button
                onClick={() => setShowAddressForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            addresses.map((address) => (
              <Card
                key={address.id}
                className={address.isDefault ? "ring-2 ring-green-500" : ""}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getAddressTypeIcon(address.type)}
                        <span className="font-medium text-sm sm:text-base">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {getFullAddress(address)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedAddressesModal;
