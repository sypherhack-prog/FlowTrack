// lib/realtime/managerNotifications.ts
// Utilitaire côté serveur pour envoyer des notifications en temps réel
// aux managers via le serveur Socket.io (container socket).

import type { Socket } from 'socket.io-client';
import { io as ClientIO } from 'socket.io-client';

import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';

let socket: Socket | null = null;

function getSocket(): Socket | null {
  try {
    if (socket && socket.connected) return socket;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://socket:3001';
    socket = ClientIO(url, {
      transports: ['websocket'],
    });

    socket.on('connect_error', (err) => {
      console.error('Socket client connect error:', err?.message || err);
    });

    return socket;
  } catch (err) {
    console.error('Unable to initialize Socket.io client from backend:', err);
    socket = null;
    return null;
  }
}

interface ManagerNotificationPayload {
  orgId?: string;
  type: 'blocked-site' | 'member-inactivity';
  message: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  url?: string;
  level?: 'idle' | 'away';
  createdAt: string;
}

function emitManagerEvent(payload: ManagerNotificationPayload) {
  const s = getSocket();
  if (!s) return;

  try {
    s.emit('manager-notification', payload);
  } catch (err) {
    console.error('Error emitting manager-notification:', err);
  }
}

// Mémoire en process pour éviter de spammer sur l'inactivité
const lastLevelByUser = new Map<string, 'active' | 'idle' | 'away'>();

export async function notifyBlockedSite(userId: string, url: string) {
  try {
    await connectDB();

    const userDoc = await User.findById(userId);
    if (!userDoc || !userDoc.organizationId) return;

    const org = await Organization.findById(userDoc.organizationId);
    if (!org) return;

    const plan = (org.plan as string | undefined) ?? 'trial';
    if (plan === 'trial') {
      // On garde les alertes basiques dans le dashboard, mais pas de live notif
      return;
    }

    const message = `${userDoc.name || userDoc.email || 'Un membre'} a ouvert un site bloqué : ${url}`;

    emitManagerEvent({
      orgId: org._id.toString(),
      type: 'blocked-site',
      message,
      userId: userDoc._id.toString(),
      userEmail: userDoc.email,
      userName: userDoc.name,
      url,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('notifyBlockedSite error:', err);
  }
}

export async function notifyMemberInactivity(userId: string, level: 'active' | 'idle' | 'away') {
  const prev = lastLevelByUser.get(userId) ?? 'active';
  lastLevelByUser.set(userId, level);

  // On ne notifie que la première fois qu'on passe de actif -> idle/away
  if (level === 'active') return;
  if (prev === 'idle' || prev === 'away') return;

  try {
    await connectDB();

    const userDoc = await User.findById(userId);
    if (!userDoc || !userDoc.organizationId) return;

    const org = await Organization.findById(userDoc.organizationId);
    if (!org) return;

    const plan = (org.plan as string | undefined) ?? 'trial';
    if (plan === 'trial') {
      // Live notifications réservées aux plans payants
      return;
    }

    const baseName = userDoc.name || userDoc.email || 'Un membre';
    const message =
      level === 'away'
        ? `${baseName} a quitté son écran (statut away).`
        : `${baseName} est inactif depuis un moment (statut idle).`;

    emitManagerEvent({
      orgId: org._id.toString(),
      type: 'member-inactivity',
      message,
      userId: userDoc._id.toString(),
      userEmail: userDoc.email,
      userName: userDoc.name,
      level,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('notifyMemberInactivity error:', err);
  }
}
