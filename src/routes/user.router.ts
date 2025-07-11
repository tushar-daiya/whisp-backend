import { Hono } from "hono";
import { auth } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const userRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

userRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      search: z.string(),
    })
  ),
  async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!session || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { search } = c.req.valid("query");
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
          NOT: {
            id: user.id,
          },
        },
      });
      return c.json({ users }, 200);
    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "Failed to fetch users" }, 500);
    }
  }
);

export default userRouter;
