import { Hono } from "hono";
import { auth } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const takesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

//creates a new take when recording starts
takesRouter.post(
  "/create/:meetingId",
  zValidator("param", z.object({ meetingId: z.string().uuid() })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const meetingId = c.req.valid("param").meetingId;
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });
      if (!meeting) {
        return c.json({ error: "Meeting not found" }, 404);
      }
      if (meeting.hostId !== user.id) {
        return c.json({ error: "Unauthorized" }, 403);
      }
      const takeCount = await prisma.take.count({
        where: { meetingId: meeting.id },
      });
      const take = await prisma.take.create({
        data: {
          meetingId: meeting.id,
          number: takeCount + 1,
        },
      });
      return c.json({ take: take.number }, 201);
    } catch (error) {
      console.error("Error creating take:", error);
      return c.json({ error: "Failed to create take" }, 500);
    }
  }
);

//route to get all takes for a specific meeting
takesRouter.get(
  "/meetings/:meetingId",
  zValidator("param", z.object({ meetingId: z.string().uuid() })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const meetingId = c.req.valid("param").meetingId;
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });
      if (!meeting) {
        return c.json({ error: "Meeting not found" }, 404);
      }
      if (meeting.hostId !== user.id) {
        return c.json({ error: "Unauthorized" }, 403);
      }
      const takes = await prisma.take.findMany({
        where: { meetingId: meeting.id },
        orderBy: { number: "asc" },
      });
      return c.json({ takes }, 200);
    } catch (error) {
      console.error("Error fetching takes:", error);
      return c.json({ error: "Failed to fetch takes" }, 500);
    }
  }
);

export default takesRouter;
