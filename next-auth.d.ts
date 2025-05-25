import 'next-auth';
import 'next-auth/jwt';
import NextAuth, { DefaultSession } from "next-auth"

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Добавляем id пользователя в сессию, если его нет по умолчанию
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean; // Добавляем isAdmin к типу Session.user
    } & DefaultSession['user']
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    isAdmin: boolean; // Добавляем isAdmin к типу User
  }
}

declare module 'next-auth/jwt' {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   */
  interface JWT {
    id?: string; // Добавляем id пользователя в токен
    isAdmin: boolean; // Добавляем isAdmin к типу JWT
  }
} 