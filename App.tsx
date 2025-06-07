import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { Layout } from './components/layout/Layout';
import { PageTitle } from './components/shared/PageTitle';
import { Button } from './components/shared/Button';
import { PlusIcon, SparklesIcon, DocumentTextIcon, ClipboardListIcon, CalendarIcon, RelicSiteIcon, BookOpenIcon, CalendarDaysIcon } from './constants'; // Added CalendarDaysIcon
import { AuthPage } from './components/auth/AuthPage';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { Modal } from './components/shared/Modal'; 

// Import types
import { Document, Task, Event, Relic, TourismDocument, UUID, DocumentStatus, DocumentType, Priority, TaskPriority, TaskStatus as AppTaskStatus } from './types'; 

// Import API services
import { documentApi, taskApi, eventApi, relicApi, tourismDocumentApi } from './services/supabaseService'; 

// Import Modals & Detail Views
import { DocumentFormModal } from './components/documents/DocumentFormModal';
import { DocumentDetailView } from './components/documents/DocumentDetailView';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { TaskDetailView } from './components/tasks/TaskDetailView';
import { EventFormModal } from './components/events/EventFormModal';
import { EventDetailView } from './components/events/EventDetailView';
import { RelicFormModal } from './components/relics/RelicFormModal';
import { RelicDetailView } from './components/relics/RelicDetailView';
import { TourismDocumentFormModal } from './components/tourismDocuments/TourismDocumentFormModal';
import { TourismDocumentDetailView } from './components/tourismDocuments/TourismDocumentDetailView';
import { DocumentViewerModal } from './components/shared/DocumentViewerModal';


// Import List Components
import { DocumentList } from './components/documents/DocumentList';
import { TaskList } from './components/tasks/TaskList';
import { EventList } from './components/events/EventList';
import { RelicList } from './components/relics/RelicList';
import { TourismDocumentList } from './components/tourismDocuments/TourismDocumentList';

// Import AI Components
import { AISuggestionSection } from './components/ai/AISuggestionSection';

// Custom Hooks
import { useToggle } from './hooks/useToggle';

interface UpcomingDashboardItem {
  id: UUID;
  title: string;
  type: 'task' | 'document';
  dueDate: string; 
  relativeDueDate: string; 
  priorityColorClass: string; 
  isOverdue: boolean;
  rawDueDate: Date;
  onViewClick: () => void;
}

const formatRelativeDueDate = (dateString: string | null | undefined): { text: string; isOverdue: boolean; daysDiff: number } => {
    if (!dateString) return { text: 'Không có hạn', isOverdue: false, daysDiff: Infinity };

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    dueDate.setHours(23, 59, 59, 999); // End of due date

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let text = '';
    const isOverdue = diffDays < 0;

    if (isOverdue) {
        text = `Quá hạn ${Math.abs(diffDays)} ngày`;
    } else if (diffDays === 0) {
        text = 'Hạn: Hôm nay';
    } else if (diffDays === 1) {
        text = 'Hạn: Ngày mai';
    } else if (diffDays <= 7) {
        text = `Hạn: ${diffDays} ngày nữa`;
    } else if (diffDays <= 14) {
        text = 'Hạn: Tuần tới';
    } else {
        text = `Hạn: ${new Date(dateString).toLocaleDateString('vi-VN')}`;
    }
    return { text, isOverdue, daysDiff: diffDays };
};

const getPriorityDotClass = (priority: TaskPriority | Priority | undefined, itemType: 'task' | 'document'): string => {
    if (itemType === 'task') {
        switch (priority as TaskPriority) {
            case TaskPriority.KhanCap: return 'bg-red-500';
            case TaskPriority.Cao: return 'bg-red-400';
            case TaskPriority.TrungBinh: return 'bg-yellow-500';
            case TaskPriority.Thap: return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    } else { // Document
         switch (priority as Priority) {
            case Priority.Cao: return 'bg-red-500';
            case Priority.TrungBinh: return 'bg-yellow-500';
            case Priority.Thap: return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    }
};


const DashboardPage: React.FC<{ 
    currentUser: User | null;
    allTasks: Task[];
    allDocuments: Document[];
    onViewTask: (id: UUID) => void;
    onViewDocument: (id: UUID) => void;
}> = ({ currentUser, allTasks, allDocuments, onViewTask, onViewDocument }) => {
  const [stats, setStats] = useState({ docs: 0, tourismDocs: 0, relics: 0, tasks: 0, events: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingDashboardItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
        // Stats
        const [tourismDocsData, relicsData, eventsData] = await Promise.all([
          tourismDocumentApi.getAll(),
          relicApi.getAll(),
          eventApi.getAll(),
        ]);

        const activeDocStatusesForDashboard = [ DocumentStatus.Moi, DocumentStatus.DangXuLy, DocumentStatus.ChoPhanHoi ];
        const activeDocsCount = allDocuments.filter(doc => activeDocStatusesForDashboard.includes(doc.status)).length;
        
        setStats({
            docs: activeDocsCount,
            tourismDocs: tourismDocsData.length,
            relics: relicsData.length,
            tasks: allTasks.length,
            events: eventsData.length
        });

        // Upcoming Items
        const today = new Date();
        today.setHours(0,0,0,0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        sevenDaysFromNow.setHours(23,59,59,999);

        const upcoming: UpcomingDashboardItem[] = [];

        allTasks.forEach(task => {
            if (task.due_date && task.status !== AppTaskStatus.HoanThanh && task.status !== AppTaskStatus.HuyBo) {
                const dueDateObj = new Date(task.due_date);
                dueDateObj.setHours(23,59,59,999); // Consider end of due day
                if (dueDateObj < today || (dueDateObj >= today && dueDateObj <= sevenDaysFromNow)) {
                    const { text: relativeDueDate, isOverdue } = formatRelativeDueDate(task.due_date);
                    upcoming.push({
                        id: task.id,
                        title: task.title,
                        type: 'task',
                        dueDate: task.due_date,
                        relativeDueDate,
                        priorityColorClass: getPriorityDotClass(task.priority, 'task'),
                        isOverdue,
                        rawDueDate: dueDateObj,
                        onViewClick: () => onViewTask(task.id),
                    });
                }
            }
        });

        allDocuments.forEach(doc => {
            if (doc.due_date && doc.status !== DocumentStatus.DaHoanThanh && doc.status !== DocumentStatus.Huy && doc.status !== DocumentStatus.LuuTru) {
                const dueDateObj = new Date(doc.due_date);
                 dueDateObj.setHours(23,59,59,999);
                if (dueDateObj < today || (dueDateObj >= today && dueDateObj <= sevenDaysFromNow)) {
                    const { text: relativeDueDate, isOverdue } = formatRelativeDueDate(doc.due_date);
                    upcoming.push({
                        id: doc.id,
                        title: doc.title,
                        type: 'document',
                        dueDate: doc.due_date,
                        relativeDueDate,
                        priorityColorClass: getPriorityDotClass(doc.priority, 'document'),
                        isOverdue,
                        rawDueDate: dueDateObj,
                        onViewClick: () => onViewDocument(doc.id),
                    });
                }
            }
        });
        
        upcoming.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.rawDueDate.getTime() - b.rawDueDate.getTime();
        });

        setUpcomingItems(upcoming.slice(0, 5));

      } catch (error: any) {
        let displayMessage = "Lỗi không xác định khi tải thống kê.";
        // ... (error handling as before)
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
        setStats({ docs: 0, tourismDocs: 0, relics: 0, tasks: 0, events: 0 });
        setUpcomingItems([]);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboardData();
  }, [currentUser, allTasks, allDocuments, onViewTask, onViewDocument]);

  if (loadingStats) {
    return <LoadingSpinner message="Đang tải dữ liệu bảng điều khiển..." />
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Bảng điều khiển" />
      <p className="text-lg text-gray-700">
        Chào mừng, <span className="font-semibold">{currentUser?.email || 'Khách'}</span>!
      </p>
      
      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
          <DocumentTextIcon  />
          <h3 className="text-3xl font-semibold mt-2 text-blue-700">{stats.docs ?? 0}</h3>
          <p className="text-gray-600 mt-1">VB Cần xử lý</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
          <BookOpenIcon  />
          <h3 className="text-3xl font-semibold mt-2 text-blue-700">{stats.tourismDocs ?? 0}</h3>
          <p className="text-gray-600 mt-1">VB Du lịch</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
          <RelicSiteIcon  />
          <h3 className="text-3xl font-semibold mt-2 text-blue-700">{stats.relics ?? 0}</h3>
          <p className="text-gray-600 mt-1">Tổng số Di tích</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
          <ClipboardListIcon />
          <h3 className="text-3xl font-semibold mt-2 text-blue-700">{stats.tasks ?? 0}</h3>
          <p className="text-gray-600 mt-1">Tổng số Công việc</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
          <CalendarIcon />
          <h3 className="text-3xl font-semibold mt-2 text-blue-700">{stats.events ?? 0}</h3>
          <p className="text-gray-600 mt-1">Tổng số Sự kiện</p>
        </div>
      </div>

      {/* Upcoming Tasks Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <CalendarDaysIcon />
          <h2 className="text-xl font-semibold text-gray-800 ml-2">Nhiệm vụ sắp tới</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Các công việc và văn bản cần hoàn thành hoặc sắp hết hạn trong 7 ngày tới.</p>
        {upcomingItems.length > 0 ? (
          <ul className="space-y-3">
            {upcomingItems.map(item => (
              <li 
                key={`${item.type}-${item.id}`} 
                className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md shadow-sm cursor-pointer transition-colors"
                onClick={item.onViewClick}
              >
                <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${item.priorityColorClass}`}></span>
                <div className="flex-grow overflow-hidden">
                  <p className="font-medium text-gray-700 truncate" title={item.title}>{item.title}</p>
                  <p className={`text-xs ${item.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {item.relativeDueDate}
                  </p>
                </div>
                <span className="text-xs text-gray-400 ml-2">{item.type === 'task' ? 'CV' : 'VB'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Không có nhiệm vụ nào sắp tới hoặc quá hạn trong 7 ngày.</p>
        )}
        <div className="mt-6 text-center">
          <Link to="/tasks">
            <Button variant="secondary" size="sm">Xem tất cả nhiệm vụ</Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">Thông tin nhanh</h4>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Sử dụng menu bên trái để điều hướng giữa các mục quản lý.</li>
            <li>Nhấn nút "Thêm mới" trên mỗi trang để tạo mục mới.</li>
            <li>Trang "Trợ lý AI" cung cấp các gợi ý công việc thông minh.</li>
        </ul>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>(''); 

  // Documents State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [isDocFormOpen, toggleDocForm, setDocFormOpen] = useToggle(false);
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);
  const [viewingDocId, setViewingDocId] = useState<UUID | null>(null);
  const [documentViewFilter, setDocumentViewFilter] = useState<'all' | 'plan' | 'project'>('all');

  // Tourism Documents State
  const [tourismDocuments, setTourismDocuments] = useState<TourismDocument[]>([]);
  const [isLoadingTourismDocs, setIsLoadingTourismDocs] = useState(true);
  const [tourismDocError, setTourismDocError] = useState<string | null>(null);
  const [isTourismDocFormOpen, toggleTourismDocForm, setTourismDocFormOpen] = useToggle(false);
  const [tourismDocToEdit, setTourismDocToEdit] = useState<TourismDocument | null>(null);
  const [viewingTourismDocId, setViewingTourismDocId] = useState<UUID | null>(null);

  // Relics State
  const [relics, setRelics] = useState<Relic[]>([]);
  const [isLoadingRelics, setIsLoadingRelics] = useState(true);
  const [relicError, setRelicError] = useState<string | null>(null);
  const [isRelicFormOpen, toggleRelicForm, setRelicFormOpen] = useToggle(false);
  const [relicToEdit, setRelicToEdit] = useState<Relic | null>(null);
  const [viewingRelicId, setViewingRelicId] = useState<UUID | null>(null);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isTaskFormOpen, toggleTaskForm, setTaskFormOpen] = useToggle(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewingTaskId, setViewingTaskId] = useState<UUID | null>(null);

  // Events State
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isEventFormOpen, toggleEventForm, setEventFormOpen] = useToggle(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [viewingEventId, setViewingEventId] = useState<UUID | null>(null);

  // Document Viewer Modal State
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewableFileUrl, setViewableFileUrl] = useState<string | null>(null);
  const [viewableFileName, setViewableFileName] = useState<string | null>(null);

  const openViewerModal = (url: string, fileName: string) => {
    setViewableFileUrl(url);
    setViewableFileName(fileName);
    setIsViewerModalOpen(true);
  };
  const closeViewerModal = () => {
    setIsViewerModalOpen(false);
    setViewableFileUrl(null);
    setViewableFileName(null);
  };


  useEffect(() => {
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setCurrentUser(currentSession?.user ?? null);
      setAuthLoading(false);
    }).catch(error => {
        let displayMessage = "Lỗi không xác định khi lấy session.";
        // ... (error message extraction logic)
        console.error("Error getting session:", displayMessage, "Full error object:", error);
        setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setCurrentUser(newSession?.user ?? null);
        if (_event === 'SIGNED_OUT') {
          setDocuments([]);
          setTourismDocuments([]);
          setRelics([]);
          setTasks([]);
          setEvents([]);
          setGlobalSearchQuery(''); 
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Fetching data
  const fetchDocuments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingDocs(true);
    try {
      const data = await documentApi.getAll();
      setDocuments(data);
      setDocError(null);
    } catch (err: any) {
      let displayMessage = 'Không thể tải danh sách văn bản.';
      // ... (error message extraction logic)
      setDocError(displayMessage);
      console.error("Lỗi khi tải văn bản:", displayMessage, "Full error object:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [currentUser]);

  const fetchTourismDocuments = useCallback(async () => {
    setIsLoadingTourismDocs(true);
    try {
      const { data: tourismDocuments, error } = await supabase
        .from('tourism_documents')
        .select(`
          *,
          source_relations:tourism_document_relations!tourism_document_relations_source_document_id_fkey(
            id,
            relation_type,
            description,
            related_document:tourism_documents!tourism_document_relations_related_document_id_fkey(
              id,
              title,
              document_number,
              document_category,
              issued_date
            )
          ),
          related_relations:tourism_document_relations!tourism_document_relations_related_document_id_fkey(
            id,
            relation_type,
            description,
            source_document:tourism_documents!tourism_document_relations_source_document_id_fkey(
              id,
              title,
              document_number,
              document_category,
              issued_date
            )
          ),
          file_attachments:tourism_document_file_attachments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDocuments = tourismDocuments.map(doc => ({
        ...doc,
        source_relations: doc.source_relations?.map(relation => ({
          ...relation,
          related_document: relation.related_document
        })) || [],
        related_relations: doc.related_relations?.map(relation => ({
          ...relation,
          source_document: relation.source_document
        })) || [],
        file_attachments: doc.file_attachments || []
      }));

      setTourismDocuments(formattedDocuments);
      setTourismDocError(null);
    } catch (error) {
      console.error('Lỗi khi tải văn bản du lịch:', error);
      setTourismDocError('Không thể tải danh sách văn bản du lịch.');
    } finally {
      setIsLoadingTourismDocs(false);
    }
  }, []);

  const fetchRelics = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingRelics(true);
    try {
      const data = await relicApi.getAll();
      setRelics(data);
      setRelicError(null);
    } catch (err: any) {
      let displayMessage = 'Không thể tải danh sách di tích.';
      // ... (error message extraction logic)
      setRelicError(displayMessage);
      console.error("Lỗi khi tải di tích:", displayMessage, "Full error object:", err);
    } finally {
      setIsLoadingRelics(false);
    }
  }, [currentUser]);

  const fetchTasks = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingTasks(true);
    try {
      const data = await taskApi.getAll();
      setTasks(data);
      setTaskError(null);
    } catch (err: any) {
      let displayMessage = 'Không thể tải danh sách công việc.';
       // ... (error message extraction logic)
      setTaskError(displayMessage);
      console.error("Lỗi khi tải công việc:", displayMessage, "Full error object:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [currentUser]);

  const fetchEvents = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingEvents(true);
    try {
      const data = await eventApi.getAll();
      setEvents(data);
      setEventError(null);
    } catch (err: any) {
      let displayMessage = 'Không thể tải danh sách sự kiện.';
       // ... (error message extraction logic)
      setEventError(displayMessage);
      console.error("Lỗi khi tải sự kiện:", displayMessage, "Full error object:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchDocuments();
      fetchTourismDocuments();
      fetchRelics();
      fetchTasks();
      fetchEvents();
    }
  }, [currentUser, fetchDocuments, fetchTourismDocuments, fetchRelics, fetchTasks, fetchEvents]);

  // Document Handlers
  const handleOpenDocForm = (doc?: Document) => { setDocToEdit(doc || null); setDocFormOpen(true); };
  const handleDocSave = (savedDoc: Document) => {
    fetchDocuments();
    if (viewingDocId === savedDoc.id) {
      setViewingDocId(null);
      setTimeout(() => setViewingDocId(savedDoc.id), 0);
    }
  };
  const handleDeleteDoc = async (id: UUID) => {
    try {
      await documentApi.delete(id);
      fetchDocuments();
      if (viewingDocId === id) setViewingDocId(null);
    } catch (e: any) {
      alert(`Lỗi xóa văn bản: ${e.message}`);
    }
  };

  const activeDocumentStatuses = [DocumentStatus.Moi, DocumentStatus.DangXuLy, DocumentStatus.ChoPhanHoi];
  const projectDocumentTypes = [DocumentType.QuyHoachPhatTrien, DocumentType.DeAnDuLich, DocumentType.HoSoDuAnQuyHoachKeHoach, DocumentType.ThuyetMinhDuAnDeAn];

  const filteredDocuments = React.useMemo(() => {
    let docs = documents;
    docs = docs.filter(doc => activeDocumentStatuses.includes(doc.status));
    
    if (documentViewFilter === 'plan') {
      docs = docs.filter(doc => doc.document_type === DocumentType.KeHoach);
    } else if (documentViewFilter === 'project') {
      docs = docs.filter(doc => doc.project_code != null || projectDocumentTypes.includes(doc.document_type));
    }

    const trimmedQuery = globalSearchQuery.trim();
    if (trimmedQuery !== '') {
        const lowerCaseQuery = trimmedQuery.toLowerCase();
        docs = docs.filter(doc =>
            doc.title.toLowerCase().includes(lowerCaseQuery) ||
            doc.document_number.toLowerCase().includes(lowerCaseQuery) ||
            (doc.summary && doc.summary.toLowerCase().includes(lowerCaseQuery)) ||
            (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) ||
            (doc.issuing_organization && doc.issuing_organization.toLowerCase().includes(lowerCaseQuery)) ||
            (doc.recipient_organization && doc.recipient_organization.toLowerCase().includes(lowerCaseQuery))
        );
    }
    return docs;
  }, [documents, documentViewFilter, globalSearchQuery]);


  // Tourism Document Handlers
  const handleOpenTourismDocForm = (doc?: TourismDocument) => { setTourismDocToEdit(doc || null); setTourismDocFormOpen(true); };
  const handleTourismDocSave = (savedDoc: TourismDocument) => {
    fetchTourismDocuments();
    if (viewingTourismDocId === savedDoc.id) {
        setViewingTourismDocId(null);
        setTimeout(() => setViewingTourismDocId(savedDoc.id), 0);
    }
  };
  const handleDeleteTourismDoc = async (id: UUID) => {
    try {
      await tourismDocumentApi.delete(id);
      fetchTourismDocuments();
      if (viewingTourismDocId === id) setViewingTourismDocId(null);
    } catch (e: any) {
      alert(`Lỗi xóa văn bản du lịch: ${e.message}`);
    }
  };


  // Relic Handlers
  const handleOpenRelicForm = (relic?: Relic) => { setRelicToEdit(relic || null); setRelicFormOpen(true); };
  const handleRelicSave = (savedRelic: Relic) => {
     fetchRelics();
     if (viewingRelicId === savedRelic.id) {
        setViewingRelicId(null);
        setTimeout(() => setViewingRelicId(savedRelic.id), 0);
    }
  };
  const handleDeleteRelic = async (id: UUID) => {
    try {
      await relicApi.delete(id);
      fetchRelics();
      if (viewingRelicId === id) setViewingRelicId(null);
    } catch (e: any) {
      alert(`Lỗi xóa di tích: ${e.message}`);
    }
  };

  // Task Handlers
  const handleOpenTaskForm = (task?: Task) => { setTaskToEdit(task || null); setTaskFormOpen(true); };
  const handleTaskSave = (savedTask: Task) => {
    fetchTasks();
     if (viewingTaskId === savedTask.id) {
        setViewingTaskId(null);
        setTimeout(() => setViewingTaskId(savedTask.id), 0);
    }
  };
  const handleDeleteTask = async (id: UUID) => {
    try {
      await taskApi.delete(id);
      fetchTasks();
      if (viewingTaskId === id) setViewingTaskId(null);
    } catch (e: any) {
      alert(`Lỗi xóa công việc: ${e.message}`);
    }
  };

  // Event Handlers
  const handleOpenEventForm = (event?: Event) => { setEventToEdit(event || null); setEventFormOpen(true); };
  const handleEventSave = (savedEvent: Event) => {
    fetchEvents();
     if (viewingEventId === savedEvent.id) {
        setViewingEventId(null);
        setTimeout(() => setViewingEventId(savedEvent.id), 0);
    }
    fetchTasks(); // Refresh tasks as events might have related tasks
  };
  const handleDeleteEvent = async (id: UUID) => {
    try {
      await eventApi.delete(id);
      fetchEvents();
      fetchTasks(); // Refresh tasks
      if (viewingEventId === id) setViewingEventId(null);
    } catch (e: any) {
      alert(`Lỗi xóa sự kiện: ${e.message}`);
    }
  };
  
  const handleAITaskCreated = (newTask: Task) => {
    fetchTasks(); // Refresh tasks list
    alert(`Công việc gợi ý từ AI "${newTask.title}" đã được tạo thành công!`);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        let displayMessage = "Lỗi không xác định khi đăng xuất.";
        // ... (error message extraction logic)
        alert(`Lỗi đăng xuất: ${displayMessage}`);
        console.error("Lỗi đăng xuất:", displayMessage, "Full error object:", error);
    }
    // Auth listener will handle clearing state
    setAuthLoading(false); 
  };


  if (authLoading) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner message="Đang tải ứng dụng..." /></div>;
  }

  if (!currentUser) {
    return <AuthPage onLoginSuccess={() => { /* Auth listener will handle state update */ }} />;
  }

  return (
    <HashRouter>
      <Layout globalSearchQuery={globalSearchQuery} setGlobalSearchQuery={setGlobalSearchQuery}>
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardPage 
                currentUser={currentUser} 
                allTasks={tasks} 
                allDocuments={documents}
                onViewTask={setViewingTaskId}
                onViewDocument={setViewingDocId}
              />
            } 
          />
          <Route path="/documents" element={
            <>
              <PageTitle title="Văn bản cần xử lý" actions={
                <Button onClick={() => handleOpenDocForm()} leftIcon={<PlusIcon />}>Thêm Văn bản</Button>
              } />
              <div className="mb-4 flex space-x-2 border-b pb-2">
                <Button
                    variant={documentViewFilter === 'all' ? 'primary' : 'secondary'}
                    onClick={() => setDocumentViewFilter('all')}
                    size="sm"
                >
                    Tất cả cần xử lý ({documents.filter(doc => activeDocumentStatuses.includes(doc.status)).length})
                </Button>
                <Button
                    variant={documentViewFilter === 'plan' ? 'primary' : 'secondary'}
                    onClick={() => setDocumentViewFilter('plan')}
                    size="sm"
                >
                    Theo Kế hoạch ({documents.filter(doc => activeDocumentStatuses.includes(doc.status) && doc.document_type === DocumentType.KeHoach).length})
                </Button>
                <Button
                    variant={documentViewFilter === 'project' ? 'primary' : 'secondary'}
                    onClick={() => setDocumentViewFilter('project')}
                    size="sm"
                >
                    Theo Dự án ({documents.filter(doc => activeDocumentStatuses.includes(doc.status) && (doc.project_code != null || projectDocumentTypes.includes(doc.document_type))).length})
                </Button>
              </div>
              <DocumentList
                documents={filteredDocuments}
                isLoading={isLoadingDocs}
                error={docError}
                onViewDocument={(doc) => setViewingDocId(doc.id)}
                onEditDocument={handleOpenDocForm}
                onDeleteDocument={handleDeleteDoc}
                onAddNew={() => handleOpenDocForm()}
              />
            </>
          } />
          <Route path="/tourism-documents" element={
            <>
              <PageTitle title="Văn bản Du lịch" actions={
                <Button onClick={() => handleOpenTourismDocForm()} leftIcon={<PlusIcon />}>Thêm VB Du lịch</Button>
              } />
              <TourismDocumentList
                documents={tourismDocuments.filter(doc => {
                    const trimmedQuery = globalSearchQuery.trim();
                    if (trimmedQuery === '') return true;
                    const lowerCaseQuery = trimmedQuery.toLowerCase();
                    return doc.title.toLowerCase().includes(lowerCaseQuery) ||
                           doc.document_number.toLowerCase().includes(lowerCaseQuery) ||
                           (doc.summary && doc.summary.toLowerCase().includes(lowerCaseQuery)) ||
                           (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) ||
                           (doc.issuing_organization && doc.issuing_organization.toLowerCase().includes(lowerCaseQuery)) ||
                           (doc.document_category && doc.document_category.toLowerCase().includes(lowerCaseQuery)) ||
                           (doc.tourism_sector && doc.tourism_sector.toLowerCase().includes(lowerCaseQuery));
                })}
                isLoading={isLoadingTourismDocs}
                error={tourismDocError}
                onViewDocument={(doc) => setViewingTourismDocId(doc.id)}
                onEditDocument={handleOpenTourismDocForm}
                onDeleteDocument={handleDeleteTourismDoc}
                onAddNew={() => handleOpenTourismDocForm()}
              />
            </>
          } />
          <Route path="/relics" element={
            <>
              <PageTitle title="Quản lý Di tích" actions={
                <Button onClick={() => handleOpenRelicForm()} leftIcon={<PlusIcon />}>Thêm Di tích</Button>
              } />
              <RelicList
                relics={relics.filter(relic => {
                    const trimmedQuery = globalSearchQuery.trim();
                    if (trimmedQuery === '') return true;
                    const lowerCaseQuery = trimmedQuery.toLowerCase();
                    return relic.name.toLowerCase().includes(lowerCaseQuery) ||
                           (relic.location_description && relic.location_description.toLowerCase().includes(lowerCaseQuery)) ||
                           (relic.relic_type && relic.relic_type.toLowerCase().includes(lowerCaseQuery)) ||
                           (relic.recognition_level && relic.recognition_level.toLowerCase().includes(lowerCaseQuery)) ||
                           (relic.short_description && relic.short_description.toLowerCase().includes(lowerCaseQuery));
                })}
                isLoading={isLoadingRelics}
                error={relicError}
                onViewRelic={(relic) => setViewingRelicId(relic.id)}
                onEditRelic={handleOpenRelicForm}
                onDeleteRelic={handleDeleteRelic}
                onAddNew={() => handleOpenRelicForm()}
              />
            </>
          } />
          <Route path="/tasks" element={
            <>
              <PageTitle title="Quản lý Công việc" actions={
                <Button onClick={() => handleOpenTaskForm()} leftIcon={<PlusIcon />}>Thêm Công việc</Button>
              } />
              <TaskList
                tasks={tasks.filter(task => {
                    const trimmedQuery = globalSearchQuery.trim();
                    if (trimmedQuery === '') return true;
                    const lowerCaseQuery = trimmedQuery.toLowerCase();
                    return task.title.toLowerCase().includes(lowerCaseQuery) ||
                           (task.description && task.description.toLowerCase().includes(lowerCaseQuery)) ||
                           (task.priority && task.priority.toLowerCase().includes(lowerCaseQuery)) ||
                           (task.status && task.status.toLowerCase().includes(lowerCaseQuery)) ||
                           (task.task_category && task.task_category.toLowerCase().includes(lowerCaseQuery));
                })}
                isLoading={isLoadingTasks}
                error={taskError}
                onViewTask={(task) => setViewingTaskId(task.id)}
                onEditTask={handleOpenTaskForm}
                onDeleteTask={handleDeleteTask}
                onAddNew={() => handleOpenTaskForm()}
              />
            </>
          } />
          <Route path="/events" element={
            <>
              <PageTitle title="Quản lý Sự kiện" actions={
                <Button onClick={() => handleOpenEventForm()} leftIcon={<PlusIcon />}>Thêm Sự kiện</Button>
              } />
              <EventList
                events={events.filter(event => {
                    const trimmedQuery = globalSearchQuery.trim();
                    if (trimmedQuery === '') return true;
                    const lowerCaseQuery = trimmedQuery.toLowerCase();
                    return event.name.toLowerCase().includes(lowerCaseQuery) ||
                           (event.event_type && event.event_type.toLowerCase().includes(lowerCaseQuery)) ||
                           (event.location && event.location.toLowerCase().includes(lowerCaseQuery)) ||
                           (event.organizer && event.organizer.toLowerCase().includes(lowerCaseQuery)) ||
                           (event.description && event.description.toLowerCase().includes(lowerCaseQuery));
                })}
                isLoading={isLoadingEvents}
                error={eventError}
                onViewEvent={(event) => setViewingEventId(event.id)}
                onEditEvent={handleOpenEventForm}
                onDeleteEvent={handleDeleteEvent}
                onAddNew={() => handleOpenEventForm()}
              />
            </>
          } />
          <Route path="/ai" element={
            <>
              <PageTitle title="Trợ lý AI" actions={
                <div className="flex items-center text-purple-600">
                  <SparklesIcon /> <span className="ml-1 text-sm">Hỗ trợ bởi Gemini</span>
                </div>
              }/>
              <AISuggestionSection onTaskCreated={handleAITaskCreated} />
            </>
          } />
           <Route path="/logout" element={
            <div className="p-8 text-center">
                <p>Bạn có muốn đăng xuất không?</p>
                <Button onClick={handleLogout} variant="danger" className="mt-4">Đăng xuất</Button>
            </div>
           }/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Form Modals */}
      {isDocFormOpen && <DocumentFormModal isOpen={isDocFormOpen} onClose={toggleDocForm} onSave={handleDocSave} documentToEdit={docToEdit} onPreviewFile={openViewerModal} />}
      {isTourismDocFormOpen && <TourismDocumentFormModal isOpen={isTourismDocFormOpen} onClose={toggleTourismDocForm} onSave={handleTourismDocSave} documentToEdit={tourismDocToEdit} onPreviewFile={openViewerModal}/>}
      {isRelicFormOpen && <RelicFormModal isOpen={isRelicFormOpen} onClose={toggleRelicForm} onSave={handleRelicSave} relicToEdit={relicToEdit} />}
      {isTaskFormOpen && <TaskFormModal isOpen={isTaskFormOpen} onClose={toggleTaskForm} onSave={handleTaskSave} taskToEdit={taskToEdit} />}
      {isEventFormOpen && <EventFormModal isOpen={isEventFormOpen} onClose={toggleEventForm} onSave={handleEventSave} eventToEdit={eventToEdit} />}

      {/* Detail View Modals */}
      {viewingDocId && (
        <Modal isOpen={!!viewingDocId} onClose={() => setViewingDocId(null)} title="Chi tiết Văn bản" size="xl">
          <DocumentDetailView documentId={viewingDocId} onClose={() => setViewingDocId(null)} onDocumentUpdate={handleDocSave} onPreviewFile={openViewerModal} />
        </Modal>
      )}
      {viewingTourismDocId && (
        <Modal isOpen={!!viewingTourismDocId} onClose={() => setViewingTourismDocId(null)} title="Chi tiết Văn bản Du lịch" size="xl">
          <TourismDocumentDetailView 
            documentId={viewingTourismDocId} 
            onClose={() => setViewingTourismDocId(null)} 
            onDocumentUpdate={handleTourismDocSave} 
            onPreviewFile={openViewerModal}
            onViewRelatedDocument={(docId) => {
              setViewingTourismDocId(null);
              setTimeout(() => setViewingTourismDocId(docId), 0);
            }}
          />
        </Modal>
      )}
      {viewingRelicId && (
        <Modal isOpen={!!viewingRelicId} onClose={() => setViewingRelicId(null)} title="Chi tiết Di tích" size="xl">
          <RelicDetailView relicId={viewingRelicId} onClose={() => setViewingRelicId(null)} />
        </Modal>
      )}
      {viewingTaskId && (
         <Modal isOpen={!!viewingTaskId} onClose={() => setViewingTaskId(null)} title="Chi tiết Công việc" size="lg">
            <TaskDetailView taskId={viewingTaskId} onClose={() => setViewingTaskId(null)} />
        </Modal>
      )}
      {viewingEventId && (
        <Modal isOpen={!!viewingEventId} onClose={() => setViewingEventId(null)} title="Chi tiết Sự kiện" size="xl">
            <EventDetailView eventId={viewingEventId} onClose={() => setViewingEventId(null)} onEventUpdate={handleEventSave} />
        </Modal>
      )}
      

      {/* Document Viewer Modal (for Google Drive previews) */}
      {isViewerModalOpen && viewableFileUrl && viewableFileName && (
        <DocumentViewerModal
            isOpen={isViewerModalOpen}
            onClose={closeViewerModal}
            fileUrl={viewableFileUrl}
            fileName={viewableFileName}
        />
      )}
    </HashRouter>
  );
};

export default App;