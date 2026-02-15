import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  image_url: string;
  seller_name: string;
  seller_phone: string;
  owner_id: string | null;
  created_at: string;
}
