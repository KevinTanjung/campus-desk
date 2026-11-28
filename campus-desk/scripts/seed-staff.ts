import { getAuth } from "../lib/auth";
import { client, database } from "../lib/db";
import { registrationSchema } from "../lib/validation";

const input = registrationSchema.parse({
  name: process.env.STAFF_NAME,
  email: process.env.STAFF_EMAIL,
  password: process.env.STAFF_PASSWORD,
});

try {
  const auth = await getAuth();
  const existing = await database()
    .collection("user")
    .findOne({ email: input.email });
  if (existing && existing.role !== "staff") {
    throw new Error("This email belongs to a student. Use a new staff email.");
  }
  if (!existing) {
    const result = await auth.api.signUpEmail({ body: input });
    await database()
      .collection("user")
      .updateOne(
        { $expr: { $eq: [{ $toString: "$_id" }, result.user.id] } },
        { $set: { role: "staff" } },
      );
  }
  console.log("Staff account is ready.");
} finally {
  await client().close();
}
