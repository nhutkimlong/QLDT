import React, { useState, useEffect } from 'react';
import { 
  TourismDocument, TourismDocumentFormData, TourismDocumentCategory, TourismSector, 
  TourismFileAttachment, TourismFileAttachmentLinkData, UUID, TourismDocumentRelationType
} from '../../types';
import { tourismDocumentApi } from '../../services/supabaseService'; 
import { googleDriveService } from '../../services/googleDriveService';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Select } from '../shared/Select';
import { DateTimePicker } from '../shared/DateTimePicker';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FileAttachmentChip } from '../documents/FileAttachmentChip'; 

interface TourismDocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: TourismDocument) => void;
  documentToEdit?: TourismDocument | null;
  onPreviewFile: (fileId: string, fileName: string) => void; 
}

const initialFormData: TourismDocumentFormData = {
  title: '',
  document_number: '',
  document_category: TourismDocumentCategory.ThongTu,
  issuing_organization: '',
  issued_date: new Date().toISOString().substring(0,10),
  effective_date: null,
  expiry_date: null,
  tourism_sector: null,
  legal_basis: null,
  summary: null,
  applicable_entities: null,
  tagsString: '',
};

export const TourismDocumentFormModal: React.FC<TourismDocumentFormModalProps> = ({ isOpen, onClose, onSave, documentToEdit, onPreviewFile }) => {
  const [formData, setFormData] = useState<TourismDocumentFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<TourismFileAttachment[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [allDocuments, setAllDocuments] = useState<TourismDocument[]>([]);
  const [relatedDocumentId, setRelatedDocumentId] = useState<string>('');
  const [relationType, setRelationType] = useState<TourismDocumentRelationType>(TourismDocumentRelationType.LienQuanDen);
  
  useEffect(() => {
    if (isOpen) {
      tourismDocumentApi.getAll().then(docs => {
        setAllDocuments(docs.filter(d => !documentToEdit || d.id !== documentToEdit.id));
      });
    }
  }, [isOpen, documentToEdit]);

  useEffect(() => {
    if (isOpen) { 
        if (documentToEdit) {
        setFormData({
            title: documentToEdit.title,
            document_number: documentToEdit.document_number,
            document_category: documentToEdit.document_category,
            issuing_organization: documentToEdit.issuing_organization,
            issued_date: documentToEdit.issued_date.substring(0,10), 
            effective_date: documentToEdit.effective_date?.substring(0,10) || null,
            expiry_date: documentToEdit.expiry_date?.substring(0,10) || null,
            tourism_sector: documentToEdit.tourism_sector || null,
            legal_basis: documentToEdit.legal_basis || null,
            summary: documentToEdit.summary || null,
            applicable_entities: documentToEdit.applicable_entities || null,
            tagsString: documentToEdit.tags?.join(', ') || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nullableFields = [
        'effective_date', 'expiry_date', 'tourism_sector', 'legal_basis', 'summary', 'applicable_entities'
    ];
    setFormData(prev => ({ ...prev, [name]: value === '' && nullableFields.includes(name) ? null : value }));
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
      alert("Vui lòng chọn ít nhất một tệp và đảm bảo bạn đang chỉnh sửa một tài liệu hiện có.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      for (const file of filesToUpload) {
        const driveFile = await googleDriveService.uploadFile(file, documentToEdit.id, 'vanbandulich');
        const newAttachmentData: TourismFileAttachmentLinkData = {
          tourism_document_id: documentToEdit.id,
          google_drive_file_id: driveFile.id,
          file_name: driveFile.name,
          mime_type: driveFile.mimeType,
          size_bytes: driveFile.sizeBytes || 0,
          google_drive_webview_link: driveFile.webViewLink,
          google_drive_download_link: driveFile.downloadLink,
        };
        const savedAttachment = await tourismDocumentApi.addFileAttachment(newAttachmentData);
        setCurrentAttachments(prev => [...prev, savedAttachment]);
      }
      setFilesToUpload([]);
      const fileInput = document.getElementById('tourism-file-upload-edit') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      alert('Tệp đã được tải lên và đính kèm thành công!');
    } catch (uploadError: any) {
      console.error("Lỗi khi tải tệp lên (TourismDocFormModal):", uploadError);
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
      let savedDocument: TourismDocument | undefined;
      const dataForSupabase: Partial<TourismDocumentFormData> = {
        ...formData,
        tags: formData.tagsString?.split(',').map(t => t.trim()).filter(t => t.length > 0) || null,
      };
      delete (dataForSupabase as any).tagsString; 

      if (documentToEdit) {
        savedDocument = await tourismDocumentApi.update(documentToEdit.id, dataForSupabase);
      } else {
        const createData = dataForSupabase as TourismDocumentFormData;
        if (!createData.title || !createData.document_number || !createData.document_category || !createData.issued_date || !createData.issuing_organization) {
            throw new Error("Thiếu thông tin bắt buộc để tạo văn bản.");
        }
        savedDocument = await tourismDocumentApi.create(createData);
        
        if (relatedDocumentId && savedDocument) {
          await tourismDocumentApi.addDocumentRelation({
            source_document_id: savedDocument.id,
            related_document_id: relatedDocumentId,
            relation_type: relationType,
            description: '',
          });
        }
        
        if (filesToUpload.length > 0 && savedDocument) {
            setIsUploading(true);
            try {
                for (const file of filesToUpload) {
                    const driveFile = await googleDriveService.uploadFile(file, savedDocument.id, 'vanban');
                    const newAttachmentData: TourismFileAttachmentLinkData = {
                        tourism_document_id: savedDocument.id, 
                        google_drive_file_id: driveFile.id,
                        file_name: driveFile.name,
                        mime_type: driveFile.mimeType,
                        size_bytes: driveFile.sizeBytes || 0,
                        google_drive_webview_link: driveFile.webViewLink,
                        google_drive_download_link: driveFile.downloadLink,
                    };
                    await tourismDocumentApi.addFileAttachment(newAttachmentData); 
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
                const fileInput = document.getElementById('tourism-file-upload-initial') as HTMLInputElement | null;
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
    const fileInputInitial = document.getElementById('tourism-file-upload-initial') as HTMLInputElement | null;
    if(fileInputInitial) fileInputInitial.value = '';
    const fileInputEdit = document.getElementById('tourism-file-upload-edit') as HTMLInputElement | null;
    if(fileInputEdit) fileInputEdit.value = '';
    onClose(); 
  };


  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={documentToEdit ? 'Chỉnh sửa Văn bản Du lịch' : 'Thêm mới Văn bản Du lịch'} size="xl">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="my-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md text-sm">
            Tệp sẽ được tải lên Google Drive qua Service Account (backend).
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Tiêu đề văn bản" name="title" value={formData.title} onChange={handleChange} required />
            <Input label="Số hiệu văn bản" name="document_number" value={formData.document_number} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select label="Loại văn bản du lịch" name="document_category" value={formData.document_category} onChange={handleChange} options={Object.values(TourismDocumentCategory).map(t => ({value: t, label: t}))} required />
            <Select label="Lĩnh vực du lịch (Tùy chọn)" name="tourism_sector" value={formData.tourism_sector || ''} onChange={handleChange} options={Object.values(TourismSector).map(s => ({value: s, label: s}))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DateTimePicker label="Ngày ban hành" name="issued_date" value={formData.issued_date} onChange={handleChange} required />
            <Input label="Cơ quan ban hành" name="issuing_organization" value={formData.issuing_organization} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DateTimePicker label="Ngày hiệu lực (Tùy chọn)" name="effective_date" value={formData.effective_date || ''} onChange={handleChange} />
            <DateTimePicker label="Ngày hết hiệu lực (Tùy chọn)" name="expiry_date" value={formData.expiry_date || ''} onChange={handleChange} />
        </div>
       
        <Input label="Thẻ (phân cách bằng dấu phẩy)" name="tagsString" value={formData.tagsString || ''} onChange={handleChange} placeholder="VD: du lịch, quy hoạch, xúc tiến" />
        <Textarea label="Căn cứ pháp lý (Tùy chọn)" name="legal_basis" value={formData.legal_basis || ''} onChange={handleChange} rows={3}/>
        <Textarea label="Tóm tắt nội dung (Tùy chọn)" name="summary" value={formData.summary || ''} onChange={handleChange} rows={4}/>
        <Textarea label="Đối tượng áp dụng (Tùy chọn)" name="applicable_entities" value={formData.applicable_entities || ''} onChange={handleChange} rows={3}/>
        
        {!documentToEdit && (
            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
                <label htmlFor="tourism-file-upload-initial" className="block text-sm font-medium text-gray-700 mb-1">
                    Đính kèm Tệp (Tùy chọn - Sẽ tải lên Google Drive)
                </label>
                <Input 
                    type="file" 
                    id="tourism-file-upload-initial" 
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
                                    try {
                                        await tourismDocumentApi.deleteFileAttachment(attId);
                                        setCurrentAttachments(prev => prev.filter(a => a.id !== attId));
                                    } catch (delError: any) {
                                        setError(`Lỗi xóa đính kèm: ${delError.message || String(delError)}`);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
                <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-md">
                    <label htmlFor="tourism-file-upload-edit" className="block text-sm font-medium text-gray-700 mb-1">
                        Tải lên Tệp mới
                    </label>
                    <div className="flex items-center space-x-2">
                        <Input 
                            type="file" 
                            id="tourism-file-upload-edit" 
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Select
                label="Văn bản liên quan (nếu có)"
                name="related_document_id"
                value={relatedDocumentId}
                onChange={e => setRelatedDocumentId(e.target.value)}
                options={[{ value: '', label: '-- Không chọn --' }, ...allDocuments.map(d => ({ value: d.id, label: `${d.document_number || 'N/A'} - ${d.title}` }))]}
              />
              <Select
                label="Loại liên kết"
                name="relation_type"
                value={relationType}
                onChange={e => setRelationType(e.target.value as TourismDocumentRelationType)}
                options={Object.values(TourismDocumentRelationType).map(t => ({value: t, label: t}))}
                disabled={!relatedDocumentId}
              />
            </div>
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
