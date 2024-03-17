import bcrypt from "bcrypt";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { z } from "zod";
import { prisma } from "./db.server";
import { sessionStorage } from "./session.server";

export const AUTH_STRATEGY_NAME = "user-path";

interface User {
  id: number;
}

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const name = String(form.get("name"));
    const password = String(form.get("password"));
    const userId = await login({ name, password });

    return {
      id: userId,
    };
  }),
  AUTH_STRATEGY_NAME
);

export const AuthSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Please enter at least 4 characters." })
    .max(20, { message: "Please enter at most 20 characters." })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Please enter alphanumeric characters.",
    }),
  password: z
    .string()
    .min(8, { message: "Please enter at least 8 characters." })
    .max(20, { message: "Please enter at most 20 characters." })
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, {
      message: "Please enter alphanumeric and symbol characters.",
    }),
});

async function login({ name, password }: z.infer<typeof AuthSchema>) {
  const user = await prisma.user.findUnique({
    where: {
      name,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw Error(
      "Login failed. Please check your account name and password again."
    );
  }

  return user.id;
}
