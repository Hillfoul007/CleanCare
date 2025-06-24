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
  MessageCircle,
  Calendar,
  Package,
} from "lucide-react";
import { WhatsAppOTPService } from "@/services/whatsappOtpService";

interface WhatsAppUserMenuProps {
  user: {
    id: string;
    name: string;
    phone: string;
    isVerified?: boolean;
  };
  onLogout: () => void;
  onViewOrders?: () => void;
}

const WhatsAppUserMenu: React.FC<WhatsAppUserMenuProps> = ({
  user,
  onLogout,
  onViewOrders,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const whatsappService = WhatsAppOTPService.getInstance();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout service
      whatsappService.logout();

      // Call parent logout handler
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format 919876543210 to +91 98765 43210
    if (phone.startsWith("91") && phone.length === 12) {
      return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-green-200 hover:border-green-300"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-100 text-green-700 text-sm font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2 p-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-900 leading-none">
                  {user.name}
                </p>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    WhatsApp Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-mono">
                {formatPhoneNumber(user.phone)}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem
          className="cursor-pointer flex items-center space-x-2 p-3"
          onClick={() => {
            /* Navigate to profile */
          }}
        >
          <User className="h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>

        {onViewOrders && (
          <DropdownMenuItem
            className="cursor-pointer flex items-center space-x-2 p-3"
            onClick={onViewOrders}
          >
            <Package className="h-4 w-4" />
            <span>My Orders</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="cursor-pointer flex items-center space-x-2 p-3"
          onClick={() => {
            /* Navigate to booking history */
          }}
        >
          <Calendar className="h-4 w-4" />
          <span>Booking History</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className="cursor-pointer flex items-center space-x-2 p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <MessageCircle className="h-3 w-3 text-green-600" />
            <span>Powered by WhatsApp & Gupshup</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhatsAppUserMenu;
