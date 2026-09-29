'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadGroups() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    // Загружаем только те группы, где пользователь — участник
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id');

    if (memberError) {
      setMessage('Ошибка загрузки: ' + memberError.message);
      setLoading(false);
      return;
    }

    const ids = (memberships ?? []).map((m) => m.group_id);

    if (ids.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Ошибка загрузки: ' + error.message);
    } else {
      setGroups(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!newName.trim()) {
      setMessage('Введите название группы');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: newName.trim(),
        owner_id: userData.user.id,
      })
      .select()
      .single();

    if (groupError) {
      setMessage('Ошибка создания: ' + groupError.message);
      return;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userData.user.id,
      });

    if (memberError) {
      setMessage(
        'Группа создана, но не удалось добавить вас как участника: ' +
          memberError.message
      );
    }

    setGroups([group, ...groups]);
    setNewName('');
    setMessage('Группа создана!');
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!joinCode.trim()) {
      setMessage('Введите код приглашения');
      return;
    }

    const { data, error } = await supabase.rpc('join_group_by_code', {
      code: joinCode.trim(),
    });

    if (error) {
      setMessage('Ошибка: ' + error.message);
      return;
    }

    setJoinCode('');
    setMessage('Вы присоединились к группе!');
    await loadGroups();
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
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Мои группы</h1>

        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg bg-white p-6 shadow-md"
        >
          <h2 className="mb-4 text-xl font-semibold">Создать группу</h2>

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Название
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Например: Друзья или Учёба"
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Создать
          </button>
        </form>

        <form
          onSubmit={handleJoin}
          className="mb-8 rounded-lg bg-white p-6 shadow-md"
        >
          <h2 className="mb-4 text-xl font-semibold">
            Присоединиться к группе
          </h2>

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Код приглашения
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Например: 27f6f47e9f"
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            Присоединиться
          </button>
        </form>

        {message && (
          <p className="mb-6 rounded bg-yellow-50 p-3 text-sm text-gray-700">
            {message}
          </p>
        )}

        <h2 className="mb-4 text-xl font-semibold">Список групп</h2>

        {groups.length === 0 ? (
          <p className="text-gray-600">У вас пока нет групп.</p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id} className="rounded-lg bg-white p-4 shadow">
                <Link
                  href={`/groups/${group.id}`}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {group.name}
                </Link>
                <p className="mt-1 text-sm text-gray-600">
                  Код приглашения:{' '}
                  <code className="rounded bg-gray-100 px-2 py-0.5">
                    {group.invite_code}
                  </code>
                </p>
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