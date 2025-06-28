import { Hono } from "hono";
import { parseENV } from "./config/env";
import { auth } from "./lib/auth";
import meetingRouter from "./routes/meeting.router";
import { cors } from "hono/cors";
import takesRouter from "./routes/takes.router";
import uploadRouter from "./routes/upload.router";
import { s3Client } from "./config/s3";
parseENV();
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.all("*", (c, next) => {
  console.log(
    `[${c.req.method}]: [${c.req.path}]: [${new Date().toLocaleTimeString()}]`
  );
  return next();
});

app.use(
  "*",
  cors({
    origin: Bun.env.FRONTEND_URL,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.use("*", async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }
    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  } catch (error) {
    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }
});

app.get("/", async (c) => {
  try {
    // const files = await s3Client.list({
    //   prefix:"recordings/"
    // });
    // console.log(files)
    // await s3Client.write("my-file.txt", "Hello Bun!");
    // return c.json(
    //   {
    //     message: "Hello from Hexafalls backend!",
    //   },
    //   200
    // );
    return c.json({ message: "true" }, 200);
  } catch (error) {
    console.error("Error accessing S3:", error);
    return c.json(
      {
        error: "Failed to access S3",
      },
      500
    );
  }
});

app.route("/api/meeting", meetingRouter);
app.route("/api/takes", takesRouter);
app.route("/api/upload", uploadRouter);

export default {
  port: Bun.env.PORT,
  fetch: app.fetch,
};
