

import React, { useState, useEffect, useCallback } from 'react';
import { Event, UUID, Task } from '../../types'; 
// Switch to supabaseService
import { eventApi, taskApi } from '../../services/supabaseService'; 
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { TaskList } from '../tasks/TaskList'; 
import { TaskFormModal } from '../tasks/TaskFormModal'; 
import { useToggle } from '../../hooks/useToggle';
import { PlusIcon } from '../../constants';
import { TaskDetailView } from '../tasks/TaskDetailView'; // For viewing task details
import { Modal } from '../shared/Modal'; // Import Modal

interface EventDetailViewProps {
  eventId: UUID;
  onClose: () => void;
  onEventUpdate: (updatedEvent: Event) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, onClose, onEventUpdate }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTaskFormOpen, toggleTaskForm, setTaskFormOpen] = useToggle(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewingTaskIdFromEvent, setViewingTaskIdFromEvent] = useState<UUID | null>(null); // Renamed to avoid conflict


  const fetchEventDetailsAndTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvent = await eventApi.getById(eventId);
      if (fetchedEvent) {
        setEvent(fetchedEvent);
        const allTasks = await taskApi.getAll(); 
        setRelatedTasks(allTasks.filter(task => task.related_event_id === eventId));
      } else {
        setError("Không tìm thấy sự kiện.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết sự kiện:", err);
      setError(err.message || "Không thể tải chi tiết sự kiện.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetailsAndTasks();
  }, [fetchEventDetailsAndTasks]);

  const handleTaskSave = (savedTask: Task) => {
    fetchEventDetailsAndTasks(); 
    setTaskFormOpen(false);
    setTaskToEdit(null);
    if (viewingTaskIdFromEvent === savedTask.id) setViewingTaskIdFromEvent(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskFormOpen(true);
  };
  
  const handleDeleteTask = async (taskId: UUID) => {
    try {
      await taskApi.delete(taskId);
      fetchEventDetailsAndTasks(); 
      if (viewingTaskIdFromEvent === taskId) setViewingTaskIdFromEvent(null);
    } catch (e: any) {
      alert(`Không thể xóa công việc: ${e.message || String(e)}`);
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTaskIdFromEvent(task.id);
  };


  if (isLoading) return <div className="p-4"><LoadingSpinner message="Đang tải chi tiết sự kiện..." /></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error} <Button onClick={onClose}>Đóng</Button></div>;
  if (!event) return <div className="p-4 text-center">Không tìm thấy sự kiện. <Button onClick={onClose}>Đóng</Button></div>;

  const detailItem = (label: string, value?: string | number | null) => {
    let displayValue: React.ReactNode = value; 
    
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        displayValue = <span className="text-gray-400">N/A</span>;
    }
    
    return (
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{displayValue}</dd>
      </div>
    );
  };

  return (
    <>
    <div className="bg-white rounded-lg p-6 md:p-4"> 

      <dl className="divide-y divide-gray-200">
        {detailItem("Loại sự kiện", event.event_type)}
        {detailItem("Mô tả", event.description)}
        {detailItem("Thời gian bắt đầu", new Date(event.start_datetime).toLocaleString('vi-VN'))}
        {detailItem("Thời gian kết thúc", new Date(event.end_datetime).toLocaleString('vi-VN'))}
        {detailItem("Địa điểm", event.location)}
        {detailItem("Trạng thái", event.status)}
        {/* {detailItem("Ngân sách", event.budget ? event.budget.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : null)} Removed */}
        {detailItem("Đơn vị tổ chức", event.organizer)}
        {/* {detailItem("Số lượng khách dự kiến", event.expected_attendees)} Removed */}
        {/* {detailItem("Số lượng khách thực tế", event.actual_attendees)} Removed */}
        {/* {detailItem("Đơn vị phối hợp", event.coordinating_units)} Removed */}
        {/* {detailItem("Đối tượng tham dự", event.target_audience)} Removed */}
        {/* {detailItem("Nguồn kinh phí", event.funding_source)} Removed */}
        {/* {detailItem("Bên liên quan chính", event.key_stakeholders)} Removed */}
        {/* {detailItem("Người liên hệ báo chí", event.media_contact_person)} Removed */}
        {/* {detailItem("Tài liệu báo cáo sự kiện (ID)", event.post_event_report_doc_id)} Removed */}
        {detailItem("Ngày tạo", event.created_at ? new Date(event.created_at).toLocaleString('vi-VN') : null)}
        {detailItem("Cập nhật lần cuối", event.updated_at ? new Date(event.updated_at).toLocaleString('vi-VN') : null)}
      </dl>

      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Công việc Liên quan</h3>
            <Button 
                onClick={() => { setTaskToEdit(null); setTaskFormOpen(true); }} 
                size="sm" 
                leftIcon={<PlusIcon />}
            >
                Thêm Công việc cho Sự kiện
            </Button>
        </div>
        {relatedTasks.length > 0 ? (
            <TaskList
            tasks={relatedTasks}
            isLoading={false} 
            onViewTask={handleViewTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onAddNew={() => { /* This button is above, not needed in TaskList here */ }} 
            />
        ) : (
            <p className="text-gray-500">Chưa có công việc nào liên quan đến sự kiện này.</p>
        )}
      </div>
      
    </div>
    {isTaskFormOpen && (
        <TaskFormModal
          isOpen={isTaskFormOpen}
          onClose={() => { setTaskFormOpen(false); setTaskToEdit(null); }}
          onSave={handleTaskSave}
          taskToEdit={taskToEdit}
          initialRelatedEventId={event.id} // Pre-fill event ID
        />
      )}
      {viewingTaskIdFromEvent && (
        <Modal isOpen={!!viewingTaskIdFromEvent} onClose={() => setViewingTaskIdFromEvent(null)} title="Chi tiết Công việc Liên quan" size="lg">
            <TaskDetailView taskId={viewingTaskIdFromEvent} onClose={() => setViewingTaskIdFromEvent(null)} />
        </Modal>
      )}
    </>
  );
};