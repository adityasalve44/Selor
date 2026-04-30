'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { Session } from '@supabase/supabase-js';
import type { CurrentUser } from '@/types/domain';

interface AuthContextValue {
  user: CurrentUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}, 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    window.location.href = '/api/auth/login?next=/dashboard';
  };

  const signOut = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
