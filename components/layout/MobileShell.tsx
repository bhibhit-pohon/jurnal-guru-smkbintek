'use client';

import React from 'react';

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-100 flex justify-center">
      {/* Desktop: simulated phone frame */}
      <div className="w-full max-w-md bg-white relative shadow-2xl min-h-dvh flex flex-col">
        {children}
      </div>
    </div>
  );
}
