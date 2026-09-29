'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setLoading(false);
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Мой профиль</h1>

        {email ? (
          <>
            <p className="mb-6 text-gray-700">
              Вы вошли как: <span className="font-medium">{email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full rounded bg-red-600 py-2 text-white hover:bg-red-700"
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-700">Вы не вошли в аккаунт.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
            >
              Войти
            </button>
          </>
        )}
      </div>
    </main>
  );
}