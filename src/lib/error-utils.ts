// Utility functions for better error handling

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    // Handle Supabase error format
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    // Handle other error objects
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }

    // Try to stringify if it's a complex object
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error object";
    }
  }

  return "Unknown error occurred";
};

export const logError = (context: string, error: unknown): void => {
  const errorMessage = getErrorMessage(error);
  console.error(`[${context}]`, errorMessage);

  // In development, also log the full error object for debugging
  if (import.meta.env.DEV) {
    console.error("Full error object:", error);
  }
};

export const createErrorHandler = (context: string) => {
  return (error: unknown) => {
    logError(context, error);
    return getErrorMessage(error);
  };
};

// Common error messages
export const ErrorMessages = {
  NETWORK_ERROR:
    "Network connection failed. Please check your internet connection.",
  PERMISSION_DENIED: "Permission denied. Please check your access rights.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  DATABASE_ERROR: "Database operation failed. Please try again later.",
  AUTHENTICATION_ERROR: "Authentication failed. Please sign in again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
} as const;

// Helper to check if error indicates missing table/relation
export const isMissingTableError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("table")
  );
};

// Helper to check if error is a network/connection issue
export const isNetworkError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
};
