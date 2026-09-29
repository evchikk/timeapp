'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setLoading(false);
    }
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // На странице входа навигацию не показываем
  if (pathname === '/login') return null;

  if (loading) return null;

  // Если пользователь не вошёл — показываем только «Войти»
  if (!email) {
    return (
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Тайм-менеджер
          </Link>
          <Link
            href="/login"
            className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Войти
          </Link>
        </div>
      </nav>
    );
  }

  // Если вошёл — показываем меню
  const links = [
    { href: '/profile', label: 'Профиль' },
    { href: '/availability', label: 'Занятость' },
    { href: '/groups', label: 'Группы' },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/profile" className="text-lg font-bold text-gray-900">
            Тайм-менеджер
          </Link>

          <div className="flex items-center gap-4">
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? 'text-sm font-semibold text-blue-600'
                      : 'text-sm text-gray-700 hover:text-blue-600'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {email}
          </span>
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}