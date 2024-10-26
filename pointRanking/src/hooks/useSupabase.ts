import { load } from "ts-dotenv";
import { Database } from "../../database.types";
import { createClient } from "@supabase/supabase-js";

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = load({
  SUPABASE_URL: {
    type: String,
    default: process.env.SUPABASE_URL || '',
  },
  SUPABASE_ANON_KEY: {
    type: String,
    default: process.env.SUPABASE_ANON_KEY || '',
  },
})

export const useSupabase = () => {
  const SUPABASE_URL = env.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URLかSUPABASE_ANON_KEYの環境変数に問題あり!!')
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  return { supabase };
}