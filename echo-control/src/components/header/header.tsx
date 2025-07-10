'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserIcon,
  LogOutIcon,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '../theme-provider';
import BalanceCard from '../BalanceCard';

export default function Header() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Close menus when clicking outside
  const handleBackdropClick = () => {
    setShowUserMenu(false);
    setShowThemeMenu(false);
  };

  // Get theme icon
  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    if (resolvedTheme === 'dark') return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();

  if (!isLoaded) {
    return (
      <header className="bg-card border-b border-border shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo placeholder */}
            <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            {/* User menu placeholder */}
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {(showUserMenu || showThemeMenu) && (
        <div className="fixed inset-0 z-40" onClick={handleBackdropClick} />
      )}

      <header className="bg-card border-b border-border shadow-sm backdrop-blur-sm relative z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Left side */}
            <div className="font-bold flex items-center gap-2">
              <Link href="/" className="flex items-center">
                <Image
                  src={
                    resolvedTheme === 'dark'
                      ? '/logo/dark.svg'
                      : '/logo/light.svg'
                  }
                  alt="Echo Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
              <span className="text-sm md:text-lg">
                <span className="font-extrabold">Echo</span>
                <span className="font-extralight"> by MeritSystems</span>
              </span>
            </div>

            {/* User controls - Right side */}
            <div className="flex items-center space-x-3">
              {/* Create App Button */}
              {user && (
                <Link
                  href="/owner/apps/create"
                  className="hidden md:flex items-center px-4 py-2.5 text-sm font-medium text-foreground bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm rounded-lg h-10"
                >
                  Create App
                </Link>
              )}
              {/* Theme Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm"
                  title={`Current theme: ${theme}`}
                >
                  <ThemeIcon className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Theme Menu */}
                {showThemeMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setTheme('light');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-all duration-200 ${
                          theme === 'light'
                            ? 'text-foreground bg-muted/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Sun className="h-4 w-4 mr-3" />
                        Light
                      </button>
                      <button
                        onClick={() => {
                          setTheme('dark');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-all duration-200 ${
                          theme === 'dark'
                            ? 'text-foreground bg-muted/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Moon className="h-4 w-4 mr-3" />
                        Dark
                      </button>
                      <button
                        onClick={() => {
                          setTheme('system');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-all duration-200 ${
                          theme === 'system'
                            ? 'text-foreground bg-muted/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Monitor className="h-4 w-4 mr-3" />
                        System
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Card - Compact */}
              {user && <BalanceCard compact />}

              {/* User Profile */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm h-10"
                  >
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full ring-2 ring-secondary/20"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {user.fullName || user.emailAddresses[0]?.emailAddress}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm z-50 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center space-x-3">
                          {user.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt="Profile"
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full ring-2 ring-secondary/20"
                            />
                          ) : (
                            <UserIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.fullName || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.emailAddresses[0]?.emailAddress}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // Add settings navigation here if needed
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            signOut();
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                          <LogOutIcon className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
