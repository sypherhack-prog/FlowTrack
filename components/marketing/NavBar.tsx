// components/marketing/Navbar.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openLogin, openRegister } = useAuthModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/marketing" className="flex items-center space-x-2">
          <div className="text-2xl font-black text-indigo-600">FlowTrack</div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/marketing/features" className="text-gray-700 hover:text-indigo-600 font-medium">Features</Link>
          <Link href="/marketing/pricing" className="text-gray-700 hover:text-indigo-600 font-medium">Pricing</Link>
          <Link href="/marketing#customers" className="text-gray-700 hover:text-indigo-600 font-medium">Customers</Link>
          <Link href="/marketing#integrations" className="text-gray-700 hover:text-indigo-600 font-medium">Resources</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="hidden md:inline-flex"
            type="button"
            onClick={openLogin}
          >
            Sign in
          </Button>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700"
            type="button"
            onClick={openRegister}
          >
            Start free trial
          </Button>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-6 py-6 space-y-4">
            <Link href="/marketing/features" className="block text-lg">Features</Link>
            <Link href="/marketing/pricing" className="block text-lg">Pricing</Link>
            <button
              type="button"
              onClick={() => {
                openLogin();
                setMobileOpen(false);
              }}
              className="block text-left text-lg font-medium text-indigo-600"
            >
              Sign in
            </button>
          </div>
        </div>
      )}
    </header>
  );
}