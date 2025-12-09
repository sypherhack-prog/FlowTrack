import AcceptInviteForm from './AcceptInviteForm';

interface AcceptInvitePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const raw = searchParams?.token;
  const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join your team</h1>
          <p className="text-gray-600 mt-2">Set up your account to accept the invitation.</p>
        </div>

        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
