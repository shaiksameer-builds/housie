import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Housie Night — Online Multiplayer Tambola',
  description:
    'Play real-time multiplayer Housie (Tambola) online with friends and family. Authentic 3×9 tickets, instant server verification, synchronized number calling, and zero signup required.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-festive-950 text-slate-100 antialiased selection:bg-festive-gold selection:text-festive-950">
        {children}
      </body>
    </html>
  );
}
