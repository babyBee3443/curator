import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/layout/header'; // Import AppHeader

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kozmos Küratörü',
  description: 'Bilim, teknoloji ve uzay Instagram gönderileri için yapay zeka destekli içerik yönetimi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <div className="flex min-h-screen w-full flex-col">
          <AppHeader />
          <div className="flex-1 overflow-y-auto"> {/* Ana içerik alanı kaydırılabilir yapıldı */}
            {children}
          </div>
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row mx-auto">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Kozmos Küratörü için Yapay Zeka tarafından oluşturuldu.
              </p>
            </div>
          </footer>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
