'use client';

import { useState, useEffect } from 'react';

export interface Event {
  id?: string | number;
  title: string;
  description: string;
  dateTime: string;
  capacity: number;
  organizerId?: string | number;
  ticketsSold?: number;
  _count?: {
    bookings?: number;
  };
  bookings?: unknown[];
}

export type EventFormData = {
  title: string;
  description: string;
  dateTime: string;
  capacity: number;
};

interface EventFormProps {
  event?: Event;
  onSave: (event: EventFormData) => Promise<void> | void;
  onCancel: () => void;
}

function formatDateTimeForInput(value: string) {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 16);
}

function getTicketsSold(event?: Event) {
  return event?._count?.bookings ?? event?.ticketsSold ?? event?.bookings?.length ?? 0;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [dateTime, setDateTime] = useState(event?.dateTime ? formatDateTimeForInput(event.dateTime) : '');
  const [capacity, setCapacity] = useState(event?.capacity?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDateTime(formatDateTimeForInput(event.dateTime));
      setCapacity(event.capacity.toString());
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const capacityNum = Number(capacity);
      const ticketsSold = getTicketsSold(event);

      if (!title.trim()) throw new Error('Event title is required');
      if (!description.trim()) throw new Error('Description is required');
      if (!dateTime) throw new Error('Date and time are required');
      if (!Number.isInteger(capacityNum) || capacityNum < 1) {
        throw new Error('Capacity must be a positive number');
      }
      if (event && capacityNum < ticketsSold) {
        throw new Error(`Capacity cannot be less than tickets already sold (${ticketsSold})`);
      }

      await onSave({
        title: title.trim(),
        description: description.trim(),
        dateTime,
        capacity: capacityNum,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const ticketsSold = getTicketsSold(event);

  return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          {event ? 'Edit Event' : 'Create Event'}
        </h2>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-700">
              Event Title
            </label>
            <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event description"
            />
          </div>

          <div>
            <label htmlFor="dateTime" className="block mb-1 text-sm font-medium text-gray-700">
              Date & Time
            </label>
            <input
                id="dateTime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block mb-1 text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Maximum number of attendees"
            />

            {event && ticketsSold > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {ticketsSold} ticket{ticketsSold !== 1 ? 's' : ''} already sold
                </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? (event ? 'Updating...' : 'Creating...') : event ? 'Update Event' : 'Create Event'}
            </button>
            <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
  );
}
