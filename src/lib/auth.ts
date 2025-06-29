import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_SECRET_KEY as string,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: ".compilo.xyz",
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://compilo.xyz",
    "https://www.compilo.xyz",
    'https://whisp-me.vercel.app',
    'https://www.whisp-me.vercel.app'
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session | null;
};
