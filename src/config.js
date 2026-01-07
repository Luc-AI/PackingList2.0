/**
 * Loads and invokes validation for environment variables.
 * Fails loudly if critical configuration is missing.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMsg = 'CRITICAL: Supabase configuration missing. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env';
    console.error(errorMsg);
    // Explicitly alert in browser to satisfy "fail loudly"
    if (typeof window !== 'undefined') {
        alert(errorMsg);
    }
    throw new Error(errorMsg);
}

export const config = {
    supabase: {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY
    }
};
