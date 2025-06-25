import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { createInfoNotification } from "@/utils/notificationUtils";
import { User, History, LogOut, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  isLoggedIn: boolean;
  userEmail: string;
  currentUser?: any;
  onLogin: () => void;
  onLogout: () => void;
  onViewBookings: () => void;
  className?: string;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  isLoggedIn,
  userEmail,
  currentUser,
  onLogin,
  onLogout,
  onViewBookings,
  className = "",
}) => {
  const { addNotification } = useNotifications();

  const handleAccountSettings = () => {
    addNotification(
      createInfoNotification(
        "Account Settings",
        "Change Password, Update Profile, Notification Preferences, Privacy Settings, and Payment Methods - Coming soon!",
      ),
    );
  };

  if (!isLoggedIn) {
    return (
      <Button
        onClick={onLogin}
        className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${className}`}
      >
        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        <span className="text-white font-medium text-xs sm:text-sm lg:text-base">
          Sign In
        </span>
      </Button>
    );
  }

  // Get user's full name from different possible sources
  const getUserDisplayName = () => {
    if (currentUser?.name && currentUser.name.trim()) return currentUser.name;
    if (currentUser?.full_name) return currentUser.full_name;
    if (currentUser?.profile?.full_name) return currentUser.profile.full_name;
    if (currentUser?.displayName) return currentUser.displayName;
    if (userEmail) return userEmail.split("@")[0];
    if (currentUser?.phone) return `+91 ${currentUser.phone}`;
    return "User";
  };

  const userName = getUserDisplayName();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${className}`}
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          <span className="text-white font-medium text-xs sm:text-sm hidden sm:inline max-w-20 lg:max-w-none truncate">
            {userName}
          </span>
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white shadow-xl border border-gray-200 rounded-xl"
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-sm text-gray-600 truncate">{userEmail}</p>
          {currentUser?.phone && (
            <p className="text-xs text-gray-500">{currentUser.phone}</p>
          )}
        </div>

        <DropdownMenuItem
          onClick={onViewBookings}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-600" />
          <span className="text-gray-700">My Bookings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAccountSettings}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 cursor-pointer text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
