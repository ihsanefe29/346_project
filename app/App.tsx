'use client';

import { useEffect, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import EventsPage from './components/EventsPage';
import OrganiserDashboard from './components/OrganiserDashboard';
import MyBookings from './components/MyBookings';

type User = {
  id: string;
  username?: string;
  email: string;
  role: 'organiser' | 'attendee';
};

type AuthView = 'login' | 'register';
type AppPage = 'events' | 'my-events' | 'my-bookings';

function normalizeUser(userData: any): User {
  return {
    id: String(userData.userId ?? userData.id),
    username: userData.username,
    email: userData.email,
    role: userData.role?.toUpperCase() === 'ORGANIZER' ? 'organiser' : 'attendee',
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<AppPage>('events');
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(normalizeUser(data.user));
      })
      .catch(() => {})
      .finally(() => setBootstrapping(false));
  }, []);

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const handleLogin = (userData: any) => {
    setUser(normalizeUser(userData));
    setCurrentPage('events');
  };

  const handleRegister = (userData: any) => {
    setUser(normalizeUser(userData));
    setCurrentPage('events');
  };

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setAuthView('login');
    setCurrentPage('events');
  };

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  if (!user) {
    if (authView === 'login') {
      return (
          <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => setAuthView('register')}
          />
      );
    } else {
      return (
          <Register
              onRegister={handleRegister}
              onSwitchToLogin={() => setAuthView('login')}
          />
      );
    }
  }

  if (currentPage === 'my-events' && user.role === 'organiser') {
    return (
        <OrganiserDashboard
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        />
    );
  }

  if (currentPage === 'my-bookings') {
    return (
        <MyBookings
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        />
    );
  }

  return (
      <EventsPage
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
      />
  );
}
