
import React, { useState, useEffect, useCallback } from 'react';
import { Task, UUID } from '../../types';
// Switch to supabaseService
import { taskApi } from '../../services/supabaseService'; 
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TaskDetailViewProps {
  taskId: UUID;
  onClose: () => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({ taskId, onClose }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTask = await taskApi.getById(taskId);
      if (fetchedTask) {
        setTask(fetchedTask);
      } else {
        setError("Không tìm thấy công việc.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết công việc:", err);
      setError(err.message || "Không thể tải chi tiết công việc.");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  if (isLoading) return <div className="p-4"><LoadingSpinner message="Đang tải chi tiết công việc..." /></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error} <Button onClick={onClose}>Đóng</Button></div>;
  if (!task) return <div className="p-4 text-center">Không tìm thấy công việc. <Button onClick={onClose}>Đóng</Button></div>;

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
    <div className="bg-white rounded-lg p-6 md:p-4"> 
      <dl className="divide-y divide-gray-200">
        {detailItem("Mô tả", task.description)}
        {detailItem("Độ ưu tiên", task.priority)}
        {detailItem("Trạng thái", task.status)}
        {detailItem("Ngày bắt đầu", task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN') : null)}
        {detailItem("Ngày hết hạn", task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : null)}
        {detailItem("Ngày hoàn thành", task.completion_date ? new Date(task.completion_date).toLocaleDateString('vi-VN') : null)}
        {detailItem("Văn bản liên quan", task.related_document_title)}
        {detailItem("Sự kiện liên quan", task.related_event_name)}
        {/* {detailItem("Ước tính (giờ)", task.estimated_effort_hours)} Removed */}
        {/* {detailItem("Thực tế (giờ)", task.actual_effort_hours)} Removed */}
        {/* {detailItem("Loại hình công việc", task.task_category)} Removed */}
        {/* {detailItem("Đơn vị chịu trách nhiệm", task.department_responsible)} Removed */}
        {/* {detailItem("Đơn vị phối hợp", task.coordinating_departments)} Removed */}
        {/* {detailItem("Đối tượng kiểm tra", task.inspection_target)} Removed */}
        {/* {detailItem("Giai đoạn tu bổ", task.restoration_phase)} Removed */}
        {/* {detailItem("Tên đối tượng giám sát", task.monitored_entity_name)} Removed */}
        {/* {detailItem("Phạm vi kiểm kê", task.inventory_scope)} Removed */}
        {detailItem("Ngày tạo", task.created_at ? new Date(task.created_at).toLocaleString('vi-VN') : null)}
        {detailItem("Cập nhật lần cuối", task.updated_at ? new Date(task.updated_at).toLocaleString('vi-VN') : null)}
      </dl>
    </div>
  );
};