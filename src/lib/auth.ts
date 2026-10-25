import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'rohan.patel@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Parameterized SQL query looking up user from PostgreSQL
        const sql = `
          SELECT user_id, full_name, email, password_hash, role
          FROM users
          WHERE LOWER(email) = $1
          LIMIT 1;
        `;

        const result = await query(sql, [normalizedEmail]);
        const user = result.rows[0];

        if (!user) {
          throw new Error('No user found with this email address');
        }

        // Verify password hash with bcryptjs
        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        // Normalize role to uppercase for RBAC comparison
        const role = (user.role || 'customer').toString().toUpperCase();

        return {
          id: user.user_id.toString(),
          name: user.full_name,
          email: user.email,
          role,
          userId: user.user_id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId || token.sub) as string;
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
  secret: process.env.NEXTAUTH_SECRET || 'car-recommendation-dbms-nextauth-super-secret-key-2026',
};
