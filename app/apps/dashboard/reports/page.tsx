"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { generatePDF, type EmployeeReport } from "@/components/EmployeeReportPDF";

interface ReportItem {
  id: string;
  projectName: string;
  task: string;
  startTime: string;
  endTime: string;
  seconds: number;
  spent: number;
  screenshotUrls: string[];
   activity: number;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return d.toLocaleString();
};

export default function ReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Me');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/sessions');
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        setUserName(data.name || data.email || 'Me');
      } catch {
        // ignore
      }
    };

    loadUser();
  }, []);

  const handleDownloadPdf = async () => {
    if (!items.length) return;

    const totalSeconds = items.reduce((acc, item) => acc + item.seconds, 0);
    const totalTime = formatDuration(totalSeconds);

    const weightedActivity =
      totalSeconds > 0
        ? Math.round(
            items.reduce((acc, item) => acc + item.activity * item.seconds, 0) / totalSeconds,
          )
        : 0;

    const screenshots = items.flatMap((item) => item.screenshotUrls).slice(0, 30);

    const employee: EmployeeReport = {
      name: userName,
      totalTime,
      activity: weightedActivity,
      screenshots,
    };

    await generatePDF(employee);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Time reports</h2>
        <div className="flex items-center gap-3">
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
          {!loading && items.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Download PDF report
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Project</th>
                <th className="py-2 pr-4">Task</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Screenshots</th>
                <th className="py-2 pr-4 text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No tracked sessions yet.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDateTime(item.startTime)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap font-medium">{item.projectName}</td>
                  <td className="py-3 pr-4 max-w-xs truncate" title={item.task}>
                    {item.task || <span className="text-gray-400">(no task)</span>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDuration(item.seconds)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 max-w-[160px] overflow-hidden">
                      {item.screenshotUrls && item.screenshotUrls.length > 0 ? (
                        item.screenshotUrls.slice(0, 3).map((url, index) => (
                          <Image
                            key={index}
                            src={url}
                            alt="Screenshot"
                            width={160}
                            height={120}
                            className="w-12 h-9 rounded object-cover border border-gray-200 cursor-pointer"
                            onClick={() => setLightboxUrl(url)}
                          />
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No screenshots</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-0 text-right whitespace-nowrap">
                    {item.spent > 0 ? `$${item.spent.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
            >
              Close
            </button>
            {lightboxUrl && (
              <Image
                src={lightboxUrl}
                alt="Screenshot preview"
                width={1280}
                height={720}
                className="max-h-[85vh] h-auto w-auto rounded shadow-xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
