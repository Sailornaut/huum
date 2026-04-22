'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PenSquare, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/create', label: 'Create', icon: PenSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const href = item.href === '/profile' ? `/profile/${user?.username || 'me'}` : item.href;
          const isActive = pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors
                ${isActive ? 'text-huum-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
