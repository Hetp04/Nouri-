import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (__DEV__) {
  console.log('Supabase Config Check:');
  console.log('URL loaded:', SUPABASE_URL ? '✅ Yes' : '❌ No');
  console.log('Key loaded:', SUPABASE_ANON_KEY ? '✅ Yes' : '❌ No');
  if (SUPABASE_URL) {
    console.log('URL:', SUPABASE_URL);
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase URL and Anon Key are required!');
  console.error('Please create a .env file in your project root with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  console.error('Then restart your Expo server.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage, // ✅ Persist session to disk so it survives app reloads
  },
  global: {
    headers: {
      'x-client-info': 'nouri-app',
    },
  },
  realtime: {
    timeout: 10000,
  },
});
