'use client';

import { useEffect, useState } from 'react';
import EventForm, { Event, EventFormData } from './EventForm';

interface Booking {
  id: string | number;
  eventId: string | number;
  userId?: string | number;
  userEmail?: string;
  user?: {
    email?: string;
    username?: string;
    name?: string;
  };
  bookedAt?: string;
  createdAt?: string;
}

interface OrganiserDashboardProps {
  user: { id: string; email: string; role: 'organiser' | 'attendee' };
  onNavigate: (page: 'events' | 'my-events' | 'my-bookings') => void;
  onLogout: () => void;
}

function getSoldTickets(event: Event) {
  return event._count?.bookings ?? event.ticketsSold ?? event.bookings?.length ?? 0;
}

function formatError(data: any, fallback: string) {
  return data?.error || data?.message || fallback;
}

export default function OrganiserDashboard({ user, onNavigate, onLogout }: OrganiserDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookingsByEvent, setBookingsByEvent] = useState<Record<string, Booking[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const search = searchTerm.toLowerCase();
    const title = event.title?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    const matchesSearch = title.includes(search) || description.includes(search);

    const eventDate = new Date(event.dateTime);
    const now = new Date();

    const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' && eventDate >= now) ||
        (filter === 'past' && eventDate < now);

    return matchesSearch && matchesFilter;
  });

  const ITEMS_PER_PAGE = 4;

  const totalPages = Math.max(
      1,
      Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedEvents = filteredEvents.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
  );

  const fetchEvents = async () => {
    try {

      const response = await fetch('/api/organizer/events', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(formatError(data, 'Failed to load organiser events'));

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load organiser events');
      setEvents([]);
    }
  };

  const fetchEventDetails = async (eventId: string | number) => {
    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(formatError(data, 'Failed to load attendee list'));

      // API returns { event, ticketsSold, ticketsRemaining, attendees }
      const attendees: Booking[] = (data.attendees || []).map((a: any) => ({
        id: a.bookingId,
        eventId,
        createdAt: a.bookedAt,
        user: { name: a.name, email: a.email, username: a.username },
      }));

      setBookingsByEvent(prev => ({ ...prev, [String(eventId)]: attendees }));

      if (data.event) {
        setEvents(prev =>
          prev.map(ev =>
            String(ev.id) === String(eventId)
              ? { ...ev, ...data.event, _count: { bookings: data.ticketsSold } }
              : ev
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load attendee list');
    }
  };

  const handleCreateEvent = async (eventData: EventFormData) => {

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(formatError(data, 'Failed to create event'));

    setShowForm(false);
    await fetchEvents();
  };

  const handleUpdateEvent = async (eventData: EventFormData) => {
    if (!editingEvent?.id) return;

    const response = await fetch(`/api/events/${editingEvent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(formatError(data, 'Failed to update event'));

    setEditingEvent(null);
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string | number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) throw new Error(formatError(data, 'Failed to delete event'));

      setEvents(prev => prev.filter(event => String(event.id) !== String(eventId)));
      if (selectedEventId === String(eventId)) setSelectedEventId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleToggleAttendees = async (eventId: string | number) => {
    const key = String(eventId);
    if (selectedEventId === key) {
      setSelectedEventId(null);
      return;
    }

    setSelectedEventId(key);
    if (!bookingsByEvent[key]) {
      await fetchEventDetails(eventId);
    }
  };

  if (showForm || editingEvent) {
    return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <EventForm
                event={editingEvent || undefined}
                onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
            />
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                    onClick={() => onNavigate('events')}
                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                >
                  <span className="text-xl leading-none">‹</span>
                  Back to Events
                </button>

                <h1 className="text-2xl font-semibold text-black">My Events Dashboard</h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-700 text-sm">{user.email}</span>

                <button
                    onClick={() => onNavigate('my-events')}
                    className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                >
                  My Events
                </button>

                <button
                    onClick={() => onNavigate('my-bookings')}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                >
                  My Bookings
                </button>

                <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-gray-200 text-black rounded font-semibold hover:bg-gray-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 pb-24">
          {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <h2>My Events</h2>

            <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Event
            </button>
          </div>

          <div className="mb-6 bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
            <input
                type="text"
                placeholder="Search my events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No events yet. Create your first event to get started!
              </div>
          ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  {paginatedEvents.map(event => {
                    const soldTickets = getSoldTickets(event);
                    const availableTickets = event.capacity - soldTickets;
                    const isSelected = selectedEventId === String(event.id);
                    const eventBookings = bookingsByEvent[String(event.id)] || [];

                    return (
                        <div
                            key={String(event.id)}
                            className="bg-white rounded-lg shadow"
                        >
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="mb-2">{event.title}</h3>

                                <p className="text-gray-600 text-sm mb-2">
                                  {event.description}
                                </p>

                                <p className="text-gray-500 text-sm">
                                  {new Date(event.dateTime).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => setEditingEvent(event)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                >
                                  Edit
                                </button>

                                <button
                                    onClick={() =>
                                        event.id && handleDeleteEvent(event.id)
                                    }
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-4 mb-4">
                              <div className="flex-1 bg-blue-50 rounded p-3">
                                <p className="text-sm text-gray-600">
                                  Tickets Sold
                                </p>

                                <p className="text-2xl font-semibold text-blue-700">
                                  {soldTickets}
                                </p>
                              </div>

                              <div className="flex-1 bg-green-50 rounded p-3">
                                <p className="text-sm text-gray-600">
                                  Available
                                </p>

                                <p className="text-2xl font-semibold text-green-700">
                                  {availableTickets}
                                </p>
                              </div>

                              <div className="flex-1 bg-gray-50 rounded p-3">
                                <p className="text-sm text-gray-600">
                                  Capacity
                                </p>

                                <p className="text-2xl font-semibold">
                                  {event.capacity}
                                </p>
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                              <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                        event.capacity > 0
                                            ? Math.min(
                                                100,
                                                (soldTickets / event.capacity) * 100
                                            )
                                            : 0
                                    }%`,
                                  }}
                              />
                            </div>

                            <button
                                onClick={() =>
                                    event.id &&
                                    handleToggleAttendees(event.id)
                                }
                                className="text-blue-600 hover:underline text-sm"
                            >
                              {isSelected ? 'Hide' : 'View'} Attendees (
                              {soldTickets})
                            </button>

                            {isSelected && (
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                  <h4 className="text-sm font-semibold mb-2">
                                    Attendee List
                                  </h4>

                                  {eventBookings.length === 0 ? (
                                      <p className="text-sm text-gray-500">
                                        No attendee details available.
                                      </p>
                                  ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {eventBookings.map(booking => (
                                            <div
                                                key={String(booking.id)}
                                                className="flex justify-between items-center text-sm py-2 px-3 bg-gray-50 rounded"
                                            >
                                            <span>
                                              {booking.userEmail ||
                                                  booking.user?.email ||
                                                  booking.user?.username ||
                                                  `User ${
                                                      booking.userId || ''
                                                  }`}
                                            </span>

                                              <span className="text-gray-500">
                                              {new Date(
                                                  booking.bookedAt ||
                                                  booking.createdAt ||
                                                  ''
                                              ).toLocaleDateString()}
                                            </span>
                                            </div>
                                        ))}
                                      </div>
                                  )}
                                </div>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center items-center gap-3">
                  <button
                      onClick={() =>
                          setCurrentPage(page => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                  <button
                      onClick={() =>
                          setCurrentPage(page =>
                              Math.min(totalPages, page + 1)
                          )
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
          )}
        </main>
      </div>
  );
}
