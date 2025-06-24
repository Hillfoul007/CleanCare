// Supabase client stub - this is a mock implementation
// Replace with actual Supabase configuration when needed

console.warn(
  "⚠️ Using mock Supabase client. Configure Supabase for production.",
);

export const supabase = {
  auth: {
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: {} } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => ({
        data: { path },
        error: null,
      }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://mock-url.com/${path}` },
      }),
    }),
  },
};

export default supabase;
