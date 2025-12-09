// app/(marketing)/page.tsx
import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import HowItWorks from '@/components/marketing/HowItWorks';
import Testimonials from '@/components/marketing/Testimonials';
import Integrations from '@/components/marketing/Integrations';
import CTA from '@/components/marketing/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Integrations />
      <CTA />
    </>
  );
}