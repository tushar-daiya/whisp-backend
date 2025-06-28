import { Hono } from "hono";
import { auth } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uploadToS3 } from "../lib/uploadToS3";
import { s3Client } from "../config/s3";

const uploadRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

uploadRouter.post(
  "/:meetingId/:takeId/:userId/:filename",
  zValidator(
    "param",
    z.object({
      meetingId: z.string(),
      takeId: z.string(),
      userId: z.string(),
      filename: z.string(),
    })
  ),
  // zValidator(
  //   "form",
  //   z.object({
  //     chunk: z.instanceof(Blob).refine((blob) => blob.size > 0, {
  //       message: "Chunk must not be empty",
  //     }),
  //   })
  // ),
  async (c) => {
    const {meetingId, takeId, userId, filename} = c.req.valid("param");
    const key = `recordings/${meetingId}/${takeId}/${userId}/${filename}`;
    const presignedUrl = s3Client.presign(key,{
      method: "PUT",
    })
    return c.json({ presignedUrl }, 200);
    // const session = c.get("session");
    // const user = c.get("user");
    // if (!session || !user) {
    //   return c.json({ error: "Unauthorized" }, 401);
    // }
    // const { meetingId, takeId, userId, filename } = c.req.valid("param");
    // const chunk = c.req.valid("form").chunk;
    // try {
    //   const key = `recordings/${meetingId}/${takeId}/${userId}/${filename}`;
    //   await uploadToS3(chunk, key);
    //   return c.json({ message: "Chunk uploaded successfully" }, 200);
    // } catch (error) {
    //   console.error("Error uploading chunk:", error);
    //   return c.json({ error: "Failed to upload chunk" }, 500);
    // }
    return c.json({ message: "done" }, 200);
  }
);

export default uploadRouter;
