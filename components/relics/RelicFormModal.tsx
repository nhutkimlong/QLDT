
import React, { useState, useEffect } from 'react';
import { 
  Relic, RelicFormData, RelicType, RelicRecognitionLevel, RelicTourismExploitationStatus, 
  ConservationStatus, UUID 
} from '../../types';
import { relicApi } from '../../services/supabaseService';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Select } from '../shared/Select';
import { DateTimePicker } from '../shared/DateTimePicker';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface RelicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (relic: Relic) => void;
  relicToEdit?: Relic | null;
}

const initialFormData: RelicFormData = {
  name: '',
  relic_type: RelicType.DiTichLichSu,
  recognition_level: RelicRecognitionLevel.ChuaXepHang,
  location_description: '',
  established_date: null,
  short_description: null,
  historical_cultural_value: null,
  current_conservation_status: null,
  protection_zone_details: null,
  management_unit_responsible: null,
  last_inspection_date: null,
  tourism_exploitation_status: null,
  main_image_url: null,
  notes: null,
};

export const RelicFormModal: React.FC<RelicFormModalProps> = ({ isOpen, onClose, onSave, relicToEdit }) => {
  const [formData, setFormData] = useState<RelicFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (relicToEdit) {
        setFormData({
          name: relicToEdit.name,
          relic_type: relicToEdit.relic_type,
          recognition_level: relicToEdit.recognition_level,
          location_description: relicToEdit.location_description,
          established_date: relicToEdit.established_date || null,
          short_description: relicToEdit.short_description || null,
          historical_cultural_value: relicToEdit.historical_cultural_value || null,
          current_conservation_status: relicToEdit.current_conservation_status || null,
          protection_zone_details: relicToEdit.protection_zone_details || null,
          management_unit_responsible: relicToEdit.management_unit_responsible || null,
          last_inspection_date: relicToEdit.last_inspection_date || null,
          tourism_exploitation_status: relicToEdit.tourism_exploitation_status || null,
          main_image_url: relicToEdit.main_image_url || null,
          notes: relicToEdit.notes || null,
        });
      } else {
        setFormData(initialFormData);
      }
      setError(null);
    }
  }, [relicToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nullableFields = [
        'established_date', 'short_description', 'historical_cultural_value', 'current_conservation_status',
        'protection_zone_details', 'management_unit_responsible', 'last_inspection_date', 
        'tourism_exploitation_status', 'main_image_url', 'notes'
    ];
    setFormData(prev => ({ ...prev, [name]: value === '' && nullableFields.includes(name) ? null : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.name || !formData.relic_type || !formData.recognition_level || !formData.location_description) {
        setError("Tên, loại hình, cấp độ công nhận và địa điểm là các trường bắt buộc.");
        setIsLoading(false);
        return;
    }

    try {
      let savedRelic: Relic | undefined;
      const dataToSave: RelicFormData = {
        ...formData,
        established_date: formData.established_date || null,
        last_inspection_date: formData.last_inspection_date || null,
      };

      if (relicToEdit) {
        savedRelic = await relicApi.update(relicToEdit.id, dataToSave);
      } else {
        savedRelic = await relicApi.create(dataToSave);
      }
      
      if (savedRelic) {
        onSave(savedRelic);
        onClose();
      } else {
        setError("Không thể lưu thông tin di tích. Phản hồi không có dữ liệu.");
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu di tích:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định khi lưu di tích.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={relicToEdit ? 'Chỉnh sửa Di tích' : 'Thêm mới Di tích'} size="xl">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label="Tên di tích" name="name" value={formData.name} onChange={handleChange} required />
            <Select 
                label="Loại hình di tích" 
                name="relic_type" 
                value={formData.relic_type} 
                onChange={handleChange} 
                options={Object.values(RelicType).map(t => ({value: t, label: t}))} 
                required 
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select 
                label="Cấp độ công nhận" 
                name="recognition_level" 
                value={formData.recognition_level} 
                onChange={handleChange} 
                options={Object.values(RelicRecognitionLevel).map(l => ({value: l, label: l}))} 
                required 
            />
            <Input label="Địa điểm/Khu vực" name="location_description" value={formData.location_description} onChange={handleChange} required />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DateTimePicker label="Ngày phát hiện/ghi nhận" name="established_date" value={formData.established_date || ''} onChange={handleChange} />
            <Input label="Đơn vị quản lý trực tiếp" name="management_unit_responsible" value={formData.management_unit_responsible || ''} onChange={handleChange} />
        </div>

        <Textarea label="Mô tả sơ lược" name="short_description" value={formData.short_description || ''} onChange={handleChange} rows={2}/>
        <Textarea label="Giá trị Lịch sử, Văn hóa, Khoa học" name="historical_cultural_value" value={formData.historical_cultural_value || ''} onChange={handleChange} rows={3}/>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Select 
                label="Tình trạng bảo tồn hiện tại" 
                name="current_conservation_status" 
                value={formData.current_conservation_status || ''} 
                onChange={handleChange} 
                options={Object.values(ConservationStatus).map(s => ({value: s, label: s}))} 
            />
            <DateTimePicker label="Ngày kiểm kê/khảo sát gần nhất" name="last_inspection_date" value={formData.last_inspection_date || ''} onChange={handleChange} />
        </div>

        <Textarea label="Chi tiết Khu vực bảo vệ (KV I, II, Vùng đệm)" name="protection_zone_details" value={formData.protection_zone_details || ''} onChange={handleChange} rows={3}/>
        
        <Select 
            label="Tình trạng khai thác du lịch" 
            name="tourism_exploitation_status" 
            value={formData.tourism_exploitation_status || ''} 
            onChange={handleChange} 
            options={Object.values(RelicTourismExploitationStatus).map(s => ({value: s, label: s}))} 
        />
        
        <Input label="URL Ảnh đại diện" name="main_image_url" value={formData.main_image_url || ''} onChange={handleChange} type="url" placeholder="https://example.com/image.jpg"/>
        <Textarea label="Ghi chú thêm" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}/>

        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : (relicToEdit ? 'Lưu thay đổi' : 'Tạo Di tích')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
