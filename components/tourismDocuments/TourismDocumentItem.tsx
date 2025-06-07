import React from 'react';
import { TourismDocument, TourismDocumentCategory } from '../../types';
import { EditIcon, TrashIcon, EyeIcon, PaperClipIcon } from '../../constants';
import { Button } from '../shared/Button';

interface TourismDocumentItemProps {
  document: TourismDocument;
  onView: (document: TourismDocument) => void;
  onEdit: (document: TourismDocument) => void;
  onDelete: (documentId: string) => void;
}

const getCategoryStyle = (category: TourismDocumentCategory): string => {
  // Simple styling, can be expanded
  switch (category) {
    case TourismDocumentCategory.Luat:
    case TourismDocumentCategory.NghiDinh:
      return 'bg-blue-100 text-blue-800';
    case TourismDocumentCategory.ThongTu:
      return 'bg-green-100 text-green-800';
    case TourismDocumentCategory.QuyetDinh:
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const TourismDocumentItem: React.FC<TourismDocumentItemProps> = ({ document, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer truncate" 
            onClick={() => onView(document)}
            title={document.title}
          >
            {document.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryStyle(document.document_category)}`}>
            {document.document_category}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Số hiệu:</span> {document.document_number}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Ngày BH:</span> {new Date(document.issued_date).toLocaleDateString('vi-VN')}
          {document.effective_date && <span className="ml-2"><span className="font-medium">Hiệu lực:</span> {new Date(document.effective_date).toLocaleDateString('vi-VN')}</span>}
        </p>
        <p className="text-sm text-gray-600 mb-1 truncate" title={document.issuing_organization}>
          <span className="font-medium">Nơi BH:</span> {document.issuing_organization}
        </p>
         {document.tourism_sector && (
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium">Lĩnh vực:</span> {document.tourism_sector}
          </p>
        )}
        {document.file_attachments && document.file_attachments.length > 0 && (
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <PaperClipIcon /> <span className="ml-1">{document.file_attachments.length} tệp đính kèm</span>
          </div>
        )}
        {document.tags && document.tags.length > 0 && (
          <div className="mt-2">
            {document.tags.map(tag => (
              <span key={tag} className="inline-block bg-purple-100 text-purple-700 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(document)} title="Xem chi tiết"><EyeIcon /></Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(document)} title="Chỉnh sửa văn bản"><EditIcon /></Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa văn bản du lịch này?')) {
                onDelete(document.id);
              }
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Xóa văn bản"
        >
            <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
