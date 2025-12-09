// lib/email/mailer.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@flowtrack.local';

const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('[email] SMTP not fully configured, emails will be logged to console only');
}

export async function sendVerificationEmail(to: string, code: string) {
  const subject = 'Your FlowTrack verification code';
  const text = `Your verification code is: ${code}`;
  const html = `<p>Your verification code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>`;

  if (!transporter) {
    console.log('[email] Verification email (DEV ONLY)', { to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

export async function sendInvitationEmail(to: string, organizationName: string, token: string) {
  const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
  const acceptUrl = `${baseUrl}/apps/auth/accept-invite?token=${encodeURIComponent(token)}`;

  const subject = `You have been invited to join ${organizationName} on FlowTrack`;
  const text = `You have been invited to join ${organizationName} on FlowTrack.

To accept the invitation, open this link in your browser:

${acceptUrl}

If you did not expect this invitation, you can ignore this email.`;

  const html = `
    <p>You have been invited to join <strong>${organizationName}</strong> on FlowTrack.</p>
    <p>
      <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;">
        Accept invitation
      </a>
    </p>
    <p>Or open this link in your browser:</p>
    <p><a href="${acceptUrl}">${acceptUrl}</a></p>
    <p>If you did not expect this invitation, you can ignore this email.</p>
  `;

  if (!transporter) {
    console.log('[email] Invitation email (DEV ONLY)', { to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
