import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  // S3_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  FRONTEND_URL: z.string().url(),
  CLOUDFLARE_R2_ENDPOINT: z.string(),
});

export async function parseENV() {
  try {
    await envSchema.parseAsync(Bun.env);
  } catch (error) {
    console.log("Error parsing environment variables:", error);
    process.exit(1);
  }
}

declare module "bun" {
  interface Env extends z.infer<typeof envSchema> {}
}
