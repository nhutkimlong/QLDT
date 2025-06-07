
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { EditIcon, TrashIcon, EyeIcon, DocumentTextIcon, CalendarIcon } from '../../constants';
import { Button } from '../shared/Button';

interface TaskItemProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.MoiTao: return 'bg-blue-100 text-blue-800';
    case TaskStatus.DangThucHien: return 'bg-yellow-100 text-yellow-800';
    case TaskStatus.TamDung: return 'bg-orange-100 text-orange-800';
    case TaskStatus.HoanThanh: return 'bg-green-100 text-green-800';
    case TaskStatus.HuyBo: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const getPriorityClass = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.KhanCap: return 'border-red-500 text-red-700';
    case TaskPriority.Cao: return 'border-orange-500 text-orange-700';
    case TaskPriority.TrungBinh: return 'border-yellow-500 text-yellow-700';
    case TaskPriority.Thap: return 'border-green-500 text-green-700';
    default: return 'border-gray-300 text-gray-700';
  }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onView, onEdit, onDelete }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 border-l-4 ${getPriorityClass(task.priority)} flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3
            className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer truncate"
            onClick={() => onView(task)}
            title={task.title}
          >
            {task.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>
        {task.description && <p className="text-sm text-gray-600 mb-2 truncate" title={task.description}>{task.description}</p>}

        <div className="text-xs text-gray-500 space-y-1">
            {task.due_date && <p><strong>Hạn chót:</strong> {new Date(task.due_date).toLocaleDateString('vi-VN')}</p>}
            <p><strong>Ưu tiên:</strong> {task.priority}</p>
            {task.related_document_title && (
                <p className="flex items-center truncate" title={task.related_document_title}><DocumentTextIcon/> <span className="ml-1">VB: {task.related_document_title}</span></p>
            )}
            {task.related_event_name && (
                <p className="flex items-center truncate" title={task.related_event_name}><CalendarIcon/> <span className="ml-1">SK: {task.related_event_name}</span></p>
            )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(task)} title="Xem chi tiết"><EyeIcon /></Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)} title="Chỉnh sửa công việc"><EditIcon /></Button>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                onDelete(task.id);
              }
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Xóa công việc"
        >
            <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
