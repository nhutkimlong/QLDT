
import React, { useState, useEffect } from 'react';
import { Event, EventFormData, EventType, EventStatus } from '../../types';
// Switch to supabaseService
import { eventApi } from '../../services/supabaseService'; 
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Select } from '../shared/Select';
import { DateTimePicker } from '../shared/DateTimePicker';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  eventToEdit?: Event | null;
}

const initialFormData: EventFormData = {
  name: '',
  event_type: EventType.HoiNghi,
  description: null,
  start_datetime: new Date().toISOString().substring(0,16),
  end_datetime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().substring(0,16), // Default to 1 hour later
  location: null,
  status: EventStatus.DaLenKeHoach,
  // budget: null, // Removed
  organizer: null,
  // expected_attendees: null, // Removed
  // actual_attendees: null, // Removed
  // coordinating_units: null, // Removed
  // target_audience: null, // Removed
  // funding_source: null, // Removed
  // key_stakeholders: null, // Removed
  // media_contact_person: null, // Removed
  // post_event_report_doc_id: null, // Removed
};

export const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSave, eventToEdit }) => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (eventToEdit) {
        setFormData({
            name: eventToEdit.name,
            event_type: eventToEdit.event_type,
            description: eventToEdit.description || null,
            start_datetime: eventToEdit.start_datetime.substring(0,16), 
            end_datetime: eventToEdit.end_datetime.substring(0,16),
            location: eventToEdit.location || null,
            status: eventToEdit.status,
            // budget: eventToEdit.budget || null, // Removed
            organizer: eventToEdit.organizer || null,
            // expected_attendees: eventToEdit.expected_attendees || null, // Removed
            // actual_attendees: eventToEdit.actual_attendees || null, // Removed
            // coordinating_units: eventToEdit.coordinating_units || null, // Removed
            // target_audience: eventToEdit.target_audience || null, // Removed
            // funding_source: eventToEdit.funding_source || null, // Removed
            // key_stakeholders: eventToEdit.key_stakeholders || null, // Removed
            // media_contact_person: eventToEdit.media_contact_person || null, // Removed
            // post_event_report_doc_id: eventToEdit.post_event_report_doc_id || null, // Removed
        });
        } else {
        setFormData(initialFormData);
        }
        setError(null);
    }
  }, [eventToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | null = value;
    // Removed budget number conversion
    // if (type === 'number') {
    //   processedValue = value === '' ? null : parseFloat(value);
    // } else 
    if (value === '' && (name === 'description' || name === 'location' || name === 'organizer')) {
      processedValue = null;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let savedEvent: Event | undefined;
      const dataToSave: EventFormData = {
        ...formData,
        // budget: formData.budget ? Number(formData.budget) : null, // Removed
      };

      // Ensure required fields are present for creation/update
      if (!dataToSave.name || !dataToSave.event_type || !dataToSave.start_datetime || !dataToSave.end_datetime || !dataToSave.status) {
        throw new Error("Tên, loại, thời gian bắt đầu/kết thúc, và trạng thái là bắt buộc.");
      }

      if (eventToEdit) {
        savedEvent = await eventApi.update(eventToEdit.id, dataToSave);
      } else {
        savedEvent = await eventApi.create(dataToSave);
      }
      
      if (savedEvent) {
        onSave(savedEvent);
        onClose();
      } else {
        setError("Không thể lưu sự kiện. Phản hồi không có dữ liệu.");
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu sự kiện:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventToEdit ? 'Chỉnh sửa Sự kiện' : 'Thêm mới Sự kiện'} size="lg">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        
        <Input label="Tên sự kiện" name="name" value={formData.name} onChange={handleChange} required />
        <Select label="Loại sự kiện" name="event_type" value={formData.event_type} onChange={handleChange} options={Object.values(EventType).map(t => ({value: t, label: t}))} required />
        <Textarea label="Mô tả (Tùy chọn)" name="description" value={formData.description || ''} onChange={handleChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DateTimePicker label="Thời gian bắt đầu" name="start_datetime" value={formData.start_datetime} onChange={handleChange} isDateTime required />
            <DateTimePicker label="Thời gian kết thúc" name="end_datetime" value={formData.end_datetime} onChange={handleChange} isDateTime required />
        </div>
        
        <Input label="Địa điểm (Tùy chọn)" name="location" value={formData.location || ''} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select label="Trạng thái" name="status" value={formData.status} onChange={handleChange} options={Object.values(EventStatus).map(s => ({value: s, label: s}))} required />
            {/* <Input type="number" label="Ngân sách (VNĐ - Tùy chọn)" name="budget" value={formData.budget === null ? '' : formData.budget} onChange={handleChange} min="0" /> Removed */}
        </div>
        <Input label="Đơn vị tổ chức (Tùy chọn)" name="organizer" value={formData.organizer || ''} onChange={handleChange} />

        {/* Other detailed fields removed */}

        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : (eventToEdit ? 'Lưu thay đổi' : 'Tạo Sự kiện')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};