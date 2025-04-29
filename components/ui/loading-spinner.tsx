import React from 'react';

// A simple loading spinner component
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
