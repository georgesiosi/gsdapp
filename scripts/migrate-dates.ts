import { api } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

async function migrateDates() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  try {
    console.log("Starting date migration...");
    const result = await client.mutation(api.tasks.migrateDates);
    console.log(`Migration completed successfully! Updated ${result.updatedCount} tasks.`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateDates();
