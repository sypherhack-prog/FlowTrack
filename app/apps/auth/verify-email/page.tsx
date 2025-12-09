import VerifyEmailForm from './VerifyEmailForm';

interface VerifyEmailPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const raw = searchParams?.email;
  const initialEmail = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-gray-600 mt-2">
            We have sent a 6-digit verification code to your email address.
          </p>
        </div>

        <VerifyEmailForm initialEmail={initialEmail} />
      </div>
    </div>
  );
}
