'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

type Member = {
  user_id: string;
  joined_at: string;
  email?: string;
};

type Availability = {
  id: string;
  user_id: string;
  email: string;
  title: string;
  start_time: string;
  end_time: string;
};

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      // Загружаем группу
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !groupData) {
        setMessage('Группа не найдена или нет доступа');
        setLoading(false);
        return;
      }
      setGroup(groupData);

      // Загружаем участников с email через SQL-функцию
      const { data: membersData, error: membersError } = await supabase.rpc(
        'get_group_members',
        { gid: groupId }
      );

      if (membersError) {
        setMessage('Ошибка загрузки участников: ' + membersError.message);
        setLoading(false);
        return;
      }

      setMembers(membersData ?? []);

      // Загружаем занятость всех участников группы
      const { data: availData, error: availError } = await supabase.rpc(
        'get_group_availability',
        { gid: groupId }
      );

      if (!availError && availData) {
        setAvailability(availData);
      }

      setLoading(false);
    }
    load();
  }, [groupId, router]);

  async function handleLeave() {
    if (!confirm('Вы уверены, что хотите покинуть группу?')) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userData.user.id);

    if (error) {
      setMessage('Ошибка выхода: ' + error.message);
      return;
    }
    router.push('/groups');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Загрузка…</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="mb-4 text-gray-700">{message || 'Группа не найдена'}</p>
        <Link href="/groups" className="text-blue-600 hover:underline">
          ← Назад к группам
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/groups"
          className="mb-4 inline-block text-blue-600 hover:underline"
        >
          ← Назад к группам
        </Link>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {group.name}
          </h1>
          <p className="text-sm text-gray-600">
            Код приглашения:{' '}
            <code className="rounded bg-gray-100 px-2 py-0.5">
              {group.invite_code}
            </code>
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            Участники ({members.length})
          </h2>

          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                {m.email ?? m.user_id}
                {m.user_id === group.owner_id && (
                  <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    владелец
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            Занятость участников ({availability.length})
          </h2>

          {availability.length === 0 ? (
            <p className="text-gray-600">
              Пока никто не добавил свою занятость.
            </p>
          ) : (
            <ul className="space-y-2">
              {availability.map((a) => (
                <li
                  key={a.id}
                  className="rounded border border-gray-200 p-3 text-sm"
                >
                  <div className="font-medium text-gray-900">{a.title}</div>
                  <div className="text-gray-600">
                    {new Date(a.start_time).toLocaleString('ru-RU')} —{' '}
                    {new Date(a.end_time).toLocaleString('ru-RU')}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{a.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {message && (
          <p className="mb-4 rounded bg-yellow-50 p-3 text-sm text-gray-700">
            {message}
          </p>
        )}

        <button
          onClick={handleLeave}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Покинуть группу
        </button>
      </div>
    </main>
  );
}