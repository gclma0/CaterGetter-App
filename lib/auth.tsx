import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    phone: string,
    vendorDetails?: { businessName: string; cuisineTypes: string[]; categories: string[] }
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Build a Profile object from Supabase user_metadata (always up-to-date) */
function profileFromMeta(user: User): Profile {
  const m = user.user_metadata ?? {};
  return {
    id: user.id,
    full_name: m.full_name ?? null,
    phone: m.phone ?? null,
    avatar_url: m.avatar_url ?? null,
    role: (m.role as UserRole) ?? 'customer',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]     = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app start: restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use metadata immediately (no DB round-trip delay)
        setProfile(profileFromMeta(session.user));
        // Then sync from DB in the background (picks up any manual edits)
        syncProfileFromDB(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Always set metadata first so UI is instantly responsive
        setProfile((prev) => prev ?? profileFromMeta(session.user!));
        syncProfileFromDB(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Sync profile from the DB (profiles table).
   * If the DB row has richer data (e.g. updated name later), this wins.
   * If the DB row doesn't exist yet (trigger hasn't fired), we keep metadata.
   */
  const syncProfileFromDB = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        // Merge: DB wins for fields that are actually set
        setProfile({
          id: data.id,
          full_name: data.full_name ?? null,
          phone: data.phone ?? null,
          avatar_url: data.avatar_url ?? null,
          role: (data.role as UserRole) ?? 'customer',
        });
      }
      // If no DB row yet, keep the metadata-based profile — don't overwrite with null
    } catch (_) {
      // Network error etc. — keep existing profile
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await syncProfileFromDB(user.id);
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // Set profile from metadata immediately; syncProfileFromDB will follow
    if (data.user) setProfile(profileFromMeta(data.user));
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    phone: string,
    vendorDetails?: { businessName: string; cuisineTypes: string[]; categories: string[] }
  ): Promise<{ error: string | null }> => {
    // Pass ALL data in options.data → stored in user_metadata immediately
    // Also read by the DB trigger to create the profiles row
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
          business_name: vendorDetails?.businessName ?? null,
          cuisine_types: vendorDetails?.cuisineTypes ?? [],
          categories: vendorDetails?.categories ?? [],
        },
      },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Registration failed. Please try again.' };

    // Set profile from metadata — works instantly, no DB round-trip needed
    const newProfile: Profile = {
      id: data.user.id,
      full_name: fullName,
      phone,
      avatar_url: null,
      role,
    };
    setProfile(newProfile);

    return { error: null };
  };

  const signOut = async () => {
    setProfile(null);
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, role: profile?.role ?? null, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
