import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";
import LaundryIndex from "@/pages/LaundryIndex";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import "./App.css";

function App() {
  // Restore user session on app startup
  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        const authService = DVHostingSmsService.getInstance();
        await authService.restoreSession();
      } catch (error) {
        console.warn("Session restoration failed:", error);
      }
    };

    restoreUserSession();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LaundryIndex />} />
              <Route path="*" element={<LaundryIndex />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
