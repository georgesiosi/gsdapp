import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  // --- TODO: Replace with actual path and anchor if different ---
  const settingsPath = "/settings"; 
  const apiKeyAnchor = "#ai-integration"; // Correct anchor ID
  // -------------------------------------------------------------

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]"> 
        <DialogHeader>
          <DialogTitle>Welcome to GSD App!</DialogTitle>
          <DialogDescription>
            Your AI-powered assistant for prioritizing tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p>
            GSD App helps you focus on what truly matters. Simply add your tasks, and our AI will automatically categorize them using the Eisenhower Matrix (Urgent/Important).
          </p>
          <p>
            This helps you tackle critical tasks first and schedule or delegate less important ones.
          </p>
          <p>
            <strong>Crucial Setup:</strong> To enable AI categorization, please go to the 
            Settings page (usually found via your profile icon or a gear icon) and enter your <Link href={`${settingsPath}${apiKeyAnchor}`} className="text-blue-600 hover:underline">OpenAI API Key</Link>. Without it, tasks will not be automatically sorted.
          </p>
          {/* Add more explanations or steps if needed */}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Let's Get Started!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
