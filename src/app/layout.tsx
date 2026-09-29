import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Тайм-менеджер',
  description: 'Поиск общих свободных окон',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-50">
        <Navbar />
        {children}
      </body>
    </html>
  );
}