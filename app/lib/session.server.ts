import { createCookieSessionStorage } from "@remix-run/node";

export const SUCCESS_MESSAGE_KEY = "successMessageKey";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: ["s3cr3t"], // Normally specified using environment variables, but using a fixed value for this sample app
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
