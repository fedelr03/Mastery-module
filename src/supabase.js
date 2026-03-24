import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ldywxoxanulmnjtcmucg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeXd4b3hhbnVsbW5qdGNtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODY3MDUsImV4cCI6MjA4OTk2MjcwNX0.A9L18tI9xEAy66n7kfMu6wSNjWvVNjaq1wcc7j-EVi4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
