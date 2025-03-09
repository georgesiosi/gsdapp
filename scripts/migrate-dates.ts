import { api } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { createClerkClient } from "@clerk/backend";
import jwt from 'jsonwebtoken';

async function migrateDates() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("Error: CLERK_SECRET_KEY environment variable is not set");
    console.log("Please set CLERK_SECRET_KEY in your .env.local file");
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const client = new ConvexHttpClient("https://rapid-octopus-495.convex.cloud");

  try {
    // Get the first user from Clerk (for admin operations)
    const { data: users } = await clerk.users.getUserList();
    const adminUser = users[0];

    if (!adminUser) {
      console.error("Error: No users found in Clerk");
      process.exit(1);
    }

    // Create a JWT token for the admin user
    const tokenPayload = {
      sub: adminUser.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
      azp: "convex",
      jti: Math.random().toString(36).substring(2),
      "https://convex.dev/auth": {
        userId: adminUser.id,
        subject: adminUser.id,
        provider: "clerk"
      }
    };

    const token = jwt.sign(tokenPayload, process.env.CLERK_SECRET_KEY);

    // Set the auth token for the Convex client
    client.setAuth(token);

    console.log("Starting date migration...");
    const result = await client.mutation(api.tasks.migrateDates);
    console.log(`Migration completed successfully! Updated ${result.updatedCount} tasks.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateDates();
