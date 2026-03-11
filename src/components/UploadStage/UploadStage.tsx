import { useCallback } from 'react';

interface UploadStageProps {
  onVideoUpload: (file: File) => void;
}

export default function UploadStage({ onVideoUpload }: UploadStageProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('dragging');

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('video/')) {
        onVideoUpload(files[0]);
      }
    },
    [onVideoUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('video/')) {
        onVideoUpload(file);
      }
    },
    [onVideoUpload]
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center fade-in">
      <div
        className="upload-zone max-w-2xl w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('video-input')?.click()}
      >
        <input
          type="file"
          id="video-input"
          className="hidden"
          accept="video/*"
          onChange={handleFileSelect}
        />

        <div className="mb-8">
          <UploadIcon />
        </div>

        <h2 className="text-3xl font-bold mb-4">上传视频文件</h2>
        <p className="text-lg mb-6 text-text-secondary">
          拖拽视频到此处，或点击选择文件
        </p>

        <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
          <span>支持 MP4, MOV, AVI, MKV</span>
          <span>•</span>
          <span>最大 2GB</span>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="mx-auto text-accent"
    >
      <path
        d="M40 20L40 60M20 40L60 40"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="10"
        width="60"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}
