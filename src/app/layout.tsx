import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Housie Live - Real-time Multiplayer Tambola',
  description: 'Play real-time multiplayer Housie game night with friends. Custom 6x5 ticket, server-authoritative calling, instant validation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
