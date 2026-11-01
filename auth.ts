import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyTelegramLogin } from "@/lib/telegram-login";
import { saveUserName } from "@/lib/votes";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; name: string; isAdmin: boolean };
  }
}

export function isAdmin(telegramId: string | number) {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .includes(String(telegramId));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/", error: "/" },
  trustHost: true,
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: {},
        first_name: {},
        last_name: {},
        username: {},
        photo_url: {},
        auth_date: {},
        hash: {},
      },
      async authorize(credentials) {
        const login = verifyTelegramLogin(credentials);
        if (!login) return null;
        const name = [login.first_name, login.last_name].filter(Boolean).join(" ");
        await saveUserName(login.id, name);
        return { id: String(login.id), name, image: login.photo_url };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      const id = token.sub ?? "";
      session.user.id = id;
      session.user.name = token.name ?? "";
      session.user.image = token.picture ?? null;
      session.user.isAdmin = isAdmin(id);
      return session;
    },
  },
});
