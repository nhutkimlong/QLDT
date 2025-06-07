
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types'; 

// Actual Supabase credentials provided by the user
const supabaseUrl = "https://ascpqcefjenadgoltdjg.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY3BxY2VmamVuYWRnb2x0ZGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkxMTQsImV4cCI6MjA2NDcxNTExNH0.-NqqwJunpP0Q6KTH1w3V3dOC-lzPFURpd_9wslDrWmo"; 

// Initialize the Supabase client directly with the provided credentials.
// No placeholder checks are performed in this version of the file.
// The error "Please replace the placeholder values..." should not originate from this file
// if this version is correctly loaded and executed.
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey
);
