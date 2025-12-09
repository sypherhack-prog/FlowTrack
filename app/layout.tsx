import type { Metadata } from "next";
import "./globals.css";
import { BlockedSitesWatcher } from "@/components/BlockedSitesWatcher";

export const metadata: Metadata = {
  title: "Hubstaff Clone",
  description: "Time tracking SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <BlockedSitesWatcher />
        {children}
      </body>
    </html>
  );
}