// app/(marketing)/layout.tsx
import MarketingShell from '@/components/marketing/MarketingShell';

export default function MarketingLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingShell>{children}</MarketingShell>
    </div>
  );
}