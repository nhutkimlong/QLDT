import { 
  UUID, Document, Task, Event, FileAttachment, DocumentRelation,
  DocumentFormData, TaskFormData, EventFormData, 
  FileAttachmentUploadData, FileAttachmentLinkData, DocumentRelationFormData, DocumentRelationInfo
} from '../types';
// MOCK_USER_ID is no longer exported from constants.tsx.
// Define it locally if this mock service needs a placeholder user ID.
const MOCK_USER_ID: UUID = "mock-user-123-fallback"; 

const generateUUID = (): UUID => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 300));

// Helper to get and set data from localStorage
const getStoredData = <T,>(key: string, defaultValue: T[] = []): T[] => {
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const setStoredData = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};


// Documents
let documents: Document[] = getStoredData<Document>('documents_data', []);
let fileAttachments: FileAttachment[] = getStoredData<FileAttachment>('file_attachments_data', []);
let documentRelations: DocumentRelation[] = getStoredData<DocumentRelation>('document_relations_data', []);


export const documentApi = {
  getAll: async (): Promise<Document[]> => {
    const docsWithDetails = documents.map(doc => ({
      ...doc,
      file_attachments: fileAttachments.filter(fa => fa.document_id === doc.id),
      related_documents: documentRelations
        .filter(dr => dr.source_document_id === doc.id || dr.related_document_id === doc.id)
        .map(dr => {
          const relatedDoc = documents.find(d => d.id === (dr.source_document_id === doc.id ? dr.related_document_id : dr.source_document_id));
          return {
            ...dr,
            related_document_title: relatedDoc?.title || 'Unknown Document',
            source_document_title: documents.find(d => d.id === dr.source_document_id)?.title || 'Unknown Document',
          } as DocumentRelationInfo;
        })
    }));
    return simulateDelay(docsWithDetails);
  },
  getById: async (id: UUID): Promise<Document | undefined> => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return simulateDelay(undefined);
    return simulateDelay({
      ...doc,
      file_attachments: fileAttachments.filter(fa => fa.document_id === doc.id),
      related_documents: documentRelations
        .filter(dr => dr.source_document_id === doc.id || dr.related_document_id === doc.id)
        .map(dr => {
          const relatedDoc = documents.find(d => d.id === (dr.source_document_id === doc.id ? dr.related_document_id : dr.source_document_id));
          return {
            ...dr,
            related_document_title: relatedDoc?.title || 'Unknown Document',
            source_document_title: documents.find(d => d.id === dr.source_document_id)?.title || 'Unknown Document',
          } as DocumentRelationInfo;
        })
    });
  },
  create: async (data: DocumentFormData): Promise<Document> => {
    const now = new Date().toISOString();
    const newDocument: Document = {
      ...data,
      id: generateUUID(),
      tags: data.tagsString?.split(',').map(t => t.trim()).filter(t => t) || [],
      user_id: MOCK_USER_ID, 
      created_at: now,
      updated_at: now,
    };
    documents = [...documents, newDocument];
    setStoredData('documents_data', documents);
    return simulateDelay(newDocument);
  },
  update: async (id: UUID, data: Partial<DocumentFormData>): Promise<Document | undefined> => {
    let updatedDoc: Document | undefined;
    documents = documents.map(doc => {
      if (doc.id === id) {
        updatedDoc = { 
          ...doc, 
          ...data,
          tags: data.tagsString !== undefined ? data.tagsString.split(',').map(t => t.trim()).filter(t => t) : doc.tags,
          updated_at: new Date().toISOString() 
        };
        return updatedDoc;
      }
      return doc;
    });
    setStoredData('documents_data', documents);
    return simulateDelay(updatedDoc);
  },
  delete: async (id: UUID): Promise<boolean> => {
    const initialLength = documents.length;
    documents = documents.filter(doc => doc.id !== id);
    // Also delete related file attachments and relations
    fileAttachments = fileAttachments.filter(fa => fa.document_id !== id);
    documentRelations = documentRelations.filter(dr => dr.source_document_id !== id && dr.related_document_id !== id);
    setStoredData('documents_data', documents);
    setStoredData('file_attachments_data', fileAttachments);
    setStoredData('document_relations_data', documentRelations);
    return simulateDelay(documents.length < initialLength);
  },

  // File Attachments
  addFileAttachment: async (data: FileAttachmentLinkData): Promise<FileAttachment> => {
    const newAttachment: FileAttachment = {
      ...data,
      id: generateUUID(),
      version: 1,
      uploaded_at: new Date().toISOString(),
      user_id: MOCK_USER_ID, 
    };
    fileAttachments = [...fileAttachments, newAttachment];
    setStoredData('file_attachments_data', fileAttachments);
    return simulateDelay(newAttachment);
  },
  deleteFileAttachment: async (attachmentId: UUID): Promise<boolean> => {
    const initialLength = fileAttachments.length;
    fileAttachments = fileAttachments.filter(fa => fa.id !== attachmentId);
    setStoredData('file_attachments_data', fileAttachments);
    return simulateDelay(fileAttachments.length < initialLength);
  },
  
  // Document Relations
  addDocumentRelation: async (data: DocumentRelationFormData): Promise<DocumentRelation> => {
    const newRelation: DocumentRelation = {
      ...data,
      id: generateUUID(),
      user_id: MOCK_USER_ID, 
    };
    documentRelations = [...documentRelations, newRelation];
    setStoredData('document_relations_data', documentRelations);
    return simulateDelay(newRelation);
  },
  deleteDocumentRelation: async (relationId: UUID): Promise<boolean> => {
    const initialLength = documentRelations.length;
    documentRelations = documentRelations.filter(dr => dr.id !== relationId);
    setStoredData('document_relations_data', documentRelations);
    return simulateDelay(documentRelations.length < initialLength);
  }
};

// Tasks
let tasks: Task[] = getStoredData<Task>('tasks_data', []);

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const tasksWithDetails = tasks.map(task => ({
      ...task,
      related_document_title: task.related_document_id ? documents.find(d => d.id === task.related_document_id)?.title : undefined,
      related_event_name: task.related_event_id ? events.find(e => e.id === task.related_event_id)?.name : undefined,
    }));
    return simulateDelay(tasksWithDetails);
  },
  getById: async (id: UUID): Promise<Task | undefined> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return simulateDelay(undefined);
    return simulateDelay({
      ...task,
      related_document_title: task.related_document_id ? documents.find(d => d.id === task.related_document_id)?.title : undefined,
      related_event_name: task.related_event_id ? events.find(e => e.id === task.related_event_id)?.name : undefined,
    });
  },
  create: async (data: TaskFormData): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: generateUUID(),
      assignee_id: MOCK_USER_ID, 
      user_id: MOCK_USER_ID, 
      created_at: now,
      updated_at: now,
    };
    tasks = [...tasks, newTask];
    setStoredData('tasks_data', tasks);
    return simulateDelay(newTask);
  },
  update: async (id: UUID, data: Partial<TaskFormData>): Promise<Task | undefined> => {
    let updatedTask: Task | undefined;
    tasks = tasks.map(task => {
      if (task.id === id) {
        updatedTask = { ...task, ...data, updated_at: new Date().toISOString() };
        return updatedTask;
      }
      return task;
    });
    setStoredData('tasks_data', tasks);
    return simulateDelay(updatedTask);
  },
  delete: async (id: UUID): Promise<boolean> => {
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== id);
    setStoredData('tasks_data', tasks);
    return simulateDelay(tasks.length < initialLength);
  },
};

// Events
let events: Event[] = getStoredData<Event>('events_data', []);

export const eventApi = {
  getAll: async (): Promise<Event[]> => simulateDelay(events),
  getById: async (id: UUID): Promise<Event | undefined> => simulateDelay(events.find(e => e.id === id)),
  create: async (data: EventFormData): Promise<Event> => {
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...data,
      id: generateUUID(),
      user_id: MOCK_USER_ID, 
      created_at: now,
      updated_at: now,
    };
    events = [...events, newEvent];
    setStoredData('events_data', events);
    return simulateDelay(newEvent);
  },
  update: async (id: UUID, data: Partial<EventFormData>): Promise<Event | undefined> => {
    let updatedEvent: Event | undefined;
    events = events.map(event => {
      if (event.id === id) {
        updatedEvent = { ...event, ...data, updated_at: new Date().toISOString() };
        return updatedEvent;
      }
      return event;
    });
    setStoredData('events_data', events);
    return simulateDelay(updatedEvent);
  },
  delete: async (id: UUID): Promise<boolean> => {
    const initialLength = events.length;
    events = events.filter(event => event.id !== id);
    // Also delete tasks related to this event
    tasks = tasks.filter(task => task.related_event_id !== id);
    setStoredData('events_data', events);
    setStoredData('tasks_data', tasks);
    return simulateDelay(events.length < initialLength);
  },
};