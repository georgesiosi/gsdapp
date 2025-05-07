"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageIntroProps {
  showBackButton?: boolean;
  backHref?: string;
}

export const PageIntro: React.FC<PageIntroProps> = ({ 
  showBackButton = false, 
  backHref = "/"
}) => {
  return (
    <div className="mb-4"> {/* Adjust margin if needed */}
      {showBackButton && (
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="mb-2 text-sm text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      )}
    </div>
  );
};
