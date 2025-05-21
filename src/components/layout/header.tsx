import { CosmosCuratorLogo } from '@/components/icons/logo';
import { Rocket } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Rocket className="h-6 w-6 mr-2 text-accent" />
          <CosmosCuratorLogo className="h-auto" />
        </div>
        {/* Navigation items can be added here if needed later */}
      </div>
    </header>
  );
}
