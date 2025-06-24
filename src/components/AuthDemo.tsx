import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Tablet, Phone, Mail, Info } from "lucide-react";
import { deviceDetection, DeviceInfo } from "@/utils/deviceDetection";

interface AuthDemoProps {
  isVisible?: boolean;
}

const AuthDemo: React.FC<AuthDemoProps> = ({ isVisible = true }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const info = deviceDetection.getDeviceInfo();
    setDeviceInfo(info);
  }, []);

  if (!isVisible || !deviceInfo) return null;

  const getDeviceIcon = () => {
    if (deviceInfo.isMobile) return Smartphone;
    if (deviceInfo.isTablet) return Tablet;
    return Monitor;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 border-blue-200 bg-blue-50/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            Authentication Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <DeviceIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium">
              Device: {deviceInfo.deviceType}
            </span>
            <Badge variant="outline" className="text-xs">
              {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-blue-800">
              Recommended Auth:
            </div>

            {deviceInfo.preferredAuthMethod === "missedcall" && (
              <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                <Phone className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700">
                  Missed Call (Mobile)
                </span>
              </div>
            )}

            {deviceInfo.preferredAuthMethod === "email" && (
              <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                <Mail className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-700">Email OTP (Web)</span>
              </div>
            )}

            {deviceInfo.preferredAuthMethod === "both" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                  <Phone className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700">Missed Call</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-700">Email OTP</span>
                </div>
              </div>
            )}
          </div>

          {window.location.hostname === "localhost" && (
            <div className="p-2 bg-yellow-100 rounded border">
              <div className="text-xs font-medium text-yellow-800 mb-1">
                Demo Mode:
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>📞 Missed Call: Click "I Received the Call"</div>
                <div>
                  📧 Email OTP: Use code <strong>123456</strong>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-600">
            The system automatically detects your device and shows the most
            suitable authentication method.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDemo;
