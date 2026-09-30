import { Cormorant, Karla } from 'next/font/google';

export const hostSans = Karla({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-host-sans',
});

export const hostSerif = Cormorant({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-host-serif',
  weight: ['300', '400', '500', '600'],
});
