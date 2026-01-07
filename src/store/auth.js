import { supabase } from '../lib/supabase.js';

class AuthStore {
    constructor() {
        this.state = {
            user: null,
            session: null,
            loading: true,
            error: null
        };
        this.listeners = new Set();
        this.init();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state); // Initial emission
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    async init() {
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            this.state.session = session;
            this.state.user = session?.user || null;
        } catch (err) {
            console.error('Auth Init Error:', err);
            this.state.error = err.message;
        } finally {
            this.state.loading = false;
            this.notify();
        }

        // Listen for changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[Auth] State Change: ${event}`, session?.user?.email);
            this.state.session = session;
            this.state.user = session?.user || null;
            this.state.loading = false;
            this.state.error = null;
            this.notify();
        });
    }

    async signIn(email, password) {
        this.state.loading = true;
        this.state.error = null;
        this.notify();

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            this.state.error = error.message;
            this.state.loading = false;
            this.notify();
            throw error;
        }
    }

    async signUp(email, password) {
        this.state.loading = true;
        this.state.error = null;
        this.notify();

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            this.state.error = error.message;
            this.state.loading = false;
            this.notify();
            throw error;
        }
    }

    async signOut() {
        this.state.loading = true;
        this.notify();
        const { error } = await supabase.auth.signOut();
        if (error) {
            this.state.error = error.message;
            this.state.loading = false;
            this.notify();
        }
    }
}

export const authStore = new AuthStore();
