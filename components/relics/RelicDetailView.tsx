

import React, { useState, useEffect, useCallback } from 'react';
import { Relic, UUID } from '../../types';
import { relicApi } from '../../services/supabaseService';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface RelicDetailViewProps {
  relicId: UUID;
  onClose: () => void;
  // onRelicUpdate: (updatedRelic: Relic) => void; // If live updates needed from detail view
}

export const RelicDetailView: React.FC<RelicDetailViewProps> = ({ relicId, onClose }) => {
  const [relic, setRelic] = useState<Relic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelicDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRelic = await relicApi.getById(relicId);
      if (fetchedRelic) {
        setRelic(fetchedRelic);
      } else {
        setError("Không tìm thấy thông tin di tích.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết di tích:", err);
      setError(err.message || "Không thể tải chi tiết di tích.");
    } finally {
      setIsLoading(false);
    }
  }, [relicId]);

  useEffect(() => {
    fetchRelicDetails();
  }, [fetchRelicDetails]);

  if (isLoading) return <div className="p-4"><LoadingSpinner message="Đang tải chi tiết di tích..." /></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error} <Button onClick={onClose}>Đóng</Button></div>;
  if (!relic) return <div className="p-4 text-center">Không tìm thấy di tích. <Button onClick={onClose}>Đóng</Button></div>;

  const detailItem = (label: string, value?: string | number | null, isHtml: boolean = false) => {
    let contentToRender: React.ReactNode;
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        contentToRender = <span className="text-gray-400">N/A</span>;
    } else {
        contentToRender = value;
    }

    return (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-gray-200 last:border-b-0">
        <dt className="text-sm font-medium text-gray-600">{label}</dt>
        {isHtml && typeof contentToRender === 'string' ? (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: contentToRender }} />
        ) : (
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                {contentToRender}
            </dd>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 md:p-4"> {/* Removed max-w, mx-auto, my-8. Adjusted padding. */}
      {/* The original header with title and close button is now part of the Modal component in App.tsx */}
      {/* <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">{relic.name}</h2>
        <Button onClick={onClose} variant="secondary">Đóng</Button>
      </div> */}

      <div className="space-y-4">
        {relic.main_image_url && (
            <div className="mb-4">
                <img src={relic.main_image_url} alt={relic.name} className="w-full max-h-96 object-contain rounded-lg shadow"/>
            </div>
        )}
        <dl>
          {detailItem("Loại hình di tích", relic.relic_type)}
          {detailItem("Cấp độ công nhận", relic.recognition_level)}
          {detailItem("Địa điểm/Khu vực", relic.location_description)}
          {detailItem("Ngày phát hiện/Ghi nhận", relic.established_date)}
          {detailItem("Mô tả sơ lược", relic.short_description)}
          {detailItem("Giá trị Lịch sử, Văn hóa, Khoa học", relic.historical_cultural_value, true)}
          {detailItem("Tình trạng bảo tồn hiện tại", relic.current_conservation_status)}
          {detailItem("Chi tiết Khu vực bảo vệ", relic.protection_zone_details, true)}
          {detailItem("Đơn vị quản lý", relic.management_unit_responsible)}
          {detailItem("Ngày kiểm kê/khảo sát gần nhất", relic.last_inspection_date ? new Date(relic.last_inspection_date).toLocaleDateString('vi-VN') : null)}
          {detailItem("Tình trạng khai thác du lịch", relic.tourism_exploitation_status)}
          {detailItem("Ghi chú thêm", relic.notes, true)}
          {detailItem("Ngày tạo", relic.created_at ? new Date(relic.created_at).toLocaleString('vi-VN') : null)}
          {detailItem("Cập nhật lần cuối", relic.updated_at ? new Date(relic.updated_at).toLocaleString('vi-VN') : null)}
        </dl>
        {/* Future sections: Related Documents, Related Tasks, Image Gallery, Map View etc. */}
      </div>
    </div>
  );
};
