import { api } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

async function migrateDates() {
  if (!process.env.ADMIN_AUTH_TOKEN) {
    console.error("Error: ADMIN_AUTH_TOKEN environment variable is not set");
    console.log("Please set ADMIN_AUTH_TOKEN in your .env.local file with a valid JWT token");
    process.exit(1);
  }

  const client = new ConvexHttpClient("https://rapid-octopus-495.convex.cloud");

  try {
    // Set the auth token for the Convex client
    client.setAuth(process.env.ADMIN_AUTH_TOKEN);

    console.log("Starting date migration...");
    const result = await client.mutation(api.tasks.migrateDates);
    console.log(`Migration completed successfully! Updated ${result.updatedCount} tasks.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateDates();
