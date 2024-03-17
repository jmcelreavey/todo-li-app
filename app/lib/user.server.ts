import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "./db.server";
import { ERROR_MESSAGES } from "../utils";

const SALT_ROUNDS = 10;

export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Please enter at least 4 characters." })
    .max(20, { message: "Please enter at most 20 characters." })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Please enter alphanumeric characters only.",
    }),
  password: z
    .string()
    .min(8, { message: "Please enter at least 8 characters." })
    .max(20, { message: "Please enter at most 20 characters." })
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, {
      message: "Please enter alphanumeric and symbol characters only.",
    }),
});

export async function createUser({
  name,
  password,
}: z.infer<typeof CreateUserSchema>) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "The username is already taken.",
      };
    }
    console.error(error);
    throw Error(ERROR_MESSAGES.unexpected);
  }
}
