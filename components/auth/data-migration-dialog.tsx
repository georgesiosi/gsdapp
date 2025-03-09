"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useDataMigration } from "@/hooks/use-data-migration";

export function DataMigrationDialog() {
  const { migrateData, isMigrating, progress, needsMigration } = useDataMigration();

  useEffect(() => {
    if (needsMigration) {
      migrateData().catch(console.error);
    }
  }, [needsMigration, migrateData]);

  if (!needsMigration) return null;

  return (
    <Dialog open={isMigrating} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Migrating Your Data</DialogTitle>
          <DialogDescription>
            We're migrating your data to our new cloud storage system. This will only take a moment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress < 100
              ? "Migrating your tasks, ideas, and settings..."
              : "Migration complete!"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
