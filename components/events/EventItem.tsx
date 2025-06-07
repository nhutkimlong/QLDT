import React from 'react';
import { Event, EventStatus } from '../../types';
import { EditIcon, TrashIcon, EyeIcon, CalendarIcon as LocationIcon } from '../../constants'; // Renaming for clarity
import { Button } from '../shared/Button';

interface EventItemProps {
  event: Event;
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

const getStatusColor = (status: EventStatus): string => {
  switch (status) {
    case EventStatus.DaLenKeHoach: return 'bg-blue-100 text-blue-800';
    case EventStatus.DangChuanBi: return 'bg-yellow-100 text-yellow-800';
    case EventStatus.DangDienRa: return 'bg-purple-100 text-purple-800';
    case EventStatus.HoanThanh: return 'bg-green-100 text-green-800';
    case EventStatus.HuyBo: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

export const EventItem: React.FC<EventItemProps> = ({ event, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-semibold text-indigo-700 hover:underline cursor-pointer truncate" 
            onClick={() => onView(event)}
            title={event.name}
          >
            {event.name}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Loại:</span> {event.event_type}
        </p>
        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium">Thời gian:</span> {new Date(event.start_datetime).toLocaleString('vi-VN')} - {new Date(event.end_datetime).toLocaleString('vi-VN')}
        </p>
        {event.location && (
          <p className="text-sm text-gray-500 mb-2 flex items-center truncate" title={event.location}>
            <LocationIcon /> <span className="ml-1">{event.location}</span>
          </p>
        )}
        {event.organizer && <p className="text-xs text-gray-500 truncate" title={event.organizer}>Đơn vị tổ chức: {event.organizer}</p>}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(event)} title="Xem chi tiết"><EyeIcon /></Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(event)} title="Chỉnh sửa sự kiện"><EditIcon /></Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
                onDelete(event.id);
              }
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Xóa sự kiện"
        >
            <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
