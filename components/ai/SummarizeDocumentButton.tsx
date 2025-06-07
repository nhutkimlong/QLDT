
import React from 'react';
import { Button } from '../shared/Button';
import { SparklesIcon } from '../../constants';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface SummarizeDocumentButtonProps {
  onClick: () => Promise<void>;
  isSummarizing: boolean;
  disabled?: boolean;
}

export const SummarizeDocumentButton: React.FC<SummarizeDocumentButtonProps> = ({ onClick, isSummarizing, disabled }) => {
  return (
    <Button
      onClick={onClick}
      disabled={isSummarizing || disabled}
      variant="ghost"
      size="sm"
      leftIcon={isSummarizing ? <LoadingSpinner size="sm"/> : <SparklesIcon />}
      className="text-purple-600 hover:bg-purple-100"
      title={disabled ? "Tính năng tóm tắt AI chưa sẵn sàng" : "Tóm tắt bằng AI"}
    >
      {isSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt AI'}
    </Button>
  );
};
