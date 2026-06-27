/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MobileShellProps {
  children: React.ReactNode;
  currentTimeString?: string;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div id="fundora-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

