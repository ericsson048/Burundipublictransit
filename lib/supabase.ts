import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type BusLine = {
  id: string;
  name: string;
  city_id: string;
  zones_covered: string[];
  route_coordinates: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  stops: Array<{
    name: string;
    coordinates: [number, number];
  }>;
  color: string;
  active: boolean;
  created_at: string;
};

export type City = {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  created_at: string;
};

export type TransportAgency = {
  id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  logo_url?: string;
  active: boolean;
  created_at: string;
};

export type IntercityRoute = {
  id: string;
  agency_id: string;
  departure_city_id: string;
  arrival_city_id: string;
  route_coordinates: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  departure_point: string;
  arrival_point: string;
  frequency: string;
  duration_minutes?: number;
  price?: number;
  schedule: string[];
  active: boolean;
  created_at: string;
};
