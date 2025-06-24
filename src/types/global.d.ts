// Global type definitions

declare global {
  const API_BASE_URL: string;
  const supabase: any;
  const riderHelpers: any;
  const WhatsAppAuth: any;

  interface ExotelResponse {
    success: boolean;
    data?: any;
    error?: string;
  }

  interface User {
    id: string;
    uid: string;
    email: string;
    phone: string;
    full_name: string;
    user_type: "customer" | "provider" | "rider";
    [key: string]: any;
  }
}

export {};
