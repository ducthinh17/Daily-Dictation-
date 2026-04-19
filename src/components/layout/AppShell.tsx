import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomBar } from './BottomBar';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-bg-mesh">
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        <div className="mesh-blob mesh-blob-3"></div>
      </div>
      <Sidebar />
      <main className="app-main-content">
        <div className="app-content-inner">
          {children}
        </div>
      </main>
      <BottomBar />
    </div>
  );
}
