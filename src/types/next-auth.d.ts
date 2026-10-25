import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
    userId?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string | number;
    role?: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
  }
}
