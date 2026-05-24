'use client';

import { useEffect, useMemo, useState } from 'react';
import { Event } from './EventForm';

interface Booking {
  id: string | number;
  eventId: string | number;
  userId?: string | number;
  bookedAt?: string;
  createdAt?: string;
}

interface EventsPageProps {
  user: {
    id: string;
    email: string;
    role: 'organiser' | 'organizer' | 'attendee' | 'ORGANIZER' | 'ATTENDEE';
  };
  onNavigate: (page: 'events' | 'my-events' | 'my-bookings') => void;
  onLogout: () => void;
}

function getSoldTickets(event: Event) {
  return event._count?.bookings ?? event.ticketsSold ?? event.bookings?.length ?? 0;
}

function formatError(data: any, fallback: string) {
  return data?.error || data?.message || fallback;
}

export default function EventsPage({ user, onNavigate, onLogout }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchMyBookings();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (!response.ok) {
        setEvents([]);
        throw new Error(formatError(data, 'Failed to load events'));
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  const fetchMyBookings = async () => {
    try {

      const response = await fetch('/api/bookings', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        setBookings([]);
        return;
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setBookings([]);
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    const now = new Date();

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }

    if (filterDate === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.dateTime) >= now);
    } else if (filterDate === 'past') {
      filtered = filtered.filter(event => new Date(event.dateTime) < now);
    }

    return filtered;
  }, [events, searchTerm, filterDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, itemsPerPage]);

  const hasBooked = (eventId: string | number) => {
    return bookings.some(booking => String(booking.eventId) === String(eventId));
  };

  const handleBookTicket = async (event: Event) => {
    setError('');
    setLoading(String(event.id));

    try {
      if (!event.id) throw new Error('Invalid event');

      const soldTickets = getSoldTickets(event);
      if (soldTickets >= event.capacity) throw new Error('Event is fully booked');
      if (hasBooked(event.id)) throw new Error('You have already booked this event');

      const response = await fetch(`/api/events/${event.id}/bookings`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(formatError(data, 'Booking failed'));

      setBookings(prev => [...prev, data]);
      setEvents(prev =>
          prev.map(e => {
            if (String(e.id) !== String(event.id)) return e;

            const newSoldTickets = getSoldTickets(e) + 1;

            return {
              ...e,
              ticketsSold: newSoldTickets,
              _count: {
                ...e._count,
                bookings: newSoldTickets,
              },
            };
          })
      );

      await fetchMyBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1  className="text-2xl font-semibold text-black">
              Event Booking Platform
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 text-sm">{user.email}</span>
              {(user.role === 'ORGANIZER' || user.role === 'organizer' || user.role === 'organiser') && (
                <button onClick={() => onNavigate('my-events')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  My Events
                </button>
              )}
              <button onClick={() => onNavigate('my-bookings')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                My Bookings
              </button>
              <button onClick={onLogout} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search events by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value as 'all' | 'upcoming' | 'past')}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="6">6 per page</option>
              <option value="12">12 per page</option>
              <option value="18">18 per page</option>
            </select>
          </div>
        </div>

        <div className="mb-4 text-gray-600">
          Showing {filteredEvents.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEvents.length)} of {filteredEvents.length} events
        </div>

        {currentEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No events found matching your criteria.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentEvents.map(event => {
              const soldTickets = getSoldTickets(event);
              const availableTickets = event.capacity - soldTickets;
              const isSoldOut = availableTickets <= 0;
              const isBooked = event.id !== undefined && hasBooked(event.id);
              const isBooking = loading === String(event.id);
              const isPastEvent = new Date(event.dateTime) < new Date();

              return (
                <div key={String(event.id)} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <h3 className="mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

                    <div className="space-y-2 mb-4 text-sm text-gray-700">
                      <div>{new Date(event.dateTime).toLocaleDateString()}</div>
                      <div>{new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tickets</span>
                        <span className={isSoldOut ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          {isSoldOut ? 'Sold Out' : `${availableTickets} / ${event.capacity} available`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${event.capacity > 0 ? Math.max(0, Math.min(100, (availableTickets / event.capacity) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>

                    {isBooked ? (
                      <div className="flex items-center justify-center px-3 py-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        Already Booked
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBookTicket(event)}
                        disabled={isSoldOut || isBooking || isPastEvent}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isBooking ? 'Booking...' : isPastEvent ? 'Event Ended' : isSoldOut ? 'Sold Out' : 'Book Ticket'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
