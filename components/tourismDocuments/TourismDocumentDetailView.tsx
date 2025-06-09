import React, { useState, useEffect, useCallback } from 'react';
import { TourismDocument, TourismFileAttachmentLinkData, TourismFileAttachment, UUID, TourismDocumentFormData } from '../../types';
import { tourismDocumentApi } from '../../services/supabaseService'; 
import { googleDriveService } from '../../services/googleDriveService';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FileAttachmentChip } from '../documents/FileAttachmentChip'; 
import { Input } from '../shared/Input';
import { PaperClipIcon } from '../../constants';
import { geminiService } from '../../services/geminiService';
import { SummarizeDocumentButton } from '../ai/SummarizeDocumentButton';

interface TourismDocumentDetailViewProps {
  documentId: UUID;
  onClose: () => void;
  onDocumentUpdate: (updatedDocument: TourismDocument) => void; 
  onPreviewFile: (fileUrl: string, fileName: string) => void;
  onViewRelatedDocument: (documentId: UUID) => void;
}

export const TourismDocumentDetailView: React.FC<TourismDocumentDetailViewProps> = ({ 
  documentId, 
  onClose, 
  onDocumentUpdate, 
  onPreviewFile,
  onViewRelatedDocument 
}) => {
  const [document, setDocument] = useState<TourismDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDocuments, setAllDocuments] = useState<TourismDocument[]>([]);
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const fetchDocumentDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedDoc = await tourismDocumentApi.getById(documentId);
      if (fetchedDoc) {
        setDocument(fetchedDoc);
      } else {
        setError("Không tìm thấy văn bản du lịch.");
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải chi tiết văn bản du lịch.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocumentDetails();
    tourismDocumentApi.getAll().then(docs => {
      setAllDocuments(docs);
    });
  }, [fetchDocumentDetails]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    } else {
      setFileToUpload(null);
    }
  };

  const handleUploadAndAttach = async () => {
    if (!fileToUpload || !document) return;
    setIsUploading(true);
    setError(null);
    try {
      const driveFile = await googleDriveService.uploadFile(fileToUpload, document.id, 'vanbandulich');
      const newAttachmentData: TourismFileAttachmentLinkData = {
        tourism_document_id: document.id,
        google_drive_file_id: driveFile.id,
        file_name: driveFile.name,
        mime_type: driveFile.mimeType,
        size_bytes: driveFile.sizeBytes || 0,
        google_drive_webview_link: driveFile.webViewLink,
        google_drive_download_link: driveFile.downloadLink,
      };
      const savedAttachment = await tourismDocumentApi.addFileAttachment(newAttachmentData);
      setFileToUpload(null);
      const updatedDoc = {...document, file_attachments: [...(document.file_attachments || []), savedAttachment]};
      setDocument(updatedDoc); 
      onDocumentUpdate(updatedDoc); 
      const fileInput = window.document.getElementById('tourism-file-upload-detail') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      alert('Tệp đã được tải lên và đính kèm thành công.');
    } catch (uploadError: any) {
      setError(`Không thể tải tệp lên: ${uploadError.message || String(uploadError)}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteAttachment = async (attachmentId: UUID) => {
    if (!document) return;

    const attachmentToDelete = document.file_attachments?.find(att => att.id === attachmentId);
    if (!attachmentToDelete) {
        setError("Không tìm thấy tệp đính kèm để xóa.");
        return;
    }

    // Confirmation is handled by FileAttachmentChip, but we re-confirm for Drive deletion
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tệp "${attachmentToDelete.file_name}" cả trong hệ thống và trên Google Drive không?`)) {
        return;
    }

    setError(null);
    try {
      // 1. Delete from Google Drive
      const deleteDriveResponse = await googleDriveService.deleteFile(attachmentToDelete.google_drive_file_id);

      if (!deleteDriveResponse.ok) {
        const errorBody = await deleteDriveResponse.text();
        throw new Error(`Lỗi xóa file trên Google Drive: ${errorBody}`);
      }
      console.log(`File ${attachmentToDelete.google_drive_file_id} deleted from Drive.`);

      // 2. Delete from Supabase
      await tourismDocumentApi.deleteFileAttachment(attachmentId);
      
      const updatedAttachments = document.file_attachments?.filter(att => att.id !== attachmentId) || [];
      const updatedDoc = {...document, file_attachments: updatedAttachments};
      setDocument(updatedDoc); 
      onDocumentUpdate(updatedDoc);
      alert("Đã xóa tệp đính kèm thành công cả trên hệ thống và Google Drive.");

    } catch (deleteError: any) {
      console.error("Lỗi khi xóa tệp đính kèm (Tourism):", deleteError);
      setError(`Không thể xóa tệp đính kèm: ${deleteError.message || String(deleteError)}`);
    }
  };

  const handleSummarize = async () => {
    if (!document) return;
    if (!document.summary && (!document.file_attachments || document.file_attachments.length === 0) && !document.title) {
      alert("Văn bản du lịch không có đủ thông tin (tiêu đề, tóm tắt, hoặc tệp đính kèm) để AI xử lý. Bạn có thể tự nhập tóm tắt.");
      return;
    }
    let contentToSummarize = `Tiêu đề văn bản du lịch: \"${document.title}\".`;
    if (document.summary) {
      contentToSummarize += `\nTóm tắt hiện có: ${document.summary}.`;
    }
    if (document.file_attachments && document.file_attachments.length > 0) {
      // Lấy toàn bộ extractedText của các file đính kèm
      const extractedTexts = document.file_attachments
        .map((att: any) => att.extractedText)
        .filter((txt: string | undefined) => !!txt);
      if (extractedTexts.length > 0) {
        contentToSummarize += `\nNội dung các file đính kèm:\n${extractedTexts.join('\n---\n')}`;
      } else {
        contentToSummarize += `\nVăn bản này có ${document.file_attachments.length} tệp đính kèm, nhưng chưa trích xuất được nội dung. Hãy tóm tắt dựa trên các thông tin đã cung cấp.`;
      }
    } else {
      contentToSummarize += `\nHãy tóm tắt văn bản này dựa trên tiêu đề và tóm tắt hiện có (nếu có).`;
    }
    setIsSummarizing(true);
    setError(null);
    try {
      const summaryText = await geminiService.summarizeDocument(contentToSummarize);
      const updatedDocFields: Partial<TourismDocumentFormData> = { summary: summaryText };
      await tourismDocumentApi.update(document.id, updatedDocFields);
      await fetchDocumentDetails();
      alert("Tóm tắt văn bản du lịch đã được AI cập nhật.");
    } catch (e: any) {
      setError(`Tóm tắt thất bại: ${e.message || String(e)}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePreviewFileInApp = (googleDriveFileId: string, fileName: string) => {
    const embedUrl = `https://drive.google.com/file/d/${googleDriveFileId}/preview`;
    onPreviewFile(embedUrl, fileName);
  };


  if (isLoading && !document) return <div className="p-4"><LoadingSpinner message="Đang tải chi tiết văn bản..." /></div>;
  if (error && !document) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error} <Button onClick={onClose}>Đóng</Button></div>;
  if (!document) return <div className="p-4 text-center">Không tìm thấy văn bản. <Button onClick={onClose}>Đóng</Button></div>;

  const detailItem = (label: string, value?: string | number | string[] | null, isHtml: boolean = false) => {
    let contentToRender: React.ReactNode = value;
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        contentToRender = <span className="text-gray-400">N/A</span>;
    } else if (Array.isArray(value)) {
        contentToRender = value.join(', ');
    }
    return (
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">{label}</dt>
        {isHtml && typeof contentToRender === 'string' ? (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: contentToRender }} />
        ) : (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{contentToRender}</dd>
        )}
      </div>
    );
  };

  const canSummarize = geminiService.isAvailable() && document && (!!document.summary || (document.file_attachments && document.file_attachments.length > 0) || !!document.title);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {isLoading ? (
        <LoadingSpinner message="Đang tải chi tiết văn bản du lịch..." />
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      ) : document ? (
        <div>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{document.title}</h2>
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Số hiệu:</span> {document.document_number}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Loại văn bản:</span> {document.document_category}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Ngày ban hành:</span> {new Date(document.issued_date).toLocaleDateString('vi-VN')}
              </p>
              {document.effective_date && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Ngày có hiệu lực:</span> {new Date(document.effective_date).toLocaleDateString('vi-VN')}
                </p>
              )}
              {document.expiry_date && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Ngày hết hiệu lực:</span> {new Date(document.expiry_date).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Nơi ban hành:</span> {document.issuing_organization}
              </p>
              {document.tourism_sector && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Lĩnh vực:</span> {document.tourism_sector}
                </p>
              )}
              {document.legal_basis && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Căn cứ pháp lý:</span> {document.legal_basis}
                </p>
              )}
              {document.applicable_entities && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Đối tượng áp dụng:</span> {document.applicable_entities}
                </p>
              )}
            </div>
          </div>

          {document.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tóm tắt nội dung</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{document.summary}</p>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Thẻ</h3>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {document.related_documents && document.related_documents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Văn bản liên quan</h3>
              <div className="space-y-2">
                {document.related_documents.map(relation => (
                  <div key={relation.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {relation.relation_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {allDocuments.find((d: TourismDocument) => d.id === relation.related_document_id)?.title || 'Văn bản không tìm thấy'}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const relatedDoc = allDocuments.find((d: TourismDocument) => d.id === relation.related_document_id);
                          if (relatedDoc) {
                            onClose();
                            onViewRelatedDocument(relatedDoc.id);
                          }
                        }}
                      >
                        Xem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {document.file_attachments && document.file_attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tệp đính kèm</h3>
              <div className="space-y-2">
                {document.file_attachments.map(attachment => (
                  <FileAttachmentChip
                    key={attachment.id}
                    attachment={attachment}
                    onPreview={() => onPreviewFile(attachment.google_drive_webview_link, attachment.file_name)}
                    onDelete={async () => {
                      try {
                        await handleDeleteAttachment(attachment.id);
                      } catch (err: any) {
                        alert(`Lỗi xóa tệp đính kèm: ${err.message}`);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};