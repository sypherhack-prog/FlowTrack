"use client";

import { useEffect, useState } from 'react';
import { useTimer } from '@/app/tracker/TimeProvider';

interface ProjectOption {
  id: string;
  name: string;
}

export default function Tracker() {
  const { isRunning, seconds, start, stop, activityLevel, projectId } = useTimer();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch('/api/dashboard/projects');
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.projects) ? (data.projects as ProjectOption[]) : [];
        setProjects(items);

        if (!selectedProjectId && projectId) {
          const match = items.find((p) => p.id === projectId);
          if (match) {
            setSelectedProjectId(match.id);
          }
        }
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleStart = async () => {
    let projectToUse = selectedProjectId;

    if (!projectToUse) {
      const name = newProjectName.trim();
      if (!name) {
        return;
      }

      setSavingProject(true);
      try {
        const res = await fetch('/api/dashboard/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.project) return;
        const created: ProjectOption = { id: data.project.id, name: data.project.name };
        setProjects((prev) => [created, ...prev]);
        projectToUse = created.id;
        setSelectedProjectId(created.id);
        setNewProjectName('');
      } finally {
        setSavingProject(false);
      }
    }

    if (!projectToUse) return;
    await start(projectToUse);
  };

  const handleToggle = async () => {
    if (isRunning) {
      await stop();
    } else {
      await handleStart();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activityLabel =
    activityLevel === 'away' ? 'Away' : activityLevel === 'idle' ? 'Idle' : 'Active';

  const activityClass =
    activityLevel === 'away'
      ? 'bg-red-100 text-red-700'
      : activityLevel === 'idle'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  return (
    <div className="rounded-lg bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold">Suivi du temps</h2>

      <div className="mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">No projects yet. Create one below to start tracking.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or create a new project</label>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="text-6xl font-mono">{formatTime(seconds)}</div>
        <div className="ml-4 text-right">
          <div className="text-sm text-gray-500">État activité</div>
          <div
            className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${activityClass}`}
          >
            {activityLabel}
          </div>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={savingProject || loadingProjects}
        className={`w-full rounded px-8 py-4 text-xl font-bold text-white transition ${
          isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        } ${savingProject || loadingProjects ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {isRunning ? 'Arrêter le suivi' : 'Démarrer le suivi'}
      </button>

      {isRunning && (
        <p className="mt-4 text-center text-green-600">
          Suivi en cours… (activité + screenshots automatiques)
        </p>
      )}
    </div>
  );
}