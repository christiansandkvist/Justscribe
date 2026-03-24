import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

function getRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:8081/auth/callback';
  }
  return 'scribetogo://auth/callback';
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({
        session: data.session,
        user: data.session?.user ?? null,
        initialized: true,
      });
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (e) {
      console.warn('[auth] initialize failed:', e);
      set({ initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ session: data.session, user: data.user });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      set({ session: data.session, user: data.user ?? null });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
        // Web: browser will redirect — loading stays true until redirect
      } else {
        // Native: open OAuth URL in system browser via expo-web-browser
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getRedirectUrl(),
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (data.url) {
          const WebBrowser = require('expo-web-browser');
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            'scribetogo://auth/callback'
          );
          if (result.type === 'success' && result.url) {
            const urlObj = new URL(result.url);
            const accessToken = urlObj.searchParams.get('access_token') ??
              new URLSearchParams(urlObj.hash.slice(1)).get('access_token');
            const refreshToken = urlObj.searchParams.get('refresh_token') ??
              new URLSearchParams(urlObj.hash.slice(1)).get('refresh_token');
            if (accessToken && refreshToken) {
              const { data: sessionData, error: sessionError } =
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              if (sessionError) throw sessionError;
              set({ session: sessionData.session, user: sessionData.user });
            }
          }
        }
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
