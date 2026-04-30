import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stayvo',
  description: 'Digital guest portal for short-term rentals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto w-full max-w-5xl px-4">{children}</div>
      </body>
    </html>
  );
}

