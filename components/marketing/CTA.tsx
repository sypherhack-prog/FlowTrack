"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function CTA() {
  const { openRegister } = useAuthModal();
  return (
    <section className="py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to see FlowTrack in action?</h2>
          <p className="text-lg md:text-xl text-white/90 mb-10">
            Start a free 14-day trial, invite your team, and track your first project in less than five minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              type="button"
              onClick={openRegister}
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-10 py-7 shadow-lg shadow-black/20"
            >
              Start free trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white/80 bg-white/5 text-white hover:bg-white/15 px-10 py-7 font-semibold shadow-lg shadow-black/20"
            >
              <Link href="/marketing#how-it-works">Book a live demo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/80">No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
