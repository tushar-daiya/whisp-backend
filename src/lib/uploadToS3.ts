import { s3Client } from "../config/s3";

export async function uploadToS3(file: Blob, key: string): Promise<void> {
  const s3File = s3Client.file(key);
  try {
    await s3File.write(file, {
      type: file.type,
    });
  } catch (error) {
    console.log("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3: ");
  }
}
