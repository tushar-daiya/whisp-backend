import { Hono } from "hono";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { nanoid } from "nanoid";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
const meetingRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

//route to get all meetings for the user he is hosting
meetingRouter.get("/", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        hostId: user.id,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });
    return c.json({ meetings }, 200);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return c.json({ error: "Failed to fetch meetings" }, 500);
  }
});

//route to get all meetings the user is invited to
meetingRouter.get("/invited", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        guestId: user.id,
      },
    });
    return c.json({ meetings }, 200);
  } catch (error) {
    console.error("Error fetching invited meetings:", error);
    return c.json({ error: "Failed to fetch invited meetings" }, 500);
  }
});

//route to create a new meeting
meetingRouter.post("/create-meeting", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const slug = nanoid(6);
  try {
    const meeting = await prisma.meeting.create({
      data: {
        slug,
        title: "New Meeting",
        hostId: user.id,
      },
    });
    return c.json({ meeting }, 201);
  } catch (error) {
    console.error("Error creating meeting:", error);
    return c.json({ error: "Failed to create meeting" }, 500);
  }
});

//route to update meeting title
meetingRouter.patch(
  "/update-title/:meetingId",
  zValidator("param", z.object({ meetingId: z.string().uuid() })),
  zValidator("json", z.object({ name: z.string().min(1, "Name is required") })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const meetingId = c.req.valid("param").meetingId;
    const name = await c.req.valid("json").name;
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
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: { title: name },
      });
      return c.json({ meeting: updatedMeeting }, 200);
    } catch (error) {
      console.error("Error updating meeting title:", error);
      return c.json({ error: "Failed to update meeting title" }, 500);
    }
  }
);

//route to invite a guest to a meeting
meetingRouter.post(
  "/invite/:meetingId",
  zValidator("param", z.object({ meetingId: z.string().uuid() })),
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const meetingId = c.req.valid("param").meetingId;
    const email = c.req.valid("json").email;
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
      const guest = await prisma.user.findUnique({
        where: { email },
      });
      if (!guest) {
        return c.json({ error: "Guest not found" }, 404);
      }
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          guestId: guest.id,
        },
      });
      return c.json({ meeting: updatedMeeting }, 200);
    } catch (error) {
      console.error("Error inviting guest to meeting:", error);
      return c.json({ error: "Failed to invite guest" }, 500);
    }
  }
);

//route to update recording status of a meeting
meetingRouter.patch(
  "/update-recording-status/:meetingId",
  zValidator("param", z.object({ meetingId: z.string().uuid() })),
  zValidator("json", z.object({ is_recording: z.boolean() })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const meetingId = c.req.valid("param").meetingId;
    const is_recording = c.req.valid("json").is_recording;
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
    } catch (error) {
      console.error(
        "Error fetching meeting for recording status update:",
        error
      );
      return c.json({ error: "Failed to update status" }, 500);
    }
    try {
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          is_recording,
        },
      });
      return c.json({ meeting: updatedMeeting }, 200);
    } catch (error) {
      console.error("Error updating recording status:", error);
      return c.json({ error: "Failed to update recording status" }, 500);
    }
  }
);

//route to get meeting when opening the link and checks if the user is authorized
meetingRouter.get(
  "/slug/:slug",
  zValidator("param", z.object({ slug: z.string().length(6) })),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const slug = c.req.valid("param").slug;
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { slug },
        include: {
          host: true,
          guest: true,
        },
      });
      if (!meeting) {
        return c.json({ error: "Meeting not found" }, 404);
      }
      if (meeting.hostId !== user.id && meeting.guestId !== user.id) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      return c.json({ meeting }, 200);
    } catch (error) {
      console.error("Error fetching meeting by slug:", error);
      return c.json({ error: "Failed to fetch meeting" }, 500);
    }
  }
);

//route to delete a meeting only if the user is the host
meetingRouter.delete(
  "/:meetingId",
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
      await prisma.meeting.delete({
        where: { id: meetingId },
      });
      return c.json({ message: "Meeting deleted successfully" }, 200);
    } catch (error) {
      console.error("Error deleting meeting:", error);
      return c.json({ error: "Failed to delete meeting" }, 500);
    }
  }
);

export default meetingRouter;
