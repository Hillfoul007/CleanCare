import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simplified component to prevent build errors
const RiderSystemTester: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Rider System Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Rider system testing tools are being updated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderSystemTester;
