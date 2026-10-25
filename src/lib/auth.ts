import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getAppEnv } from '@/lib/env';

const env = getAppEnv();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'rohan.patel@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Strict input presence check
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid email or password');
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Parameterized SQL query: looks up user strictly from PostgreSQL users table
        try {
          const sql = `
            SELECT user_id, full_name, email, password_hash, role
            FROM users
            WHERE LOWER(email) = $1
            LIMIT 1;
          `;

          const result = await query(sql, [normalizedEmail]);
          const user = result.rows[0];

          if (!user || !user.password_hash) {
            // Generic error message to prevent user enumeration
            throw new Error('Invalid email or password');
          }

          // Cryptographic verification against stored bcrypt hash ONLY
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Normalize role strictly to uppercase
          const role = (user.role || 'customer').toString().toUpperCase();

          return {
            id: user.user_id.toString(),
            user_id: user.user_id,
            userId: user.user_id,
            name: user.full_name,
            email: user.email,
            role,
          };
        } catch (dbError: any) {
          // If error is already our generic invalid credentials error, rethrow it
          if (dbError.message === 'Invalid email or password') {
            throw dbError;
          }
          // Security: Fail closed on database outage or connection error. Never bypass auth.
          console.error('[SECURITY AUDIT] Authentication database query failed:', dbError?.message);
          throw new Error('Authentication service temporarily unavailable. Please verify database connectivity.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.user_id = user.user_id ?? user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.user_id || token.userId || token.sub) as string;
        session.user.user_id = (token.user_id || token.userId || token.sub) as string;
        session.user.userId = (token.userId || token.user_id) as number;
        session.user.role = (token.role as string) || 'CUSTOMER';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  secret: env.NEXTAUTH_SECRET,
};
