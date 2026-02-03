import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '@ai-data-assistant/shared';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try project root first, then backend folder
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');

// Try root first
let result = dotenv.config({ path: rootEnvPath });
let loadedFrom = rootEnvPath;

// If root failed, try backend folder
if (result.error || !process.env.SUPABASE_URL) {
  result = dotenv.config({ path: backendEnvPath });
  loadedFrom = backendEnvPath;
}

console.log(`📄 .env loaded from: ${loadedFrom}`);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Debug logging (masked for security)
console.log('🔧 Supabase Config:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`   Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NOT SET'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables in backend/.env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const databaseConfig: DatabaseConfig = {
  url: supabaseUrl,
  key: supabaseServiceKey,
  schema: 'public'
};