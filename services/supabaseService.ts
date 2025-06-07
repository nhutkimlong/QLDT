import { supabase } from './supabaseClient';
import { 
  UUID, Document, Task, Event, FileAttachment, DocumentRelation, Relic, 
  TourismDocument, TourismFileAttachment, TourismFileAttachmentLinkData,
  TourismDocumentRelation, TourismDocumentRelationFormData, TourismDocumentRelationType,
  DocumentFormData, TaskFormData, EventFormData, DocumentRelationFormData, RelicFormData, 
  TourismDocumentFormData,
  DocumentRelationInfo, FileAttachmentLinkData,
  DocumentType, Priority, DocumentStatus, 
  TaskPriority, TaskStatus as AppTaskStatus, TaskCategory,  
  EventType, EventStatus as AppEventStatus,
  RelicType, RelicRecognitionLevel, RelicTourismExploitationStatus, ConservationStatus,
  TourismDocumentCategory, TourismSector
} from '../types';
import { Database } from '../types'; // Supabase specific types

// Helper to get current user ID
const getCurrentUserId = async (): Promise<UUID> => {
  const { data: { user } } = await supabase.auth.getUser(); 
  if (!user) throw new Error("Người dùng chưa đăng nhập.");
  return user.id;
};


export const documentApi = {
  getAll: async (): Promise<Document[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        file_attachments(*),
        source_relations:document_relations!source_document_id(*, related_document:documents!related_document_id(id, title)),
        related_relations:document_relations!related_document_id(*, source_document:documents!source_document_id(id, title))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(docFromDb => {
      const related_documents: DocumentRelationInfo[] = [];
      docFromDb.source_relations?.forEach((rel: any) => {
        related_documents.push({
          ...rel,
          related_document_id: rel.related_document.id,
          related_document_title: rel.related_document.title,
          source_document_id: docFromDb.id,
          source_document_title: docFromDb.title,
        } as DocumentRelationInfo);
      });
      docFromDb.related_relations?.forEach((rel: any) => {
        if (!related_documents.find(r => r.id === rel.id)) {
            related_documents.push({
                ...rel,
                source_document_id: rel.source_document.id,
                source_document_title: rel.source_document.title,
                related_document_id: docFromDb.id,
                related_document_title: docFromDb.title,
            } as DocumentRelationInfo);
        }
      });
      return { 
        ...(docFromDb as any), 
        document_type: docFromDb.document_type as DocumentType,
        priority: docFromDb.priority as Priority,
        status: docFromDb.status as DocumentStatus,
        file_attachments: (docFromDb.file_attachments || []) as FileAttachment[], 
        related_documents 
      } as Document;
    });
  },

  getById: async (id: UUID): Promise<Document | undefined> => {
    const { data: dataFromDb, error } = await supabase
      .from('documents')
      .select(`
        *,
        file_attachments(*),
        source_relations:document_relations!source_document_id(*, related_document:documents!related_document_id(id, title)),
        related_relations:document_relations!related_document_id(*, source_document:documents!source_document_id(id, title))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!dataFromDb) return undefined;

    const related_documents: DocumentRelationInfo[] = [];
    dataFromDb.source_relations?.forEach((rel: any) => {
        related_documents.push({
          ...rel,
          related_document_id: rel.related_document.id,
          related_document_title: rel.related_document.title,
          source_document_id: dataFromDb.id,
          source_document_title: dataFromDb.title,
        } as DocumentRelationInfo);
      });
    dataFromDb.related_relations?.forEach((rel: any) => {
        if (!related_documents.find(r => r.id === rel.id)) {
            related_documents.push({
                ...rel,
                source_document_id: rel.source_document.id,
                source_document_title: rel.source_document.title,
                related_document_id: dataFromDb.id,
                related_document_title: dataFromDb.title,
            } as DocumentRelationInfo);
        }
    });
    
    return { 
      ...(dataFromDb as any), 
      document_type: dataFromDb.document_type as DocumentType,
      priority: dataFromDb.priority as Priority,
      status: dataFromDb.status as DocumentStatus,
      file_attachments: (dataFromDb.file_attachments || []) as FileAttachment[],
      related_documents
    } as Document;
  },

  create: async (data: DocumentFormData): Promise<Document> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['documents']['Insert'] = {
      ...data,
      user_id: userId,
      document_type: data.document_type as Database['public']['Enums']['document_type'],
      priority: data.priority as Database['public']['Enums']['priority'],
      status: data.status as Database['public']['Enums']['document_status'],
      tags: data.tags || null,
    };
    const { data: newDoc, error } = await supabase.from('documents').insert(dbData).select().single();
    if (error) throw error;
    return { ...newDoc, document_type: newDoc.document_type as DocumentType, priority: newDoc.priority as Priority, status: newDoc.status as DocumentStatus } as Document;
  },

  update: async (id: UUID, data: Partial<DocumentFormData>): Promise<Document | undefined> => {
    const dbData: Database['public']['Tables']['documents']['Update'] = {
      ...data,
      tags: data.tags || null,
    };
    // Explicitly cast enums if they are part of the update data
    if (data.document_type) dbData.document_type = data.document_type as Database['public']['Enums']['document_type'];
    if (data.priority) dbData.priority = data.priority as Database['public']['Enums']['priority'];
    if (data.status) dbData.status = data.status as Database['public']['Enums']['document_status'];

    const { data: updatedDoc, error } = await supabase.from('documents').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return { ...updatedDoc, document_type: updatedDoc.document_type as DocumentType, priority: updatedDoc.priority as Priority, status: updatedDoc.status as DocumentStatus } as Document;
  },

  delete: async (id: UUID): Promise<boolean> => {
    // First delete related document_relations
    await supabase.from('document_relations').delete().or(`source_document_id.eq.${id},related_document_id.eq.${id}`);
    // Then delete related file_attachments
    await supabase.from('file_attachments').delete().eq('document_id', id);
    // Finally delete the document
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  addFileAttachment: async (data: FileAttachmentLinkData): Promise<FileAttachment> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['file_attachments']['Insert'] = {
      ...data,
      user_id: userId,
      version: 1, // Default version
    };
    const { data: newAttachment, error } = await supabase.from('file_attachments').insert(dbData).select().single();
    if (error) throw error;
    return newAttachment as FileAttachment;
  },

  deleteFileAttachment: async (attachmentId: UUID): Promise<boolean> => {
    const { error } = await supabase.from('file_attachments').delete().eq('id', attachmentId);
    if (error) throw error;
    return true;
  },
  
  addDocumentRelation: async (data: DocumentRelationFormData): Promise<DocumentRelation> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['document_relations']['Insert'] = {
      ...data,
      user_id: userId,
      relation_type: data.relation_type as Database['public']['Enums']['document_relation_type'],
    };
    const { data: newRelation, error } = await supabase.from('document_relations').insert(dbData).select().single();
    if (error) throw error;
    return { ...newRelation, relation_type: newRelation.relation_type as Database['public']['Enums']['document_relation_type'] } as DocumentRelation;
  },

  deleteDocumentRelation: async (relationId: UUID): Promise<boolean> => {
    const { error } = await supabase.from('document_relations').delete().eq('id', relationId);
    if (error) throw error;
    return true;
  }
};

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, related_document:documents(id, title), related_event:events(id, name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(t => ({ 
        ...t, 
        priority: t.priority as TaskPriority,
        status: t.status as AppTaskStatus,
        task_category: t.task_category as TaskCategory | null,
        related_document_title: t.related_document?.title,
        related_event_name: t.related_event?.name,
    })) as Task[];
  },
  getById: async (id: UUID): Promise<Task | undefined> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, related_document:documents(id, title), related_event:events(id, name)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return { 
        ...data, 
        priority: data.priority as TaskPriority,
        status: data.status as AppTaskStatus,
        task_category: data.task_category as TaskCategory | null,
        related_document_title: data.related_document?.title,
        related_event_name: data.related_event?.name,
    } as Task;
  },
  create: async (data: TaskFormData): Promise<Task> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['tasks']['Insert'] = {
      // Spread all fields from TaskFormData
      title: data.title,
      description: data.description,
      related_document_id: data.related_document_id,
      related_event_id: data.related_event_id,
      priority: data.priority as Database['public']['Enums']['task_priority'],
      status: data.status as Database['public']['Enums']['task_status'],
      start_date: data.start_date,
      due_date: data.due_date,
      completion_date: data.completion_date,
      // Add specific fields not in TaskFormData or needing defaults/overrides
      user_id: userId,
      task_category: null, // Corrected: Not in TaskFormData, set to null
      // Other specialist fields (not in TaskFormData) should be null or their DB default
      assignee_id: null, 
      estimated_effort_hours: null,
      actual_effort_hours: null,
      department_responsible: null,
      coordinating_departments: null,
      inspection_target: null,
      restoration_phase: null,
      monitored_entity_name: null,
      inventory_scope: null,
    };
    const { data: newTask, error } = await supabase.from('tasks').insert(dbData).select().single();
    if (error) throw error;
    return { ...newTask, priority: newTask.priority as TaskPriority, status: newTask.status as AppTaskStatus, task_category: newTask.task_category as TaskCategory | null } as Task;
  },
  update: async (id: UUID, data: Partial<TaskFormData>): Promise<Task | undefined> => {
    const dbData: Database['public']['Tables']['tasks']['Update'] = {};

    // Map fields from Partial<TaskFormData> to dbData
    // This ensures only fields present in TaskFormData are processed
    if (data.title !== undefined) dbData.title = data.title;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.related_document_id !== undefined) dbData.related_document_id = data.related_document_id;
    if (data.related_event_id !== undefined) dbData.related_event_id = data.related_event_id;
    if (data.priority !== undefined) dbData.priority = data.priority as Database['public']['Enums']['task_priority'];
    if (data.status !== undefined) dbData.status = data.status as Database['public']['Enums']['task_status'];
    if (data.start_date !== undefined) dbData.start_date = data.start_date;
    if (data.due_date !== undefined) dbData.due_date = data.due_date;
    if (data.completion_date !== undefined) dbData.completion_date = data.completion_date;
    
    // task_category is not part of TaskFormData, so it's not updated here.
    // The original if block for task_category has been removed.
    
    const { data: updatedTask, error } = await supabase.from('tasks').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return { ...updatedTask, priority: updatedTask.priority as TaskPriority, status: updatedTask.status as AppTaskStatus, task_category: updatedTask.task_category as TaskCategory | null } as Task;
  },
  delete: async (id: UUID): Promise<boolean> => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

export const relicApi = {
  getAll: async (): Promise<Relic[]> => {
    const { data, error } = await supabase
      .from('relics')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(r => ({
      ...r,
      relic_type: r.relic_type as RelicType,
      recognition_level: r.recognition_level as RelicRecognitionLevel,
      current_conservation_status: r.current_conservation_status as ConservationStatus | null,
      tourism_exploitation_status: r.tourism_exploitation_status as RelicTourismExploitationStatus | null,
    })) as Relic[];
  },
  getById: async (id: UUID): Promise<Relic | undefined> => {
    const { data, error } = await supabase
      .from('relics')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return { 
      ...data,
      relic_type: data.relic_type as RelicType,
      recognition_level: data.recognition_level as RelicRecognitionLevel,
      current_conservation_status: data.current_conservation_status as ConservationStatus | null,
      tourism_exploitation_status: data.tourism_exploitation_status as RelicTourismExploitationStatus | null,
    } as Relic;
  },
  create: async (data: RelicFormData): Promise<Relic> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['relics']['Insert'] = {
      ...data,
      user_id: userId,
      relic_type: data.relic_type as Database['public']['Enums']['relic_type'],
      recognition_level: data.recognition_level as Database['public']['Enums']['relic_recognition_level'],
      current_conservation_status: data.current_conservation_status as Database['public']['Enums']['conservation_status'] | null,
      tourism_exploitation_status: data.tourism_exploitation_status as Database['public']['Enums']['relic_tourism_exploitation_status'] | null,
    };
    const { data: newRelic, error } = await supabase.from('relics').insert(dbData).select().single();
    if (error) throw error;
    return { 
      ...newRelic, 
      relic_type: newRelic.relic_type as RelicType,
      recognition_level: newRelic.recognition_level as RelicRecognitionLevel,
      current_conservation_status: newRelic.current_conservation_status as ConservationStatus | null,
      tourism_exploitation_status: newRelic.tourism_exploitation_status as RelicTourismExploitationStatus | null,
    } as Relic;
  },
  update: async (id: UUID, data: Partial<RelicFormData>): Promise<Relic | undefined> => {
    const dbData: Database['public']['Tables']['relics']['Update'] = {...data};
    if (data.relic_type) dbData.relic_type = data.relic_type as Database['public']['Enums']['relic_type'];
    if (data.recognition_level) dbData.recognition_level = data.recognition_level as Database['public']['Enums']['relic_recognition_level'];
    if (data.current_conservation_status) dbData.current_conservation_status = data.current_conservation_status as Database['public']['Enums']['conservation_status'];
    if (data.tourism_exploitation_status) dbData.tourism_exploitation_status = data.tourism_exploitation_status as Database['public']['Enums']['relic_tourism_exploitation_status'];
    
    const { data: updatedRelic, error } = await supabase.from('relics').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return { 
      ...updatedRelic,
      relic_type: updatedRelic.relic_type as RelicType,
      recognition_level: updatedRelic.recognition_level as RelicRecognitionLevel,
      current_conservation_status: updatedRelic.current_conservation_status as ConservationStatus | null,
      tourism_exploitation_status: updatedRelic.tourism_exploitation_status as RelicTourismExploitationStatus | null,
    } as Relic;
  },
  delete: async (id: UUID): Promise<boolean> => {
    const { error } = await supabase.from('relics').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

export const eventApi = {
  getAll: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*') 
      .order('start_datetime', { ascending: false });
    if (error) throw error;
    return data.map(e => ({ 
        ...e, 
        event_type: e.event_type as EventType,
        status: e.status as AppEventStatus,
    })) as Event[];
  },
  getById: async (id: UUID): Promise<Event | undefined> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return { 
        ...data, 
        event_type: data.event_type as EventType,
        status: data.status as AppEventStatus,
    } as Event;
  },
  create: async (data: EventFormData): Promise<Event> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['events']['Insert'] = {
      ...data,
      user_id: userId,
      event_type: data.event_type as Database['public']['Enums']['event_type'],
      status: data.status as Database['public']['Enums']['event_status'],
      start_datetime: new Date(data.start_datetime).toISOString(),
      end_datetime: new Date(data.end_datetime).toISOString(),
    };
    const { data: newEvent, error } = await supabase.from('events').insert(dbData).select().single();
    if (error) throw error;
    return { ...newEvent, event_type: newEvent.event_type as EventType, status: newEvent.status as AppEventStatus } as Event;
  },
  update: async (id: UUID, data: Partial<EventFormData>): Promise<Event | undefined> => {
    const dbData: Database['public']['Tables']['events']['Update'] = {...data} as Database['public']['Tables']['events']['Update'];
    if (data.event_type) dbData.event_type = data.event_type as Database['public']['Enums']['event_type'];
    if (data.status) dbData.status = data.status as Database['public']['Enums']['event_status'];
    if (data.start_datetime) dbData.start_datetime = new Date(data.start_datetime).toISOString();
    if (data.end_datetime) dbData.end_datetime = new Date(data.end_datetime).toISOString();
    
    const { data: updatedEvent, error } = await supabase.from('events').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return { ...updatedEvent, event_type: updatedEvent.event_type as EventType, status: updatedEvent.status as AppEventStatus } as Event;
  },
  delete: async (id: UUID): Promise<boolean> => {
    await supabase.from('tasks').delete().eq('related_event_id', id);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

export const tourismDocumentApi = {
  getAll: async (): Promise<TourismDocument[]> => {
    const { data, error } = await supabase
      .from('tourism_documents')
      .select(`
        *,
        file_attachments:tourism_document_file_attachments(*),
        related_documents:tourism_document_relations!tourism_document_relations_source_document_id_fkey(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(td => ({
      ...td,
      document_category: td.document_category as TourismDocumentCategory,
      tourism_sector: td.tourism_sector as TourismSector | null,
      file_attachments: (td.file_attachments || []) as TourismFileAttachment[],
      related_documents: (td.related_documents || []).map(rel => ({
        ...rel,
        relation_type: rel.relation_type as unknown as TourismDocumentRelationType,
      })) as TourismDocumentRelation[],
    })) as TourismDocument[];
  },

  getById: async (id: UUID): Promise<TourismDocument | undefined> => {
    const { data, error } = await supabase
      .from('tourism_documents')
      .select(`
        *,
        file_attachments:tourism_document_file_attachments(*),
        related_documents:tourism_document_relations!tourism_document_relations_source_document_id_fkey(*)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return {
      ...data,
      document_category: data.document_category as TourismDocumentCategory,
      tourism_sector: data.tourism_sector as TourismSector | null,
      file_attachments: (data.file_attachments || []) as TourismFileAttachment[],
      related_documents: (data.related_documents || []).map(rel => ({
        ...rel,
        relation_type: rel.relation_type as unknown as TourismDocumentRelationType,
      })) as TourismDocumentRelation[],
    } as TourismDocument;
  },

  create: async (data: TourismDocumentFormData): Promise<TourismDocument> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['tourism_documents']['Insert'] = {
      ...data,
      user_id: userId,
      document_category: data.document_category as Database['public']['Enums']['tourism_document_category'],
      tourism_sector: data.tourism_sector as Database['public']['Enums']['tourism_sector'] | null,
      tags: data.tagsString?.split(',').map(t => t.trim()).filter(t => t) || null,
    };
    const { data: newDoc, error } = await supabase.from('tourism_documents').insert(dbData).select().single();
    if (error) throw error;
    return { 
        ...newDoc, 
        document_category: newDoc.document_category as TourismDocumentCategory,
        tourism_sector: newDoc.tourism_sector as TourismSector | null,
    } as TourismDocument;
  },

  update: async (id: UUID, data: Partial<TourismDocumentFormData>): Promise<TourismDocument | undefined> => {
    const dbData: Database['public']['Tables']['tourism_documents']['Update'] = {
        ...data,
        tags: data.tagsString?.split(',').map(t => t.trim()).filter(t => t) || undefined, // use undefined if tagsString not present to avoid clearing
    };
    if (data.tagsString === '') dbData.tags = null; // explicitly set to null if tagsString is empty

    if (data.document_category) dbData.document_category = data.document_category as Database['public']['Enums']['tourism_document_category'];
    if (data.tourism_sector !== undefined) dbData.tourism_sector = data.tourism_sector as Database['public']['Enums']['tourism_sector'] | null;
    
    const { data: updatedDoc, error } = await supabase.from('tourism_documents').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return { 
        ...updatedDoc, 
        document_category: updatedDoc.document_category as TourismDocumentCategory,
        tourism_sector: updatedDoc.tourism_sector as TourismSector | null,
    } as TourismDocument;
  },

  delete: async (id: UUID): Promise<boolean> => {
    await supabase.from('tourism_document_file_attachments').delete().eq('tourism_document_id', id);
    const { error } = await supabase.from('tourism_documents').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  addFileAttachment: async (data: TourismFileAttachmentLinkData): Promise<TourismFileAttachment> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['tourism_document_file_attachments']['Insert'] = {
      ...data,
      user_id: userId,
      version: 1, 
    };
    const { data: newAttachment, error } = await supabase.from('tourism_document_file_attachments').insert(dbData).select().single();
    if (error) throw error;
    return newAttachment as TourismFileAttachment;
  },

  deleteFileAttachment: async (attachmentId: UUID): Promise<boolean> => {
    const { error } = await supabase.from('tourism_document_file_attachments').delete().eq('id', attachmentId);
    if (error) throw error;
    return true;
  },

  addDocumentRelation: async (data: TourismDocumentRelationFormData): Promise<TourismDocumentRelation> => {
    const userId = await getCurrentUserId();
    const dbData: Database['public']['Tables']['tourism_document_relations']['Insert'] = {
      ...data,
      user_id: userId,
      relation_type: data.relation_type as unknown as Database['public']['Enums']['tourism_document_relation_type'],
    };
    const { data: newRelation, error } = await supabase.from('tourism_document_relations').insert(dbData).select().single();
    if (error) throw error;
    return {
      ...newRelation,
      relation_type: newRelation.relation_type as unknown as TourismDocumentRelationType,
    } as TourismDocumentRelation;
  },

  deleteDocumentRelation: async (relationId: UUID): Promise<boolean> => {
    const { error } = await supabase.from('tourism_document_relations').delete().eq('id', relationId);
    if (error) throw error;
    return true;
  },
};
