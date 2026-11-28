import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { client, database, ensureIndexes } from "./db";
import { registrationSchema, loginSchema } from "./validation";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-")) {
    throw new Error("Set a random BETTER_AUTH_SECRET of at least 32 characters.");
  }
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is required.");
  }
  const ipHeader = process.env.VERCEL === "1" ? "x-forwarded-for" : process.env.AUTH_IP_HEADER;
  if (process.env.NODE_ENV === "production" && !ipHeader) {
    throw new Error("AUTH_IP_HEADER is required outside Vercel in production.");
  }

  return betterAuth({
    appName: "Campus Desk",
    baseURL,
    secret,
    database: mongodbAdapter(database(), { client: client() }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: {
          type: ["student", "staff"],
          required: true,
          defaultValue: "student",
          input: false,
        },
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    trustedOrigins: [new URL(baseURL).origin],
    advanced: {
      ipAddress: {
        ipAddressHeaders: ipHeader ? [ipHeader] : [],
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: new URL(baseURL).protocol === "https:",
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        const schema =
          context.path === "/sign-up/email"
            ? registrationSchema
            : context.path === "/sign-in/email"
              ? loginSchema
              : null;
        if (schema) {
          const parsed = schema.safeParse(context.body);
          if (!parsed.success)
            throw new APIError("BAD_REQUEST", {
              message:
                "Check your name, email and password. Passwords must contain 12 to 128 characters.",
            });
          return { context: { body: parsed.data } };
        }
      }),
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export async function getAuth() {
  await ensureIndexes();
  return (instance ??= createAuth());
}
