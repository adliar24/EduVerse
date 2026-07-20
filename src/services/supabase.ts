import { supabase as client } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const supabase = client;

export const getSupabaseClient = (): SupabaseClient => {
  return supabase;
};

export const getSupabaseClientOrNull = (): SupabaseClient | null => {
  return supabase;
};
