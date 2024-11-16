import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
  
// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_API_KEY as string
);

export { supabase };
