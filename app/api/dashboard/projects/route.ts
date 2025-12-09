// app/api/dashboard/projects/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Project from '@/lib/db/models/Project';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();

  const userDoc = await User.findById(currentUser.id);
  if (!userDoc) {
    return new NextResponse('User not found', { status: 404 });
  }

  const projects = await Project.find({ userId: userDoc._id }).sort({ createdAt: -1 });

  const items = projects.map((p: any) => ({
    id: p._id.toString(),
    name: p.name as string,
    hourlyRate: typeof p.hourlyRate === 'number' ? p.hourlyRate : 0,
    budgetHours: typeof p.budgetHours === 'number' ? p.budgetHours : 0,
    trackedHours: typeof p.trackedHours === 'number' ? p.trackedHours : 0,
  }));

  return NextResponse.json({ projects: items });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        hourlyRate?: number;
        budgetHours?: number;
      }
    | null;

  if (!body?.name) {
    return new NextResponse('Name is required', { status: 400 });
  }

  await connectDB();

  const userDoc = await User.findById(currentUser.id);
  if (!userDoc) {
    return new NextResponse('User not found', { status: 404 });
  }

  const project = await Project.create({
    name: body.name,
    hourlyRate: typeof body.hourlyRate === 'number' ? body.hourlyRate : 0,
    budgetHours: typeof body.budgetHours === 'number' ? body.budgetHours : 0,
    userId: userDoc._id,
  });

  return NextResponse.json(
    {
      success: true,
      project: {
        id: project._id.toString(),
        name: project.name as string,
        hourlyRate: project.hourlyRate as number,
        budgetHours: project.budgetHours as number,
        trackedHours: project.trackedHours as number,
      },
    },
    { status: 201 },
  );
}
