
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        {/* Optional: Add social links or other footer content here */}
      </div>
    </footer>
  );
}
