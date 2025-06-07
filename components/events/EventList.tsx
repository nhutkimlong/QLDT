
import React from 'react';
import { Event } from '../../types';
import { EventItem } from './EventItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { CalendarIcon } from '../../constants';


interface EventListProps {
  events: Event[];
  isLoading: boolean;
  error?: string | null;
  onViewEvent: (event: Event) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddNew: () => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  isLoading,
  error,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
  onAddNew
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách sự kiện..." />;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error}</div>;
  }

  if (events.length === 0) {
    return <EmptyState 
        message="Chưa có sự kiện nào được lên kế hoạch. Hãy tạo một sự kiện mới!"
        icon={<CalendarIcon/>}
        actionButton={<button onClick={onAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm Sự kiện Mới</button>}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <EventItem
          key={event.id}
          event={event}
          onView={onViewEvent}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
        />
      ))}
    </div>
  );
};
