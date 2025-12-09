'use client';

import { createContext, useContext, useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

interface AuthModalContextValue {
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'login' | 'register' | null>(null);

  const openLogin = () => setMode('login');
  const openRegister = () => setMode('register');
  const close = () => setMode(null);

  const isOpen = mode !== null;

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -top-10 right-0 flex gap-2 text-sm text-white/80">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={
                  mode === 'login'
                    ? 'underline font-semibold'
                    : 'hover:underline'
                }
              >
                Sign in
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={
                  mode === 'register'
                    ? 'underline font-semibold'
                    : 'hover:underline'
                }
              >
                Create account
              </button>
            </div>

            <div className="relative rounded-2xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                Esc
              </button>
              {mode === 'login' ? (
                <LoginForm onSuccess={close} />
              ) : (
                <RegisterForm onSuccess={close} />
              )}
            </div>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
