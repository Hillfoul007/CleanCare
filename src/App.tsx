import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";
import LaundryIndex from "@/pages/LaundryIndex";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./App.css";

function App() {
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
