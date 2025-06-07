import React from 'react';
import { Relic, RelicRecognitionLevel } from '../../types';
import { EditIcon, TrashIcon, EyeIcon, RelicSiteIcon } from '../../constants'; // Assuming RelicSiteIcon from constants
import { Button } from '../shared/Button';

interface RelicItemProps {
  relic: Relic;
  onView: (relic: Relic) => void;
  onEdit: (relic: Relic) => void;
  onDelete: (relicId: string) => void;
}

const getRecognitionLevelColor = (level: RelicRecognitionLevel): string => {
  switch (level) {
    case RelicRecognitionLevel.QuocGiaDacBiet: return 'bg-red-100 text-red-800 border-red-500';
    case RelicRecognitionLevel.QuocGia: return 'bg-orange-100 text-orange-800 border-orange-500';
    case RelicRecognitionLevel.CapTinh: return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    default: return 'bg-gray-100 text-gray-800 border-gray-400';
  }
};

export const RelicItem: React.FC<RelicItemProps> = ({ relic, onView, onEdit, onDelete }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 border-l-4 ${getRecognitionLevelColor(relic.recognition_level)} flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-semibold text-teal-700 hover:underline cursor-pointer truncate" 
            onClick={() => onView(relic)}
            title={relic.name}
          >
            {relic.name}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRecognitionLevelColor(relic.recognition_level).replace('border-l-4', '')}`}>
            {relic.recognition_level}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Loại hình:</span> {relic.relic_type}
        </p>
        <p className="text-sm text-gray-600 mb-1 truncate" title={relic.location_description}>
          <span className="font-medium">Địa điểm:</span> {relic.location_description}
        </p>
         {relic.current_conservation_status && (
            <p className="text-sm text-gray-500 mb-1">
                <span className="font-medium">Tình trạng:</span> {relic.current_conservation_status}
            </p>
        )}
        {relic.main_image_url && (
            <img src={relic.main_image_url} alt={relic.name} className="mt-2 h-32 w-full object-cover rounded-md"/>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(relic)} title="Xem chi tiết"><EyeIcon /></Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(relic)} title="Chỉnh sửa di tích"><EditIcon /></Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa di tích này?')) {
                onDelete(relic.id);
              }
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            title="Xóa di tích"
        >
            <TrashIcon />
        </Button>
      </div>
    </div>
  );
};
