import NextAuth, { type AuthOptions, SessionStrategy, User, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 