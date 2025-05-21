
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayarlar - Kozmos Küratörü',
  description: 'Kozmos Küratörü e-posta ayarları.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
