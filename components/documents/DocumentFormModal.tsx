import React, { useState, useEffect, useCallback } from 'react';
import { 
  Document, DocumentFormData, DocumentType, DocumentStatus, Priority, UUID, FileAttachmentLinkData, FileAttachment,
  DocumentRelationType,
} from '../../types';
import { documentApi } from '../../services/supabaseService'; 
import { googleDriveService } from '../../services/googleDriveService'; 
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Select } from '../shared/Select';
import { DateTimePicker } from '../shared/DateTimePicker';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FileAttachmentChip } from './FileAttachmentChip';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: Document) => void;
  documentToEdit?: Document | null;
  onPreviewFile: (fileId: string, fileName: string) => void; 
}

const initialFormData: DocumentFormData = {
  title: '',
  document_number: '',
  document_type: DocumentType.CongVanDen,
  issued_date: new Date().toISOString().substring(0,10),
  issuing_organization: '',
  priority: Priority.TrungBinh,
  status: DocumentStatus.Moi,
  tagsString: '',
  received_date: null,
  recipient_organization: null,
  due_date: null,
  summary: null,
  tags: [],
  handler_user_id: null,
  // physical_storage_location: null, // Removed
  // project_code: null, // Removed
};

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ isOpen, onClose, onSave, documentToEdit, onPreviewFile }) => {
  const [formData, setFormData] = useState<DocumentFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<FileAttachment[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [relatedDocumentId, setRelatedDocumentId] = useState<string>('');
  
  useEffect(() => {
    if (isOpen) { 
        if (documentToEdit) {
        setFormData({
            title: documentToEdit.title,
            document_number: documentToEdit.document_number,
            document_type: documentToEdit.document_type,
            issued_date: documentToEdit.issued_date.substring(0,10), 
            received_date: documentToEdit.received_date?.substring(0,10) || null,
            issuing_organization: documentToEdit.issuing_organization,
            recipient_organization: documentToEdit.recipient_organization || null,
            priority: documentToEdit.priority,
            status: documentToEdit.status,
            due_date: documentToEdit.due_date?.substring(0,10) || null,
            summary: documentToEdit.summary || null,
            tagsString: documentToEdit.tags?.join(', ') || '',
            tags: documentToEdit.tags || [],
            handler_user_id: documentToEdit.handler_user_id || null,
            // physical_storage_location: documentToEdit.physical_storage_location || null, // Removed
            // project_code: documentToEdit.project_code || null, // Removed
        });
        setCurrentAttachments(documentToEdit.file_attachments || []);
        } else {
        setFormData(initialFormData);
        setCurrentAttachments([]);
        }
        setFilesToUpload([]); 
        setError(null); 
    }
  }, [documentToEdit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      documentApi.getAll().then(docs => {
        setAllDocuments(docs.filter(d => !documentToEdit || d.id !== documentToEdit.id));
      });
    }
  }, [isOpen, documentToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nullabbleFields = [
        'received_date', 'due_date', 'summary', 'recipient_organization', 
        'handler_user_id', 
        // 'physical_storage_location', 'project_code' // Removed
    ];
    setFormData(prev => ({ ...prev, [name]: value === '' && nullabbleFields.includes(name) ? null : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesToUpload(Array.from(e.target.files));
    } else {
      setFilesToUpload([]);
    }
  };

  const handleUploadAndAttach = async () => {
    if (!filesToUpload.length || !documentToEdit?.id) {
      alert("Vui lòng chọn ít nhất một tệp và đảm bảo bạn đang chỉnh sửa một tài liệu hiện có để đính kèm tệp.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      for (const file of filesToUpload) {
        const driveFile = await googleDriveService.uploadFile(file, documentToEdit.id, 'vanban');
        const newAttachmentData: FileAttachmentLinkData = {
          document_id: documentToEdit.id,
          google_drive_file_id: driveFile.id,
          file_name: driveFile.name,
          mime_type: driveFile.mimeType,
          size_bytes: driveFile.sizeBytes || 0,
          google_drive_webview_link: driveFile.webViewLink,
          google_drive_download_link: driveFile.downloadLink,
        };
        const savedAttachment = await documentApi.addFileAttachment(newAttachmentData);
        setCurrentAttachments(prev => [...prev, savedAttachment as FileAttachment]);
      }
      setFilesToUpload([]);
      const fileInput = document.getElementById('file-upload-edit') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      alert('Tệp đã được tải lên Google Drive và đính kèm thành công!');
    } catch (uploadError: any) {
      console.error("Lỗi khi tải tệp lên:", uploadError);
      let errorMsg = `Không thể tải lên tệp: ${String(uploadError)}`;
      if (uploadError && typeof uploadError.message === 'string' && uploadError.message.trim()) {
        errorMsg = `Không thể tải lên tệp: ${uploadError.message}`;
      } else if (uploadError && typeof uploadError.details === 'string' && uploadError.details.trim()) {
        errorMsg = `Không thể tải lên tệp: ${uploadError.details}`;
      }
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let savedDocument: Document | undefined;
      const dataForSupabase: Partial<DocumentFormData> = {
        ...formData,
        tags: formData.tagsString?.split(',').map(t => t.trim()).filter(t => t.length > 0) || null,
      };
      delete (dataForSupabase as any).tagsString; 

      dataForSupabase.issued_date = dataForSupabase.issued_date ? dataForSupabase.issued_date : new Date().toISOString().substring(0,10);
      dataForSupabase.received_date = dataForSupabase.received_date || null;
      dataForSupabase.due_date = dataForSupabase.due_date || null;
      
      if (documentToEdit) {
        savedDocument = await documentApi.update(documentToEdit.id, dataForSupabase);
      } else {
        const createData = dataForSupabase as DocumentFormData;
        if (!createData.title || !createData.document_number || !createData.document_type || !createData.issued_date || !createData.issuing_organization || !createData.priority || !createData.status) {
            throw new Error("Thiếu thông tin bắt buộc để tạo văn bản.");
        }
        savedDocument = await documentApi.create(createData);
        
        if (relatedDocumentId && savedDocument) {
          await documentApi.addDocumentRelation({
            source_document_id: savedDocument.id,
            related_document_id: relatedDocumentId,
            relation_type: DocumentRelationType.LienQuanDen,
            description: '',
          });
        }
        
        if (filesToUpload.length > 0 && savedDocument) {
            setIsUploading(true);
            try {
                for (const file of filesToUpload) {
                    const driveFile = await googleDriveService.uploadFile(file, savedDocument.id, 'vanban');
                    const newAttachmentData: FileAttachmentLinkData = {
                        document_id: savedDocument.id, 
                        google_drive_file_id: driveFile.id,
                        file_name: driveFile.name,
                        mime_type: driveFile.mimeType,
                        size_bytes: driveFile.sizeBytes || 0,
                        google_drive_webview_link: driveFile.webViewLink,
                        google_drive_download_link: driveFile.downloadLink,
                    };
                    await documentApi.addFileAttachment(newAttachmentData); 
                }
                alert(`Tài liệu đã được tạo và tệp đã được tải lên Google Drive và đính kèm.`);
            } catch (uploadErr: any) {
                let uploadErrorMsg = String(uploadErr);
                if (uploadErr && typeof uploadErr.message === 'string' && uploadErr.message.trim()) {
                    uploadErrorMsg = uploadErr.message;
                } else if (uploadErr && typeof uploadErr.details === 'string' && uploadErr.details.trim()) {
                    uploadErrorMsg = uploadErr.details;
                }
                alert(`Tài liệu đã được tạo, nhưng tải tệp lên Google Drive thất bại: ${uploadErrorMsg}. Bạn có thể thử lại bằng cách chỉnh sửa tài liệu.`);
            } finally {
                setIsUploading(false);
                setFilesToUpload([]);
                const fileInput = document.getElementById('file-upload-initial') as HTMLInputElement | null;
                if(fileInput) fileInput.value = '';
            }
        }
      }
      
      if (savedDocument) {
        onSave(savedDocument); 
        handleModalClose(); 
      } else {
        setError("Không thể lưu tài liệu. Phản hồi không có dữ liệu từ máy chủ.");
      }
    } catch (err: any) {
      console.error("Lỗi lưu tài liệu (raw):", err);
      let finalErrorMessage = "Đã xảy ra lỗi không xác định khi lưu tài liệu.";
       if (err) {
        if (typeof err.message === 'string' && err.message.trim()) {
          finalErrorMessage = err.message;
        } else if (err.details && typeof err.details === 'string' && err.details.trim()) { 
          finalErrorMessage = `Lỗi: ${err.message || 'Không rõ'}. Chi tiết: ${err.details}`;
        } else if (typeof err === 'string' && err.trim()) {
          finalErrorMessage = err;
        }
      }
      setError(finalErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setFilesToUpload([]); 
    const fileInputInitial = document.getElementById('file-upload-initial') as HTMLInputElement | null;
    if(fileInputInitial) fileInputInitial.value = '';
    const fileInputEdit = document.getElementById('file-upload-edit') as HTMLInputElement | null;
    if(fileInputEdit) fileInputEdit.value = '';
    onClose(); 
  };


  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={documentToEdit ? 'Chỉnh sửa Văn bản' : 'Thêm mới Văn bản'} size="xl">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="my-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md text-sm">
            Tệp sẽ được tải lên Google Drive qua Service Account (backend).
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Tiêu đề (Trích yếu/Tên tài liệu)" name="title" value={formData.title} onChange={handleChange} required />
            <Input label="Số hiệu văn bản" name="document_number" value={formData.document_number} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select label="Loại văn bản" name="document_type" value={formData.document_type} onChange={handleChange} options={Object.values(DocumentType).map(t => ({value: t, label: t}))} required />
            <Select label="Độ ưu tiên" name="priority" value={formData.priority} onChange={handleChange} options={Object.values(Priority).map(p => ({value: p, label: p}))} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DateTimePicker label="Ngày ban hành" name="issued_date" value={formData.issued_date} onChange={handleChange} required />
            <DateTimePicker label="Ngày nhận (nếu CV đến)" name="received_date" value={formData.received_date || ''} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Nơi ban hành/Cơ quan gửi" name="issuing_organization" value={formData.issuing_organization} onChange={handleChange} required />
            <Input label="Nơi nhận (nếu CV đi)" name="recipient_organization" value={formData.recipient_organization || ''} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select label="Trạng thái" name="status" value={formData.status} onChange={handleChange} options={Object.values(DocumentStatus).map(s => ({value: s, label: s}))} required />
            <DateTimePicker label="Hạn xử lý" name="due_date" value={formData.due_date || ''} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Input label="Người xử lý chính (ID User - Tùy chọn)" name="handler_user_id" value={formData.handler_user_id || ''} onChange={handleChange} placeholder="UUID người dùng" />
           {/* <Input label="Nơi lưu trữ bản gốc" name="physical_storage_location" value={formData.physical_storage_location || ''} onChange={handleChange} /> Removed */}
        </div>
       
        {/* <Input label="Mã dự án (nếu có)" name="project_code" value={formData.project_code || ''} onChange={handleChange} /> Removed */}
        <Input label="Thẻ (phân cách bằng dấu phẩy)" name="tagsString" value={formData.tagsString || ''} onChange={handleChange} placeholder="VD: báo cáo, năm 2024, khẩn" />
        <Textarea label="Tóm tắt nội dung" name="summary" value={formData.summary || ''} onChange={handleChange} rows={4}/>
        
        {!documentToEdit && (
            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
                <label htmlFor="file-upload-initial" className="block text-sm font-medium text-gray-700 mb-1">
                    Đính kèm Tệp (Tùy chọn - Sẽ tải lên Google Drive)
                </label>
                <Input 
                    type="file" 
                    id="file-upload-initial" 
                    onChange={handleFileChange} 
                    multiple
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isLoading || isUploading}
                />
                {filesToUpload.length > 0 && (
                  <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                    {filesToUpload.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
                 <p className="mt-1 text-xs text-gray-500">
                    Tệp sẽ được tải lên Google Drive qua Service Account khi bạn lưu tài liệu.
                </p>
            </div>
        )}

        {documentToEdit && documentToEdit.id && (
             <div className="mt-6 border-t pt-4">
                <h4 className="text-md font-medium text-gray-700 mb-2">Quản lý Đính kèm cho "{documentToEdit.title}"</h4>
                {currentAttachments.length > 0 && (
                    <div className="mb-3">
                        {currentAttachments.map(att => (
                            <FileAttachmentChip 
                                key={att.id} 
                                attachment={att} 
                                onPreview={(fileId, fileName) => onPreviewFile(`https://drive.google.com/file/d/${fileId}/preview`, fileName)}
                                onDelete={async (attId) => {
                                    const attachment = currentAttachments.find(a => a.id === attId);
                                    if (!attachment) return;
                                    try {
                                        // Gọi API backend xóa file Google Drive
                                        await fetch('http://localhost:3001/delete-drive-file', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ fileId: attachment.google_drive_file_id })
                                        });
                                        // Xóa trong database
                                        await documentApi.deleteFileAttachment(attId);
                                        setCurrentAttachments(prev => prev.filter(a => a.id !== attId));
                                    } catch (delError: any) {
                                        let errorMsg = String(delError);
                                        if (delError && typeof delError.message === 'string' && delError.message.trim()) {
                                            errorMsg = delError.message;
                                        } else if (delError && typeof delError.details === 'string' && delError.details.trim()) {
                                            errorMsg = delError.details;
                                        }
                                        setError(`Lỗi xóa đính kèm: ${errorMsg}`);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
                <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-md">
                    <label htmlFor="file-upload-edit" className="block text-sm font-medium text-gray-700 mb-1">
                        Tải lên Tệp mới (lên Google Drive)
                    </label>
                    <div className="flex items-center space-x-2">
                        <Input 
                            type="file" 
                            id="file-upload-edit" 
                            onChange={handleFileChange} 
                            multiple
                            containerClassName="flex-grow mb-0"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={isUploading || isLoading}
                        />
                        <Button type="button" onClick={handleUploadAndAttach} disabled={filesToUpload.length === 0 || isUploading || isLoading} size="sm">
                            {isUploading ? <LoadingSpinner size="sm" /> : 'Tải lên & Đính kèm'}
                        </Button>
                    </div>
                    {filesToUpload.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                        {filesToUpload.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                </div>
            </div>
        )}

        {!documentToEdit && (
          <div className="mt-4">
            <Select
              label="Văn bản liên quan (nếu có)"
              name="related_document_id"
              value={relatedDocumentId}
              onChange={e => setRelatedDocumentId(e.target.value)}
              options={[{ value: '', label: '-- Không chọn --' }, ...allDocuments.map(d => ({ value: d.id, label: `${d.document_number || 'N/A'} - ${d.title}` }))]}
            />
            <p className="text-xs text-gray-500 mt-1">Nếu chọn, văn bản này sẽ được liên kết với văn bản đã chọn.</p>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={handleModalClose} disabled={isLoading || isUploading}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={isLoading || isUploading}>
            {(isLoading || isUploading) ? <LoadingSpinner size="sm" /> : (documentToEdit ? 'Lưu thay đổi' : 'Tạo Văn bản')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};