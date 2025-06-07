
import React from 'react';
import { Modal } from './Modal'; // Assuming Modal is in the same directory

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xem trước: ${fileName}`} size="xl">
      <div className="w-full h-[75vh]"> {/* Responsive height */}
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title={fileName}
          allow="fullscreen"
        >
          Trình duyệt của bạn không hỗ trợ iframe.
        </iframe>
      </div>
    </Modal>
  );
};
