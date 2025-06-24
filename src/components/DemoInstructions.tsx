import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, User, Mail, Lock, X } from "lucide-react";

interface DemoInstructionsProps {
  onClose?: () => void;
}

const DemoInstructions: React.FC<DemoInstructionsProps> = ({ onClose }) => {
  const handleClose = () => {
    // Mark that user has seen the instructions
    localStorage.setItem("demo_instructions_seen", "true");
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-blue-600">
            <Info className="w-6 h-6" />
            Demo Mode Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium mb-2">
              Welcome to the Demo!
            </p>
            <p className="text-blue-700 text-sm">
              This is a fully functional demo of HomeServices Pro. No real
              payments will be processed.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              Demo Login Credentials:
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Mail className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">demo@user.com</div>
                  <div className="text-xs text-gray-600">
                    Regular user account
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Lock className="w-4 h-4 text-gray-500" />
                <div className="text-sm font-medium">demo123</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Mail className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">test@test.com</div>
                  <div className="text-xs text-gray-600">
                    Alternative test account
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Lock className="w-4 h-4 text-gray-500" />
                <div className="text-sm font-medium">test123</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ You can also create a new demo account with any email and
              password!
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">What you can try:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Browse service categories</li>
              <li>• Book demo services</li>
              <li>• View booking history</li>
              <li>• Manage your account</li>
            </ul>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Got it! Start Demo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoInstructions;
