import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RegisterPage() {
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, registerPending } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      await register({ email, password, storeName });
      // New account → go straight to onboarding
      navigate('/onboarding');
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { error?: string; details?: Record<string, string[]> } };
        request?: unknown;
        message?: string;
      };
      if (e.response?.status === 409) {
        setError('An account with this email already exists. Try signing in.');
      } else if (e.response?.data?.details) {
        const msgs = Object.values(e.response.data.details).flat().join(' ');
        setError(msgs);
      } else if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else if (e.request) {
        setError('Cannot reach the API. Check your connection or try again.');
      } else {
        setError((e as { message?: string }).message ?? 'Registration failed.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-primary">Aria</span>
          </div>
          <p className="text-secondary text-sm">WhatsApp AI Commerce Automation</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-primary mb-2">Create your store</h1>
          <p className="text-sm text-secondary mb-6">Free to start. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5" htmlFor="storeName">
                Store name
              </label>
              <input
                id="storeName" type="text" autoComplete="organization" required
                value={storeName} onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Toko Buku Nusantara"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword" type="password" autoComplete="new-password" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={registerPending}
              className="w-full bg-accent hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {registerPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-indigo-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-secondary mt-6">
          &copy; {new Date().getFullYear()} Aria. All rights reserved.
        </p>
      </div>
    </div>
  );
}
