
import React from 'react';
import { Document } from '../../types';
import { DocumentItem } from './DocumentItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { DocumentTextIcon } from '../../constants';

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  error?: string | null;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => void;
  onAddNew: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  error,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onAddNew
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách văn bản..." />;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error}</div>;
  }

  if (documents.length === 0) {
    return <EmptyState 
        message="Chưa có văn bản nào. Bắt đầu bằng cách thêm mới."
        icon={<DocumentTextIcon/>}
        actionButton={<button onClick={onAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm Văn bản Mới</button>}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onView={onViewDocument}
          onEdit={onEditDocument}
          onDelete={onDeleteDocument}
        />
      ))}
    </div>
  );
};
