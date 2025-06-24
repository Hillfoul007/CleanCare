import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ShoppingCart, Plus, Minus, X, ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";

interface FloatingCartProps {
  onBookServices: () => void;
}

const FloatingCart: React.FC<FloatingCartProps> = ({ onBookServices }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("service_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, []);

  // Listen for cart changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem("service_cart");
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Error loading cart:", error);
        }
      }
    };

    // Custom event listener for cart updates
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
    };
  }, []);

  const updateCart = (newCart: any[]) => {
    setCart(newCart);
    localStorage.setItem("service_cart", JSON.stringify(newCart));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (service: any) => {
    const newCart = cart.map((item) =>
      item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
    updateCart(newCart);
  };

  const removeFromCart = (serviceId: string) => {
    const existingItem = cart.find((item) => item.id === serviceId);

    if (existingItem && existingItem.quantity > 1) {
      const newCart = cart.map((item) =>
        item.id === serviceId ? { ...item, quantity: item.quantity - 1 } : item,
      );
      updateCart(newCart);
    } else {
      const newCart = cart.filter((item) => item.id !== serviceId);
      updateCart(newCart);
    }
  };

  const clearCart = () => {
    updateCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleBookServices = () => {
    setIsOpen(false);
    onBookServices();
  };

  if (cart.length === 0) {
    return null;
  }

  const CartContent = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{item.name}</h4>
              <p className="text-xs text-gray-600 truncate">
                by {item.provider}
              </p>
              <p className="text-sm font-semibold text-blue-600">
                ${item.price} each
              </p>
            </div>

            <div className="flex items-center gap-2 ml-3">
              <div className="flex items-center gap-1 bg-white rounded-lg border">
                <Button
                  onClick={() => removeFromCart(item.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="px-2 text-sm font-medium min-w-[20px] text-center">
                  {item.quantity}
                </span>

                <Button
                  onClick={() => addToCart(item)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Button
                onClick={() => removeFromCart(item.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total ({getTotalItems()} items)</span>
          <span className="font-bold text-lg">${getTotalPrice()}</span>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleBookServices}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            size="lg"
          >
            Book Services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            onClick={clearCart}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  );

  const CartTrigger = () => (
    <Button className="relative bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 w-12 sm:h-14 sm:w-auto sm:px-4 rounded-full sm:rounded-lg">
      <ShoppingCart className="h-5 w-5 sm:mr-2" />
      <span className="hidden sm:inline">Cart</span>

      {getTotalItems() > 0 && (
        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
          {getTotalItems()}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    // Mobile: Use Drawer (bottom sheet)
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <CartTrigger />
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Cart ({getTotalItems()} items)
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <CartContent />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop: Use Sheet (side panel)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <CartTrigger />
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart ({getTotalItems()} items)
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <CartContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FloatingCart;
