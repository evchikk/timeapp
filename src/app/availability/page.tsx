'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Availability = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
};

export default function AvailabilityPage() {
  const [items, setItems] = useState<Availability[]>([]);
  const [title, setTitle] = useState('Занят');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        setMessage('Ошибка загрузки: ' + error.message);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('availability')
      .insert({
        user_id: userData.user.id,
        title,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
      })
      .select()
      .single();

    if (error) {
      setMessage('Ошибка: ' + error.message);
      return;
    }

    setItems([...items, data]);
    setTitle('Занят');
    setStart('');
    setEnd('');
    setMessage('Запись добавлена!');
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('availability').delete().eq('id', id);
    if (error) {
      setMessage('Ошибка удаления: ' + error.message);
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Моя занятость
        </h1>

        <form
          onSubmit={handleAdd}
          className="mb-8 rounded-lg bg-white p-6 shadow-md"
        >
          <h2 className="mb-4 text-xl font-semibold">Добавить запись</h2>

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Что делаете
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Начало
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Конец
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Добавить
          </button>

          {message && (
            <p className="mt-4 text-sm text-gray-700">{message}</p>
          )}
        </form>

        <h2 className="mb-4 text-xl font-semibold">Мои записи</h2>

        {items.length === 0 ? (
          <p className="text-gray-600">Пока ничего нет.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(item.start_time).toLocaleString('ru-RU')} —{' '}
                    {new Date(item.end_time).toLocaleString('ru-RU')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => router.push('/profile')}
          className="mt-8 text-blue-600 hover:underline"
        >
          ← Назад в профиль
        </button>
      </div>
    </main>
  );
}