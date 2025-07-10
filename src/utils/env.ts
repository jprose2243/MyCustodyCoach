/**
 * Centralized environment configuration
 * Validates and provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  // Database
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  
  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
  
  // Security
  NEXTAUTH_SECRET?: string;
  ENCRYPTION_KEY?: string;
}

function validateEnv(): EnvironmentConfig {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ] as const;

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  };
}

export const env = validateEnv();

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test'; 