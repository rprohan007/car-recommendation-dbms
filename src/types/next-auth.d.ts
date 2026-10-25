import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      user_id: string | number;
      userId?: string | number;
      role: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    user_id?: string | number;
    userId?: number;
    role: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string | number;
    user_id?: string | number;
    role?: 'CUSTOMER' | 'ADMIN' | 'DEALER' | 'ANALYST' | string;
  }
}
