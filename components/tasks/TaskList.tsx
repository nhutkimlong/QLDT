
import React from 'react';
import { Task } from '../../types';
import { TaskItem } from './TaskItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { ClipboardListIcon } from '../../constants';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  error?: string | null;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddNew: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  error,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onAddNew
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách công việc..." />;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error}</div>;
  }

  if (tasks.length === 0) {
    return <EmptyState 
        message="Chưa có công việc nào. Hãy tạo một công việc để bắt đầu!"
        icon={<ClipboardListIcon/>}
        actionButton={<button onClick={onAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm Công việc Mới</button>}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onView={onViewTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
};
