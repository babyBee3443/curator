
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayarlar - Kozmos Küratörü',
  description: 'Kozmos Küratörü uygulama ayarları ve entegrasyonları.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ana RootLayout zaten header ve footer'ı sağlayacaktır.
  // Bu layout, gelecekte sadece ayarlar sayfalarına özel ek yapı veya
  // context sağlamak için kullanılabilir.
  return (
    <>
      {children}
    </>
  );
}
