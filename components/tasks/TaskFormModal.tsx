
import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, TaskStatus, TaskPriority, Document, Event, UUID, TaskCategory } from '../../types';
// Switch to supabaseService
import { taskApi, documentApi, eventApi } from '../../services/supabaseService'; 
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Select } from '../shared/Select';
import { DateTimePicker } from '../shared/DateTimePicker';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  // Allow pre-filling related IDs, e.g., when creating task from event detail
  initialRelatedEventId?: UUID | null; 
  initialRelatedDocumentId?: UUID | null;
}

const initialFormData: TaskFormData = {
  title: '',
  description: null,
  priority: TaskPriority.TrungBinh,
  status: TaskStatus.MoiTao,
  related_document_id: null,
  related_event_id: null,
  start_date: null,
  due_date: null,
  completion_date: null,
  // estimated_effort_hours: null, // Removed
  // actual_effort_hours: null, // Removed
};

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    taskToEdit,
    initialRelatedEventId,
    initialRelatedDocumentId 
}) => {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (isOpen) {
        documentApi.getAll().then(setAvailableDocuments).catch(e => console.error("Failed to load documents for task form", e));
        eventApi.getAll().then(setAvailableEvents).catch(e => console.error("Failed to load events for task form", e));

        if (taskToEdit) {
            setFormData({
                title: taskToEdit.title,
                description: taskToEdit.description || null,
                related_document_id: taskToEdit.related_document_id || null,
                related_event_id: taskToEdit.related_event_id || null,
                priority: taskToEdit.priority,
                status: taskToEdit.status,
                start_date: taskToEdit.start_date?.substring(0,10) || null,
                due_date: taskToEdit.due_date?.substring(0,10) || null,
                completion_date: taskToEdit.completion_date?.substring(0,10) || null,
                // estimated_effort_hours: taskToEdit.estimated_effort_hours || null, // Removed
                // actual_effort_hours: taskToEdit.actual_effort_hours || null, // Removed
                // task_category: taskToEdit.task_category || null, // Removed
            });
        } else {
            setFormData({
                ...initialFormData,
                related_event_id: initialRelatedEventId || null,
                related_document_id: initialRelatedDocumentId || null,
            });
        }
        setError(null); // Clear previous errors
    }
  }, [taskToEdit, isOpen, initialRelatedEventId, initialRelatedDocumentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | null = value;
    // Removed number conversion as effort_hours are removed
    // if (type === 'number') {
    //   processedValue = value === '' ? null : parseFloat(value);
    // } else 
    if (value === '' && (name === 'description' || name === 'related_document_id' || name === 'related_event_id' || name === 'start_date' || name === 'due_date' || name === 'completion_date')) {
      processedValue = null;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let savedTask: Task | undefined;
      const dataToSave: TaskFormData = {
        ...formData,
        // estimated_effort_hours: formData.estimated_effort_hours ? Number(formData.estimated_effort_hours) : null, // Removed
        // actual_effort_hours: formData.actual_effort_hours ? Number(formData.actual_effort_hours) : null, // Removed
        related_document_id: formData.related_document_id || null,
        related_event_id: formData.related_event_id || null,
      };

      if (taskToEdit && taskToEdit.id !== 'temp-ai') { // temp-ai is for AI suggestions not yet saved
        savedTask = await taskApi.update(taskToEdit.id, dataToSave);
      } else {
        // Ensure required fields are present for creation
        if (!dataToSave.title || !dataToSave.priority || !dataToSave.status) {
            throw new Error("Tiêu đề, độ ưu tiên và trạng thái là bắt buộc.");
        }
        savedTask = await taskApi.create(dataToSave);
      }
      
      if (savedTask) {
        onSave(savedTask);
        onClose();
      } else {
        setError("Không thể lưu công việc. Phản hồi không có dữ liệu.");
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu công việc:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={taskToEdit && taskToEdit.id !== 'temp-ai' ? 'Chỉnh sửa Công việc' : 'Thêm mới Công việc'} size="lg">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        
        <Input label="Tiêu đề" name="title" value={formData.title} onChange={handleChange} required />
        <Textarea label="Mô tả (Tùy chọn)" name="description" value={formData.description || ''} onChange={handleChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select label="Độ ưu tiên" name="priority" value={formData.priority} onChange={handleChange} options={Object.values(TaskPriority).map(p => ({value: p, label: p}))} required />
            <Select label="Trạng thái" name="status" value={formData.status} onChange={handleChange} options={Object.values(TaskStatus).map(s => ({value: s, label: s}))} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select 
                label="Văn bản liên quan (Tùy chọn)" 
                name="related_document_id" 
                value={formData.related_document_id || ''} 
                onChange={handleChange} 
                options={availableDocuments.map(d => ({value: d.id, label: `${d.document_number} - ${d.title}`}))} 
            />
            <Select 
                label="Sự kiện liên quan (Tùy chọn)" 
                name="related_event_id" 
                value={formData.related_event_id || ''} 
                onChange={handleChange} 
                options={availableEvents.map(e => ({value: e.id, label: e.name}))} 
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <DateTimePicker label="Ngày bắt đầu (Tùy chọn)" name="start_date" value={formData.start_date || ''} onChange={handleChange} />
            <DateTimePicker label="Ngày hết hạn (Tùy chọn)" name="due_date" value={formData.due_date || ''} onChange={handleChange} />
            <DateTimePicker label="Ngày hoàn thành (Tùy chọn)" name="completion_date" value={formData.completion_date || ''} onChange={handleChange} />
        </div>

        {/* Removed fields: estimated_effort_hours, actual_effort_hours, task_category, and other specialist fields */}
        {/*
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input type="number" label="Ước tính (giờ)" name="estimated_effort_hours" value={formData.estimated_effort_hours === null ? '' : formData.estimated_effort_hours} onChange={handleChange} min="0" step="0.5" />
            <Input type="number" label="Thực tế (giờ)" name="actual_effort_hours" value={formData.actual_effort_hours === null ? '' : formData.actual_effort_hours} onChange={handleChange} min="0" step="0.5" />
        </div>
        <Select 
            label="Loại hình công việc (Tùy chọn)" 
            name="task_category" 
            value={formData.task_category || ''} 
            onChange={handleChange} 
            options={Object.values(TaskCategory).map(c => ({value: c, label: c}))} 
        />
        */}

        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : (taskToEdit && taskToEdit.id !== 'temp-ai' ? 'Lưu thay đổi' : 'Tạo Công việc')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};