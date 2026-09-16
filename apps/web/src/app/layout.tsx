import type { Metadata } from 'next';
import {
  Berkshire_Swash,
  Galada,
  Great_Vibes,
  Hind_Siliguri,
  Inter,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  variable: '--font-bengali',
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  display: 'swap',
});

const greatVibes = Great_Vibes({
  variable: '--font-script',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const galada = Galada({
  variable: '--font-galada',
  weight: '400',
  subsets: ['bengali'],
  display: 'swap',
});

const berkshireSwash = Berkshire_Swash({
  variable: '--font-berkshire',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Praman — Truth-Preserving AI Resume Pipeline',
  description:
    'End-to-end verifiable resume generation grounded strictly in confirmed candidate facts.',
  icons: {
    icon: [
      {
        url: '/praman_light_mode_logo.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/praman_dark_mode_logo.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
      {
        url: '/praman_light_mode_logo.png',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
      },
      {
        url: '/praman_dark_mode_logo.png',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
      },
    ],
    shortcut: '/praman_dark_mode_logo.svg',
    apple: '/praman_dark_mode_logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${hindSiliguri.variable} ${greatVibes.variable} ${galada.variable} ${berkshireSwash.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-brand-cyan/30 selection:text-brand-cyan transition-colors duration-150"
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
