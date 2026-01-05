import { Hono } from "hono";

export const configRoutes = new Hono()
  .get("/", (c) => {
    console.log("Hello");
    return c.json({ success: true as const, message: "Hello world" });
  });
