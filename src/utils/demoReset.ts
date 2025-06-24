// Utility to reset demo data

export const resetDemoData = () => {
  // Clear all demo-related localStorage items
  const demoKeys = [
    "demo_auth_token",
    "current_user",
    "demo_bookings",
    "demo_instructions_seen",
    "service_cart",
  ];

  demoKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Trigger storage event to update other components
  window.dispatchEvent(new Event("storage"));

  // Reload page to reset state
  window.location.reload();
};

export const getDemoStats = () => {
  const bookings = JSON.parse(localStorage.getItem("demo_bookings") || "[]");
  const currentUser = JSON.parse(
    localStorage.getItem("current_user") || "null",
  );
  const hasToken = localStorage.getItem("demo_auth_token") !== null;

  return {
    isLoggedIn: hasToken,
    userEmail: currentUser?.email || null,
    totalBookings: bookings.length,
    instructionsSeen: localStorage.getItem("demo_instructions_seen") === "true",
  };
};

export default { resetDemoData, getDemoStats };
