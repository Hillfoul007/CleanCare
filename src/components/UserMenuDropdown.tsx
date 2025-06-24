import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Phone,
  LogOut,
  Package,
  Settings,
  MapPin,
  ChevronDown,
} from "lucide-react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import SavedAddressesModal from "./SavedAddressesModal";
import PreferencesModal from "./PreferencesModal";

interface UserMenuDropdownProps {
  currentUser: any;
  onLogout: () => void;
  onViewBookings: () => void;
  onUpdateProfile?: (updatedUser: any) => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  currentUser,
  onLogout,
  onViewBookings,
  onUpdateProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith("91") && phone.length === 12) {
      const number = phone.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phone;
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto p-2 hover:bg-green-50"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {getInitials(currentUser.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-medium text-gray-900">
                {currentUser.name || "User"}
              </span>
              <span className="text-xs text-gray-500">
                {formatPhone(currentUser.phone)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-600 text-white text-sm">
                    {getInitials(currentUser.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPhone(currentUser.phone)}
                  </p>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onViewBookings();
            }}
            className="cursor-pointer"
          >
            <Package className="mr-2 h-4 w-4" />
            <span>My Bookings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              setShowProfileModal(true);
            }}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              setShowAddressesModal(true);
            }}
            className="cursor-pointer"
          >
            <MapPin className="mr-2 h-4 w-4" />
            <span>Saved Addresses</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              setShowPreferencesModal(true);
            }}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUpdateProfile={(updatedUser) => {
          if (onUpdateProfile) {
            onUpdateProfile(updatedUser);
          }
          setShowProfileModal(false);
        }}
      />

      <SavedAddressesModal
        isOpen={showAddressesModal}
        onClose={() => setShowAddressesModal(false)}
        currentUser={currentUser}
      />

      <PreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        currentUser={currentUser}
      />
    </>
  );
};

export default UserMenuDropdown;
