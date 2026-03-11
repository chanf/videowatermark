import { createPortal } from 'react-dom';
import { useCallback } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
}

export default function PreviewModal({
  isOpen,
  onClose,
  beforeImage,
  afterImage,
}: PreviewModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-primary-secondary border border-border rounded-2xl shadow-2xl max-w-6xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-text">效果预览</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-primary-tertiary rounded-lg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 预览内容 */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 处理前 */}
            <div className="flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden border border-border bg-primary-tertiary">
                <img
                  src={beforeImage}
                  alt="处理前"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              <p className="text-center mt-3 text-text-secondary font-medium">处理前</p>
            </div>

            {/* 处理后 */}
            <div className="flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden border border-border bg-primary-tertiary">
                <img
                  src={afterImage}
                  alt="处理后"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              <p className="text-center mt-3 text-text-secondary font-medium">处理后</p>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="px-6 py-4 bg-primary-tertiary border-t border-border">
          <p className="text-sm text-text-secondary text-center">
            💡 提示：确认填充效果后，点击"开始处理"处理完整视频
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
