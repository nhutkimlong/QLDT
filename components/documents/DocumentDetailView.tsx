import React, { useState, useEffect, useCallback } from 'react';
import { Document, DocumentRelation, DocumentRelationFormData, DocumentRelationType, FileAttachment, UUID, DocumentRelationInfo, DocumentFormData } from '../../types';
import { documentApi } from '../../services/supabaseService'; 
import { googleDriveService } from '../../services/googleDriveService'; 
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FileAttachmentChip } from './FileAttachmentChip';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Textarea } from '../shared/Textarea';
import { PlusIcon, LinkIcon } from '../../constants';
import { Modal } from '../shared/Modal';
import { geminiService } from '../../services/geminiService';
import { SummarizeDocumentButton } from '../ai/SummarizeDocumentButton';

interface DocumentDetailViewProps {
  documentId: UUID;
  onClose: () => void;
  onDocumentUpdate: (updatedDocument: Document) => void; 
  onPreviewFile: (fileId: string, fileName: string) => void; 
}

const initialRelationFormData: DocumentRelationFormData = {
    source_document_id: '', 
    related_document_id: '',
    relation_type: DocumentRelationType.LienQuanDen,
    description: ''
};

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ documentId, onClose, onDocumentUpdate, onPreviewFile }) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [relationFormData, setRelationFormData] = useState<DocumentRelationFormData>(initialRelationFormData);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fetchDocumentDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedDoc = await documentApi.getById(documentId);
      if (fetchedDoc) {
        setDocument(fetchedDoc);
        setRelationFormData(prev => ({...prev, source_document_id: fetchedDoc.id}));
      } else {
        setError("Không tìm thấy văn bản.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết văn bản:", err);
      setError(err.message || "Không thể tải chi tiết văn bản.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);

  useEffect(() => {
    if (showAddRelationModal && document) { 
        documentApi.getAll().then(docs => {
            const currentRelatedIds = document.related_documents?.map(rd => 
                rd.related_document_id === document.id ? rd.source_document_id : rd.related_document_id
            ) || [];
            setAvailableDocuments(docs.filter(d => d.id !== documentId && !currentRelatedIds.includes(d.id) ));
        });
    }
  }, [showAddRelationModal, documentId, document]);

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
      const driveFile = await googleDriveService.uploadFile(fileToUpload, document.id, 'vanban');
      const newAttachmentData = {
        document_id: document.id,
        google_drive_file_id: driveFile.id,
        file_name: driveFile.name,
        mime_type: driveFile.mimeType,
        size_bytes: driveFile.sizeBytes || 0,
        google_drive_webview_link: driveFile.webViewLink,
        google_drive_download_link: driveFile.downloadLink,
      };
      const savedAttachment = await documentApi.addFileAttachment(newAttachmentData);
      setFileToUpload(null);
      const updatedDoc = {...document, file_attachments: [...(document.file_attachments || []), savedAttachment]};
      setDocument(updatedDoc); 
      onDocumentUpdate(updatedDoc); 
      const fileInput = window.document.getElementById('file-upload-detail') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      alert('Tệp đã được tải lên Google Drive và đính kèm thành công.');
    } catch (uploadError: any) {
      console.error("Lỗi khi tải tệp lên:", uploadError);
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
        const deleteDriveResponse = await fetch('http://localhost:3001/delete-drive-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: attachmentToDelete.google_drive_file_id })
        });

        if (!deleteDriveResponse.ok) {
            const errorBody = await deleteDriveResponse.text();
            throw new Error(`Lỗi xóa file trên Google Drive: ${errorBody}`);
        }
        console.log(`File ${attachmentToDelete.google_drive_file_id} deleted from Drive.`);

        // 2. Delete from Supabase
        await documentApi.deleteFileAttachment(attachmentId);
        
        const updatedAttachments = document.file_attachments?.filter(att => att.id !== attachmentId) || [];
        const updatedDoc = {...document, file_attachments: updatedAttachments};
        setDocument(updatedDoc); 
        onDocumentUpdate(updatedDoc);
        alert("Đã xóa tệp đính kèm thành công cả trên hệ thống và Google Drive.");
    } catch (deleteError: any) {
      console.error("Lỗi khi xóa tệp đính kèm (Document):", deleteError);
      setError(`Không thể xóa tệp đính kèm: ${deleteError.message || String(deleteError)}`);
    }
  };

  const handleRelationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRelationFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !relationFormData.related_document_id) {
        alert("Vui lòng chọn một văn bản để liên kết.");
        return;
    }
    setError(null);
    try {
        const dataToSave = { ...relationFormData, source_document_id: document.id };
        await documentApi.addDocumentRelation(dataToSave);
        setShowAddRelationModal(false);
        setRelationFormData(initialRelationFormData); 
        fetchDocumentDetails(); 
        alert('Liên kết văn bản đã được thêm thành công.');
    } catch (relationError: any) {
        console.error("Lỗi khi thêm liên kết văn bản:", relationError);
        setError(`Không thể thêm liên kết: ${relationError.message || String(relationError)}`);
    }
  };

  const handleDeleteRelation = async (relationId: UUID) => {
    if (!document) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa liên kết văn bản này?")) {
        return;
    }
    setError(null);
    try {
        await documentApi.deleteDocumentRelation(relationId);
        fetchDocumentDetails(); 
        alert('Đã xóa liên kết văn bản.');
    } catch (deleteError: any) {
        console.error("Lỗi khi xóa liên kết:", deleteError);
        setError(`Không thể xóa liên kết: ${deleteError.message || String(deleteError)}`);
    }
  };

  const handleSummarize = async () => {
    if (!document || !document.file_attachments || document.file_attachments.length === 0) {
      alert("Văn bản không có tệp đính kèm để AI xử lý.");
      return;
    }
    
    setIsSummarizing(true);
    setError(null);
    try {
      // Đọc trực tiếp nội dung từ file trên Google Drive
      const summaryText = await geminiService.summarizeDocument('', document.file_attachments);
      
      if (documentApi.update && document.id) { 
         const updatedDocFields = { summary: summaryText };
         await documentApi.update(document.id, updatedDocFields as Partial<DocumentFormData>);
         await fetchDocumentDetails();
      }
      alert("Tóm tắt văn bản đã được AI cập nhật.");
    } catch (e: any) {
      setError(`Tóm tắt thất bại: ${e.message || String(e)}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading && !document) return <div className="p-4"><LoadingSpinner message="Đang tải chi tiết văn bản..." /></div>;
  if (error && !document) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error} <Button onClick={onClose}>Đóng</Button></div>;
  if (!document) return <div className="p-4 text-center">Không tìm thấy văn bản. <Button onClick={onClose}>Đóng</Button></div>;

  const detailItem = (label: string, value?: string | number | string[] | null, isHtml: boolean = false) => {
    let contentToRender: React.ReactNode;

    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
        contentToRender = <span className="text-gray-400">N/A</span>;
    } else if (Array.isArray(value)) {
        contentToRender = value.join(', ');
    } else {
        contentToRender = value; 
    }

    return (
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">{label}</dt>
        {isHtml && typeof contentToRender === 'string' ? (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" dangerouslySetInnerHTML={{ __html: contentToRender }} />
        ) : (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {contentToRender}
            </dd>
        )}
      </div>
    );
  };


  return (
    <div className="bg-white rounded-lg p-6 md:p-4"> 
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      <div className="my-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md text-sm">
          Tệp sẽ được tải lên Google Drive qua Service Account (backend).
      </div>

      <div className="space-y-4">
        <dl className="divide-y divide-gray-200">
          {detailItem("Số hiệu VB", document.document_number)}
          {detailItem("Loại VB", document.document_type)}
          {detailItem("Ngày ban hành", document.issued_date ? new Date(document.issued_date).toLocaleDateString('vi-VN') : null)}
          {detailItem("Ngày nhận", document.received_date ? new Date(document.received_date).toLocaleDateString('vi-VN') : null)}
          {detailItem("Nơi ban hành", document.issuing_organization)}
          {detailItem("Nơi nhận", document.recipient_organization)}
          {detailItem("Độ ưu tiên", document.priority)}
          {detailItem("Trạng thái", document.status)}
          {detailItem("Hạn xử lý", document.due_date ? new Date(document.due_date).toLocaleDateString('vi-VN') : null)}
          {detailItem("Thẻ", document.tags)}
          {detailItem("Người xử lý chính (ID)", document.handler_user_id)}
          {/* {detailItem("Nơi lưu trữ bản gốc", document.physical_storage_location)} Removed */}
          {/* {detailItem("Mã dự án", document.project_code)} Removed */}
        </dl>

        <div className="py-4">
            <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold text-gray-700 mb-1">Tóm tắt nội dung</h4>
                <SummarizeDocumentButton 
                    onClick={handleSummarize} 
                    isSummarizing={isSummarizing} 
                    disabled={!geminiService.isAvailable() || isSummarizing}
                />
            </div>
             <div className="mt-1 text-sm text-gray-800 bg-gray-50 p-3 rounded-md whitespace-pre-wrap min-h-[60px]">
                {document.summary ? (
                    <div className="prose prose-sm max-w-none">
                        {document.summary.split('\n').map((line, index) => {
                            // Bỏ qua các dòng chứa "Lưu ý:", "Yêu cầu hành động:", "Không thể đọc nội dung file"
                            if (line.includes('Lưu ý:') || 
                                line.includes('Yêu cầu hành động:') || 
                                line.includes('Không thể đọc nội dung file')) {
                                return null;
                            }
                            // Xử lý các dòng gạch đầu dòng
                            if (line.trim().startsWith('*')) {
                                return <div key={index} className="ml-4">{line}</div>;
                            }
                            // Xử lý các tiêu đề
                            if (line.trim().endsWith(':')) {
                                return <div key={index} className="font-semibold mt-2">{line}</div>;
                            }
                            return <div key={index}>{line}</div>;
                        })}
                    </div>
                ) : (
                    <span className="text-gray-400">Chưa có tóm tắt.</span>
                )}
            </div>
        </div>

        {/* File Attachments Section */}
        <div className="py-4 border-t mt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">File đính kèm (từ Google Drive)</h4>
          {isLoading && <LoadingSpinner size="sm"/>}
          {!isLoading && document.file_attachments && document.file_attachments.length > 0 ? (
            document.file_attachments.map(att => (
              <FileAttachmentChip 
                key={att.id} 
                attachment={att} 
                onPreview={(fileId, fileName) => onPreviewFile(`https://drive.google.com/file/d/${fileId}/preview`, fileName)}
                onDelete={handleDeleteAttachment} 
               />
            ))
          ) : (
            !isLoading && <p className="text-sm text-gray-500">Không có file đính kèm.</p>
          )}
          <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
            <label htmlFor="file-upload-detail" className="block text-sm font-medium text-gray-700 mb-1">
              Thêm file mới (tải lên Google Drive)
            </label>
            <div className="flex items-center space-x-2">
              <Input 
                type="file" 
                id="file-upload-detail" 
                onChange={handleFileChange} 
                containerClassName="flex-grow mb-0"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isUploading || isLoading}
              />
              <Button onClick={handleUploadAndAttach} disabled={!fileToUpload || isUploading || isLoading} size="sm">
                {isUploading ? <LoadingSpinner size="sm" /> : 'Tải lên & Đính kèm'}
              </Button>
            </div>
            {fileToUpload && <p className="mt-1 text-xs text-gray-500">Đã chọn: {fileToUpload.name}</p>}
          </div>
        </div>

        {/* Document Relations Section */}
        <div className="py-4 border-t mt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-semibold text-gray-700">Văn bản liên quan</h4>
            <Button onClick={() => setShowAddRelationModal(true)} size="sm" leftIcon={<PlusIcon />}  disabled={isLoading}>
              Thêm liên kết
            </Button>
          </div>
          {isLoading && <LoadingSpinner size="sm"/>}
          {!isLoading && document.related_documents && document.related_documents.length > 0 ? (
            <ul className="space-y-2">
              {document.related_documents.map((rel: DocumentRelationInfo) => {
                const isSource = rel.source_document_id === document.id;
                const relatedDocTitle = isSource ? rel.related_document_title : rel.source_document_title;
                const relationText = isSource ? rel.relation_type : `Là ${rel.relation_type?.toLowerCase()} của`;

                return (
                  <li key={rel.id} className="p-2 bg-gray-50 rounded-md flex justify-between items-center text-sm">
                    <div>
                      <LinkIcon />
                      <span className="ml-2">{relationText}: <strong className="text-blue-600">{relatedDocTitle || 'Văn bản không xác định'}</strong></span>
                      {rel.description && <p className="text-xs text-gray-500 ml-6"> - {rel.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRelation(rel.id)} className="text-red-500 hover:text-red-700 p-1" title="Xóa liên kết">Xóa</Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            !isLoading && <p className="text-sm text-gray-500">Không có văn bản nào liên quan.</p>
          )}
        </div>
      </div>

      {showAddRelationModal && (
        <Modal isOpen={showAddRelationModal} onClose={() => setShowAddRelationModal(false)} title="Thêm Liên kết Văn bản">
            <form onSubmit={handleAddRelation}>
                <Select
                    label="Văn bản liên kết"
                    name="related_document_id"
                    value={relationFormData.related_document_id}
                    onChange={handleRelationFormChange}
                    options={availableDocuments.map(d => ({ value: d.id, label: `${d.document_number || 'N/A'} - ${d.title}` }))}
                    required
                />
                <Select
                    label="Loại liên kết"
                    name="relation_type"
                    value={relationFormData.relation_type}
                    onChange={handleRelationFormChange}
                    options={Object.values(DocumentRelationType).map(rt => ({ value: rt, label: rt }))}
                    required
                />
                <Textarea
                    label="Mô tả (Tùy chọn)"
                    name="description"
                    value={relationFormData.description || ''}
                    onChange={handleRelationFormChange}
                />
                <div className="mt-4 flex justify-end space-x-2">
                    <Button type="button" variant="secondary" onClick={() => setShowAddRelationModal(false)}>Hủy</Button>
                    <Button type="submit" variant="primary">Thêm Liên kết</Button>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
};