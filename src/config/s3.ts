import { S3Client } from "bun";

const s3Client = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  bucket: process.env.S3_BUCKET_NAME!,
  region: "auto",
  virtualHostedStyle: false,
});

export { s3Client };
