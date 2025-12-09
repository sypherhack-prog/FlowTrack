"use client";
// components/marketing/Hero.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function Hero() {
  const { openRegister } = useAuthModal();

  return (
    <section className="pt-32 pb-20 bg-white text-gray-900">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
            Time tracking that <span className="text-indigo-600">actually works</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-700">
            Join 95,000+ teams using FlowTrack to track time, boost productivity, and pay accurately.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              size="lg"
              type="button"
              onClick={openRegister}
              className="text-lg px-10 py-7 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-md"
            >
              Start free trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-10 py-7 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold"
            >
              <Link href="/marketing#how-it-works">Watch demo</Link>
            </Button>
          </div>

          <p className="text-lg text-gray-600">No credit card required • 14-day free trial • Setup in 60 seconds</p>
        </div>

        <div className="mt-20 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <Image
              src="/dashboard-preview.svg"
              alt="FlowTrack Dashboard"
              width={1400}
              height={800}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}