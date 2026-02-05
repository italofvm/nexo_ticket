import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { JWT } from "next-auth/jwt";

interface ExtendedToken extends JWT {
  accessToken?: string;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accessToken?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as ExtendedUser;
        user.id = token.sub;
        user.accessToken = (token as ExtendedToken).accessToken;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        (token as ExtendedToken).accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
