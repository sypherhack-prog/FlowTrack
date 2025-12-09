'use client';

import Navbar from '@/components/marketing/NavBar';
import Footer from '@/components/marketing/Footer';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AuthModalProvider>
  );
}
