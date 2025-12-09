// components/app/LiveUsersChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

interface DataPoint {
  time: string;
  users: number;
}

interface LiveActivityInfo {
  userId: string;
  seconds: number;
  projectId?: string;
  level?: string;
  app?: string;
  url?: string;
}

const INITIAL_POINTS: DataPoint[] = [
  { time: '00:00', users: 0 },
  { time: '00:05', users: 0 },
  { time: '00:10', users: 0 },
  { time: '00:15', users: 0 },
  { time: '00:20', users: 0 },
  { time: '00:25', users: 0 },
];

export default function LiveUsersChart() {
  const [data, setData] = useState<DataPoint[]>(INITIAL_POINTS);

  const [liveCount, setLiveCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<LiveActivityInfo | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    socket.on('live-users-update', (count: number) => {
      setLiveCount(count);

      setData(prev => {
        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const updated = [...prev.slice(1), { time: timeLabel, users: count }];
        return updated;
      });
    });

    socket.on('live-activity', (payload: any) => {
      setLastActivity(payload as LiveActivityInfo);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Utilisateurs en direct</h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-3xl font-bold text-indigo-600">{liveCount}</span>
          <span className="text-gray-600">actifs maintenant</span>
        </div>
      </div>

      {lastActivity && (
        <p className="mb-4 text-sm text-gray-600 truncate">
          Dernière activité :
          <span className="font-semibold"> {lastActivity.level ?? 'active'}</span>
          {lastActivity.app && <span> sur {lastActivity.app}</span>}
        </p>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 'dataMax + 2']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#6366f1"
              strokeWidth={4}
              dot={{ fill: '#6366f1', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}