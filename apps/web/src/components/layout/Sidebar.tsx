'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PenSquare, User, Settings, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/create', label: 'Create Post', icon: PenSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const resolvedItems = navItems.map((item) => ({
    ...item,
    href: item.href === '/profile' ? `/profile/${user?.username || 'me'}` : item.href,
  }));

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-gray-100 bg-white py-6 px-4">
      <nav className="flex flex-col gap-1">
        {resolvedItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-huum-subtle text-huum-amber-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-huum-amber-600' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link
          href="/moderation"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
            ${
              pathname.startsWith('/moderation')
                ? 'bg-gradient-huum-subtle text-huum-amber-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
        >
          <Shield className="w-5 h-5" />
          Moderation
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
