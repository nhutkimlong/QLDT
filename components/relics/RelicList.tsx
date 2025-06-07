
import React from 'react';
import { Relic } from '../../types';
import { RelicItem } from './RelicItem';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { RelicSiteIcon } from '../../constants'; // Assuming RelicSiteIcon from constants

interface RelicListProps {
  relics: Relic[];
  isLoading: boolean;
  error?: string | null;
  onViewRelic: (relic: Relic) => void;
  onEditRelic: (relic: Relic) => void;
  onDeleteRelic: (relicId: string) => void;
  onAddNew: () => void;
}

export const RelicList: React.FC<RelicListProps> = ({
  relics,
  isLoading,
  error,
  onViewRelic,
  onEditRelic,
  onDeleteRelic,
  onAddNew
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách di tích..." />;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Lỗi: {error}</div>;
  }

  if (relics.length === 0) {
    return <EmptyState 
        message="Chưa có di tích nào được quản lý. Bắt đầu bằng cách thêm mới."
        icon={<RelicSiteIcon/>}
        actionButton={<button onClick={onAddNew} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Thêm Di tích Mới</button>}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {relics.map(relic => (
        <RelicItem
          key={relic.id}
          relic={relic}
          onView={onViewRelic}
          onEdit={onEditRelic}
          onDelete={onDeleteRelic}
        />
      ))}
    </div>
  );
};
