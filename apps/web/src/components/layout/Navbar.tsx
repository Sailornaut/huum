'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, LogOut, Settings, User } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/stores/auth.store';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/feed" className="flex-shrink-0">
          <span className="text-2xl font-bold gradient-text">HUUM</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search HUUM..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-huum-amber-400/50 focus:border-huum-amber-400
                placeholder-gray-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-huum-coral-500 rounded-full" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center">
              <Avatar src={user?.avatarUrl} name={user?.displayName} size="sm" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
                <Link
                  href={`/profile/${user?.username}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
