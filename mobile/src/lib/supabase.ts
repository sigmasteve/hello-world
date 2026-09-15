import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Expo inlines EXPO_PUBLIC_* env vars into the JS bundle at build time (see
// .env.example) — there's no server involved, so this is the same
// publishable key a web app would ship to the browser. It's safe to
// expose because every table it can reach is behind Row Level Security
// (see supabase/migrations/0001_challenges_schema.sql); it grants no
// access on its own. Supabase calls this the "publishable" key now
// (`sb_publishable_...`) — projects created before ~Nov 2025 may still
// show it as the "anon" key in their dashboard (an older, JWT-shaped
// value); createClient() accepts either, this project just standardizes
// on the current name.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

// null until a project is wired up — every caller in src/auth and
// src/challenges checks isSupabaseConfigured (or gets a thrown error from
// requireClient()) and falls back to mock data instead of crashing, the
// same pattern src/health uses for a native module that isn't linked.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
