
import Link from 'next/link';
import { CosmosCuratorLogo } from '@/components/icons/logo';
import { Rocket, Settings, Home } from 'lucide-react'; // Home ikonu eklendi

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-accent" />
            <CosmosCuratorLogo className="h-auto" />
          </Link>
        </div>
        <nav className="flex items-center gap-6">
           <Link href="/" legacyBehavior passHref>
            <a className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Home className="h-4 w-4 mr-1.5" />
              Ana Sayfa
            </a>
          </Link>
          <Link href="/settings" legacyBehavior passHref>
            <a className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Settings className="h-4 w-4 mr-1.5" />
              Ayarlar
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}
