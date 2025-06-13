
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { MessageSquareHeart } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <MessageSquareHeart className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">{siteConfig.name}</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" asChild>
              <Link href="/admin/login">Admin Panel</Link>
            </Button>
            {/* Add more nav links here if needed */}
          </nav>
        </div>
      </div>
    </header>
  );
}
