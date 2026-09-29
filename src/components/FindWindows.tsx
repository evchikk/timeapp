'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Availability = {
  user_id: string;
  email: string;
  start_time: string;
  end_time: string;
};

type Window = {
  start: Date;
  end: Date;
};

type Props = {
  groupId: string;
};

const SLOT_MINUTES = 15;

export default function FindWindows({ groupId }: Props) {
  const [duration, setDuration] = useState(60);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [windows, setWindows] = useState<Window[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function findWindows() {
    setMessage('');
    setWindows([]);
    setLoading(true);

    if (!dateFrom || !dateTo) {
      setMessage('Укажите диапазон дат');
      setLoading(false);
      return;
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (to <= from) {
      setMessage('Дата окончания должна быть позже начала');
      setLoading(false);
      return;
    }

    // Загружаем занятость всех участников группы
    const { data, error } = await supabase.rpc('get_group_availability', {
      gid: groupId,
    });

    if (error) {
      setMessage('Ошибка загрузки занятости: ' + error.message);
      setLoading(false);
      return;
    }

    const availability = (data ?? []) as Availability[];

    // Разбиваем диапазон на слоты по 15 минут
    const slots: Date[] = [];
    const cursor = new Date(from);
    while (cursor < to) {
      slots.push(new Date(cursor));
      cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES);
    }

    // Определяем, свободен ли слот для всех
    function isFree(slotStart: Date, slotEnd: Date): boolean {
      for (const a of availability) {
        const aStart = new Date(a.start_time);
        const aEnd = new Date(a.end_time);
        // Пересечение интервалов
        if (aStart < slotEnd && aEnd > slotStart) {
          return false;
        }
      }
      return true;
    }

    const slotEnd = (slotStart: Date) =>
      new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);

    const freeSlots = slots.filter((s) => isFree(s, slotEnd(s)));

    // Ищем непрерывные окна длиной >= duration
    const neededSlots = Math.ceil(duration / SLOT_MINUTES);
    const result: Window[] = [];

    let runStart = 0;
    for (let i = 0; i < freeSlots.length; i++) {
      const isContinuous =
        i > 0 &&
        freeSlots[i].getTime() -
          freeSlots[i - 1].getTime() ===
          SLOT_MINUTES * 60 * 1000;

      if (!isContinuous) {
        runStart = i;
      }

      const runLength = i - runStart + 1;
      if (runLength === neededSlots) {
        result.push({
          start: freeSlots[runStart],
          end: new Date(
            freeSlots[i].getTime() + SLOT_MINUTES * 60 * 1000
          ),
        });
      }
    }

    setWindows(result);
    setLoading(false);

    if (result.length === 0) {
      setMessage('Общих свободных окон не найдено. Попробуйте другой диапазон.');
    }
  }

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Найти общие окна</h2>

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Длительность (минут)
      </label>
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        min={15}
        step={15}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        С какой даты
      </label>
      <input
        type="datetime-local"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        По какую дату
      </label>
      <input
        type="datetime-local"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
      />

      <button
        onClick={findWindows}
        disabled={loading}
        className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Ищем…' : 'Найти окна'}
      </button>

      {message && (
        <p className="mt-4 rounded bg-yellow-50 p-3 text-sm text-gray-700">
          {message}
        </p>
      )}

      {windows.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-gray-900">
            Найдено окон: {windows.length}
          </h3>
          <ul className="space-y-2">
            {windows.map((w, i) => (
              <li
                key={i}
                className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
              >
                {w.start.toLocaleString('ru-RU')} —{' '}
                {w.end.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}