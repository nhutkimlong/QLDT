import React from 'react';
import { FileAttachment, TourismFileAttachment } from '../../types';
import { PaperClipIcon, TrashIcon, EyeIcon, MagnifyingGlassIcon } from '../../constants';
import { Button } from '../shared/Button';

interface FileAttachmentChipProps {
  attachment: FileAttachment | TourismFileAttachment; // Union type
  onDelete?: (attachmentId: string) => void;
  showDelete?: boolean;
  onPreview?: (fileId: string, fileName: string) => void; // For opening in-app viewer
}

export const FileAttachmentChip: React.FC<FileAttachmentChipProps> = ({ attachment, onDelete, showDelete = true, onPreview }) => {
  const fileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(attachment.google_drive_file_id, attachment.file_name);
    }
  };

  return (
    <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between text-sm mb-2 shadow-sm hover:shadow">
      <div className="flex items-center overflow-hidden">
        <PaperClipIcon />
        <span
          title={attachment.file_name}
          className="ml-2 text-gray-700 truncate" // Keep it as span, link is separate now
        >
          {attachment.file_name}
        </span>
        <span className="ml-2 text-gray-500 hidden sm:inline">({fileSize(attachment.size_bytes)})</span>
      </div>
      <div className="flex items-center space-x-1 flex-shrink-0">
        {onPreview && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePreview}
            title="Xem trước trong ứng dụng"
            className="p-1 text-blue-600 hover:bg-blue-100"
          >
            <MagnifyingGlassIcon />
          </Button>
        )}
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(attachment.google_drive_webview_link, '_blank')}
            title="Mở trên Google Drive"
            className="p-1 text-green-600 hover:bg-green-100"
        >
            <EyeIcon />
        </Button>
        {showDelete && onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa tệp đính kèm này?')) {
                onDelete(attachment.id);
              }
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1"
            title="Xóa đính kèm"
          >
            <TrashIcon />
          </Button>
        )}
      </div>
    </div>
  );
};
