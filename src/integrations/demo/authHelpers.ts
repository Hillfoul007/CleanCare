// Demo authentication helpers that simulate real auth without backend calls

export const demoAuthHelpers = {
  // Check if user is logged in (demo mode)
  isLoggedIn: (): boolean => {
    return localStorage.getItem("demo_auth_token") !== null;
  },

  // Get current user from localStorage (demo mode)
  getCurrentUser: (): any | null => {
    const userStr = localStorage.getItem("current_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Clear auth data (demo logout)
  clearAuthData: (): void => {
    localStorage.removeItem("demo_auth_token");
    localStorage.removeItem("current_user");

    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event("storage"));
  },

  // Demo sign in
  signIn: async (email: string, password: string) => {
    // Demo users database
    const demoUsers = [
      {
        id: "demo-user-1",
        email: "demo@user.com",
        password: process.env.DEMO_PASSWORD || "demouser",
        name: "Demo User",
        full_name: "Demo User",
        phone: "+1234567890",
        userType: "customer",
      },
      {
        id: "demo-user-2",
        email: "test@test.com",
        password: process.env.DEMO_PASSWORD || "testuser",
        name: "Test User",
        full_name: "Test User",
        phone: "+1987654321",
        userType: "customer",
      },
      {
        id: "demo-pro-1",
        email: "pro@demo.com",
        password: process.env.DEMO_PASSWORD || "demopro",
        name: "Demo Pro",
        full_name: "Demo Pro",
        phone: "+1555666777",
        userType: "provider",
      },
    ];

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = demoUsers.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      return {
        data: null,
        error: { message: "Invalid email or password" },
      };
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      data: {
        user: userWithoutPassword,
        session: {
          access_token: "demo-token-" + Date.now(),
        },
      },
      error: null,
    };
  },

  // Demo sign up
  signUp: async (
    email: string,
    password: string,
    name: string,
    phone: string,
    userType: string = "customer",
  ) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if user already exists (in real app, this would be a server check)
    const existingUsers = ["demo@user.com", "test@test.com", "pro@demo.com"];

    if (existingUsers.includes(email)) {
      return {
        data: null,
        error: { message: "User already exists with this email" },
      };
    }

    const newUser = {
      id: "demo-user-" + Date.now(),
      email,
      name,
      full_name: name,
      phone,
      userType,
    };

    return {
      data: {
        user: newUser,
        session: {
          access_token: "demo-token-" + Date.now(),
        },
      },
      error: null,
    };
  },

  // Demo check if user exists
  checkIfUserExists: async (email: string, phone: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const existingEmails = ["demo@user.com", "test@test.com", "pro@demo.com"];
    const existingPhones = ["+1234567890", "+1987654321", "+1555666777"];

    return {
      emailExists: existingEmails.includes(email),
      phoneExists: existingPhones.includes(phone),
    };
  },

  // Demo password reset
  resetPassword: async (email: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const existingEmails = ["demo@user.com", "test@test.com", "pro@demo.com"];

    if (!existingEmails.includes(email)) {
      return {
        data: null,
        error: { message: "No user found with this email address" },
      };
    }

    return {
      data: { message: "Password reset email sent (demo mode)" },
      error: null,
    };
  },

  // Demo update password
  updatePassword: async (userId: string, newPassword: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In demo mode, just return success
    return {
      data: { message: "Password updated successfully (demo mode)" },
      error: null,
    };
  },
};

export default demoAuthHelpers;
