'use client';

import { useState } from 'react';

interface LoginProps {
  onLogin: (user: {
    id: string;
    username: string;
    role: 'organiser' | 'attendee';
  }) => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid username or password.');
      }

      if (!data.user) {
        throw new Error('Invalid login response from server.');
      }

      onLogin({
        id: String(data.user.id),
        username: data.user.username,
        role: data.user.role,
      });
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-center mb-6 text-2xl font-semibold">Login</h2>

          {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-1">Username</label>
              <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="organizer1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-1">Password</label>
              <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
              />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:underline"
            >
              Register
            </button>
          </p>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-semibold mb-1">Demo accounts (password: Seed1234):</p>
            <p>Organiser: organizer1 / organizer2</p>
            <p>Attendee: attendee1 / attendee2 / attendee3 / attendee4</p>
          </div>
        </div>
      </div>
  );
}
