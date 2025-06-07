
import React from 'react';
import { TourismDocument } from '../../types';
import { TourismDocumentItem } from './TourismDocumentItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { BookOpenIcon } from '../../constants';

interface TourismDocumentListProps {
  documents: TourismDocument[];
  isLoading: boolean;
  error?: string | null;
  onViewDocument: (document: TourismDocument) => void;
  onEditDocument: (document: TourismDocument) => void;
  onDeleteDocument: (documentId: string) => void;
  onAddNew: () => void;
}

export const TourismDocumentList: React.FC<TourismDocumentListProps> = ({
  documents,
  isLoading,
  error,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onAddNew
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách văn bản du lịch..." />;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error}</div>;
  }

  if (documents.length === 0) {
    return <EmptyState 
        message="Chưa có văn bản du lịch nào. Bắt đầu bằng cách thêm mới."
        icon={<BookOpenIcon/>}
        actionButton={<button onClick={onAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm Văn bản Du lịch</button>}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map(doc => (
        <TourismDocumentItem
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
