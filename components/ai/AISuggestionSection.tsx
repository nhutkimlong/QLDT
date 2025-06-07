import React, { useState, useEffect, useCallback } from 'react';
import { AISuggestedTask, TaskFormData, TaskPriority, Document, Task, Event, TaskStatus, DocumentStatus, EventStatus, UUID } from '../../types';
import { geminiService } from '../../services/geminiService';
// Switch to supabaseService
import { documentApi, taskApi, eventApi } from '../../services/supabaseService'; 
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SparklesIcon, PlusIcon } from '../../constants';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { useToggle } from '../../hooks/useToggle';

interface AISuggestionSectionProps {
  onTaskCreated: (newTask: Task) => void; 
}

export const AISuggestionSection: React.FC<AISuggestionSectionProps> = ({ onTaskCreated }) => {
  const [suggestions, setSuggestions] = useState<AISuggestedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isTaskFormOpen, toggleTaskForm, setTaskFormOpen] = useToggle(false);
  // Store the full AISuggestedTask to prefill form, including potential related_document_id
  const [suggestionToCreateFrom, setSuggestionToCreateFrom] = useState<AISuggestedTask | null>(null);


  const fetchSuggestions = useCallback(async () => {
    if (!geminiService.isAvailable()) {
      setError("Gemini API chưa sẵn sàng. Vui lòng cấu hình API Key.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch context data using supabaseService
      const allDocs = await documentApi.getAll();
      const allTasks = await taskApi.getAll();
      const allEvents = await eventApi.getAll();

      const activeDocs = allDocs.filter(d => d.status === DocumentStatus.DangXuLy || d.status === DocumentStatus.ChoPhanHoi);
      const activeTasks = allTasks.filter(t => t.status === TaskStatus.MoiTao || t.status === TaskStatus.DangThucHien);
      const upcomingEvents = allEvents.filter(e => new Date(e.start_datetime) > new Date() && e.status !== EventStatus.HuyBo && e.status !== EventStatus.HoanThanh);
      
      const result = await geminiService.generateWeeklyTaskSuggestions(activeDocs, activeTasks, upcomingEvents);
      if (typeof result === 'string') {
        setError(result);
        setSuggestions([]);
      } else {
        setSuggestions(result);
      }
    } catch (err: any) {
      console.error("Lỗi khi lấy gợi ý từ AI:", err);
      setError(err.message || "Không thể lấy gợi ý.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect(() => {
    // Fetch on mount if desired, or rely on button click
    // fetchSuggestions();
  // }, [fetchSuggestions]); // Ensure fetchSuggestions is stable or remove from deps if only button-triggered

  const handleCreateTaskFromSuggestion = (suggestedTask: AISuggestedTask) => {
    setSuggestionToCreateFrom(suggestedTask);
    setTaskFormOpen(true);
  };

  const handleTaskSavedFromSuggestion = (newTask: Task) => {
    onTaskCreated(newTask); 
    setTaskFormOpen(false);
    setSuggestionToCreateFrom(null);
    setSuggestions(prev => prev.filter(s => s.title !== newTask.title));
  };
  
  // Prepare a TaskFormData object from AISuggestedTask for the modal
  let taskToEditForModal: Task | null = null;
  if (suggestionToCreateFrom) {
    taskToEditForModal = {
        id: 'temp-ai', // Temporary ID, TaskFormModal handles this for new tasks
        title: suggestionToCreateFrom.title,
        description: suggestionToCreateFrom.description || '',
        priority: suggestionToCreateFrom.priority || TaskPriority.TrungBinh,
        due_date: suggestionToCreateFrom.due_date,
        status: TaskStatus.MoiTao, // Default status for new tasks
        related_document_id: suggestionToCreateFrom.related_document_id,
        // Other Task fields default to undefined or initial values in TaskFormModal
        user_id: '' // Will be set by supabaseService on creation
    } as Task; // Cast as Task, TaskFormModal will treat it as partial for new
  }

  // Hàm lấy màu theo mức độ ưu tiên
  const getPriorityColor = (priority?: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'khẩn cấp': return 'border-red-500 bg-red-50 text-red-700';
      case 'cao': return 'border-orange-400 bg-orange-50 text-orange-700';
      case 'trung bình': return 'border-blue-400 bg-blue-50 text-blue-700';
      case 'thấp': return 'border-gray-300 bg-gray-50 text-gray-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <SparklesIcon /> <span className="ml-2">Gợi ý Công việc Hàng tuần từ AI</span>
        </h2>
        <Button onClick={fetchSuggestions} disabled={isLoading || !geminiService.isAvailable()} variant="primary">
          {isLoading ? <LoadingSpinner size="sm" message="Đang tạo..." /> : 'Nhận Gợi ý'}
        </Button>
      </div>

      {!geminiService.isAvailable() && <p className="text-orange-600 bg-orange-100 p-3 rounded-md">API Key của Gemini chưa được cấu hình. Tính năng AI bị vô hiệu hóa.</p>}
      
      {isLoading && <LoadingSpinner message="AI đang suy nghĩ..." />}
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {!isLoading && !error && suggestions.length === 0 && geminiService.isAvailable() && (
        <p className="text-gray-600">Không có gợi ý nào. Hãy thử tạo gợi ý mới!</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4 mt-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 border-l-4 rounded-md shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-md">{suggestion.title}</h4>
                {suggestion.priority && (
                  <span className="ml-2 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide" style={{whiteSpace: 'nowrap'}}>
                    {suggestion.priority}
                  </span>
                )}
              </div>
              {suggestion.description && <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>}
              <div className="text-xs text-gray-500 mt-2 space-x-4">
                {suggestion.due_date && <span><strong>Hạn chót:</strong> {new Date(suggestion.due_date).toLocaleDateString('vi-VN')}</span>}
                {suggestion.related_document_id && <span><strong>VB liên quan ID:</strong> {suggestion.related_document_id.substring(0,8)}...</span>}
              </div>
              <div className="mt-3 text-right">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleCreateTaskFromSuggestion(suggestion)}
                  leftIcon={<PlusIcon />}
                  className="text-green-600 hover:bg-green-100"
                >
                  Tạo Công việc
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTaskFormOpen && suggestionToCreateFrom && (
        <TaskFormModal
          isOpen={isTaskFormOpen}
          onClose={() => { setTaskFormOpen(false); setSuggestionToCreateFrom(null);}}
          onSave={handleTaskSavedFromSuggestion}
          taskToEdit={taskToEditForModal} // Pass the prepared Task-like object
          initialRelatedDocumentId={suggestionToCreateFrom.related_document_id}
        />
      )}
    </div>
  );
};
