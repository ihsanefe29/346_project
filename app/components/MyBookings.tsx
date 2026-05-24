'use client';

import { useEffect, useState } from 'react';
import { Event } from './EventForm';

interface Booking {
  id: string | number;
  eventId: string | number;
  userId?: string | number;
  bookedAt?: string;
  createdAt?: string;
  event?: Event;
}

interface MyBookingsProps {
  user: { id: string; email: string; role: 'organiser' | 'organizer' | 'attendee' | 'ORGANIZER' | 'ATTENDEE'; };
  onNavigate: (page: 'events' | 'my-events' | 'my-bookings') => void;
  onLogout: () => void;
}

function getSoldTickets(event: Event) {
  return event._count?.bookings ?? event.ticketsSold ?? event.bookings?.length ?? 0;
}

function formatError(data: any, fallback: string) {
  return data?.error || data?.message || fallback;
}

const ITEMS_PER_PAGE = 4;

export default function MyBookings({ user, onNavigate, onLogout }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  const fetchAll = async () => {
    await Promise.all([fetchBookings(), fetchEvents()]);
  };

  const fetchBookings = async () => {
    try {

      const response = await fetch('/api/bookings', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(formatError(data, 'Failed to load bookings'));

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setBookings([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (!response.ok) throw new Error(formatError(data, 'Failed to load events'));

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  };

  const getEventForBooking = (booking: Booking) => {
    if (booking.event) return booking.event;
    return events.find(event => String(event.id) === String(booking.eventId));
  };

  const filteredBookings = bookings.filter(booking => {
    const event = getEventForBooking(booking);
    const search = searchTerm.toLowerCase();

    const matchesSearch =
        (event?.title || '').toLowerCase().includes(search) ||
        (event?.description || '').toLowerCase().includes(search) ||
        String(booking.id).toLowerCase().includes(search);

    const dateValue = event?.dateTime;
    const eventDate = dateValue ? new Date(dateValue) : null;
    const now = new Date();

    const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' && eventDate !== null && eventDate >= now) ||
        (filter === 'past' && eventDate !== null && eventDate < now);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCancelBooking = async (bookingId: string | number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setError('');
    setLoading(String(bookingId));

    try {

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) throw new Error(formatError(data, 'Cancellation failed'));

      const cancelledBooking = bookings.find(b => String(b.id) === String(bookingId));
      setBookings(prev => prev.filter(b => String(b.id) !== String(bookingId)));

      if (cancelledBooking) {
        setEvents(prev =>
            prev.map(event =>
                String(event.id) === String(cancelledBooking.eventId)
                    ? { ...event, ticketsSold: Math.max(0, getSoldTickets(event) - 1) }
                    : event
            )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setLoading(null);
    }
  };

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

                <h1 className="text-2xl font-semibold text-black">My Bookings</h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-700 text-sm">{user.email}</span>

                {(user.role === 'ORGANIZER' || user.role === 'organizer' || user.role === 'organiser') && (
                    <button onClick={() => onNavigate('my-events')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      My Events
                    </button>
                )}

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

        <main className="max-w-7xl mx-auto p-4">
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

          <div className="mb-6 bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
            <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {bookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                You have no bookings yet.
              </div>
          ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No bookings found.
              </div>
          ) : (
              <>
                <div className="grid gap-4 min-h-[520px]">
                  {paginatedBookings.map(booking => {
                    const event = getEventForBooking(booking);
                    const isCancelling = loading === String(booking.id);
                    const dateValue = event?.dateTime;
                    const isPastEvent = dateValue ? new Date(dateValue) < new Date() : false;

                    return (
                        <div key={String(booking.id)} className="bg-white rounded-lg shadow p-6">
                          <div className="flex justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="mb-2">{event?.title || `Event #${booking.eventId}`}</h3>
                              {event?.description && <p className="text-gray-600 mb-3">{event.description}</p>}
                              {dateValue && (
                                  <p className="text-sm text-gray-700 mb-3">
                                    {new Date(dateValue).toLocaleString()}
                                  </p>
                              )}
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                <p><span className="font-semibold">Booking ID:</span> {booking.id}</p>
                                <p><span className="font-semibold">Booked at:</span> {new Date(booking.bookedAt || booking.createdAt || '').toLocaleString()}</p>
                              </div>
                            </div>

                            {!isPastEvent && (
                                <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={isCancelling}
                                    className="self-start px-6 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center items-center gap-3">
                  <button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                  <button
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
