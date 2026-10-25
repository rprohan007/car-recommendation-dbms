/**
 * Environment Configuration & Validation
 * Ensures required server-side secrets and connection strings are defined.
 * Never exposes secrets to browser-side code.
 */

export interface AppEnv {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  OPENAI_API_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function getEnvVar(key: string, required = false, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `[SECURITY ERROR] Missing required environment variable: "${key}". ` +
      `Please configure it in your .env.local file. Generate a secret using: openssl rand -base64 32`
    );
  }
  return value || '';
}

/**
 * Validates and retrieves server-side environment configuration.
 * Fails closed if critical authentication or database secrets are missing.
 */
export function getAppEnv(): AppEnv {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = process.env.NEXTAUTH_SECRET;

  if (isProd && (!secret || secret.length < 32)) {
    throw new Error(
      `[SECURITY ERROR] In production, NEXTAUTH_SECRET must be set to a cryptographically strong string of at least 32 characters.`
    );
  }

  return {
    DATABASE_URL: getEnvVar('DATABASE_URL', false, 'postgresql://postgres:postgres@localhost:5432/cardb'),
    NEXTAUTH_SECRET: getEnvVar(
      'NEXTAUTH_SECRET',
      isProd, // strictly required in production
      'local-dev-only-secret-key-replace-in-production-min-32-chars'
    ),
    NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', false, 'http://localhost:3000'),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  };
}
