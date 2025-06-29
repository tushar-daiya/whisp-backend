import { Hono } from "hono";
import { auth } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { s3Client } from "../config/s3";
import { prisma } from "../lib/prisma";

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
  async (c) => {
    try {
      const { meetingId, takeId, userId, filename } = c.req.valid("param");
      const key = `recordings/${meetingId}/${takeId}/${userId}/${filename}`;
      const presignedUrl = s3Client.presign(key, {
        method: "PUT",
      });
      return c.json({ presignedUrl }, 200);
    } catch (error) {
      return c.json({ error: "Failed to generate presigned URL" }, 500);
    }
  }
);

uploadRouter.post(
  "/upload-finished/:meetingId/:takeId",
  zValidator(
    "param",
    z.object({
      meetingId: z.string().length(6),
      takeId: z.string().uuid(),
    })
  ),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { meetingId, takeId } = c.req.valid("param");
    try {
      const meeting = await prisma.meeting.findUnique({
        where: {
          id: meetingId,
        },
        include: {
          takes: {
            where: {
              id: takeId,
            },
          },
        },
      });
      if (!meeting || meeting.takes.length === 0) {
        return c.json({ error: "Meeting or take not found" }, 404);
      }
      // await processingQueue.add("process-recording", {
      //   meetingId: meeting.id,
      //   takeId: takeId,
      //   userId: user.id,
      // });
      return c.json({ message: "Processing started" }, 200);
    } catch (error) {
      console.error("Error processing recording:", error);
      return c.json({ error: "Failed to process recording" }, 500);
    }
  }
);

export default uploadRouter;
