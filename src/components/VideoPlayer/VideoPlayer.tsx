import { useRef, useState, useEffect, useCallback } from 'react';
import { Selection } from '../../types';

interface VideoPlayerProps {
  videoUrl: string;
  capturedFrame: string | null;
  selection: Selection;
  isSelectionEnabled: boolean;
  onSelectionChange: (selection: Selection) => void;
  onFrameCapture: (frameData: string) => void;
  onReturnToVideo: () => void;
  onPreview?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  capturedFrame,
  selection,
  isSelectionEnabled,
  onSelectionChange,
  onFrameCapture,
  onReturnToVideo,
  onPreview,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSelectionRef = useRef<Selection>({ x: 0, y: 0, width: 0, height: 0 });

  // 视频时间更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // 拖动进度条
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = (Number(e.target.value) / 100) * duration;
    video.currentTime = time;
  }, [duration]);

  // 截取当前帧
  const captureFrame = useCallback(() => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      if (video.readyState < 2) {
        console.warn('视频尚未加载完成');
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('视频尺寸无效');
        return;
      }

      // 设置画布尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 获取上下文并绘制
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL('image/png');

      console.log('✅ 帧已截取');
      onFrameCapture(frameData);
    } catch (error) {
      console.error('截取帧失败:', error);
    }
  }, [onFrameCapture]);

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      console.log('handleMouseDown 被调用，isSelectionEnabled:', isSelectionEnabled);
      if (!isSelectionEnabled) {
        console.log('选区未启用，返回');
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log('鼠标坐标:', x, y);
      console.log('当前选区:', selection);

      // 阻止默认行为
      e.preventDefault();

      // 检查是否点击了调整手柄
      const handle = (e.target as HTMLElement).dataset.handle;
      if (handle) {
        console.log('点击了调整手柄:', handle);
        setIsResizing(true);
        setResizeHandle(handle);
        startPosRef.current = { x, y };
        startSelectionRef.current = { ...selection };
        return;
      }

      // 检查是否点击了选区内部
      if (
        selection.width > 0 &&
        selection.height > 0 &&
        x >= selection.x &&
        x <= selection.x + selection.width &&
        y >= selection.y &&
        y <= selection.y + selection.height
      ) {
        console.log('点击了选区内部，开始拖拽');
        setIsDragging(true);
        startPosRef.current = { x, y };
        startSelectionRef.current = { ...selection };
        return;
      }

      // 开始新的选区 - 在任何情况下都可以开始
      console.log('开始新选区，坐标:', x, y);
      onSelectionChange({
        x,
        y,
        width: 0,
        height: 0,
      });
      setIsResizing(true);
      setResizeHandle('se');
      startPosRef.current = { x, y };
      startSelectionRef.current = { x, y, width: 0, height: 0 };
    },
    [isSelectionEnabled, selection, onSelectionChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelectionEnabled || (!isDragging && !isResizing)) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let newSelection = { ...selection };

      if (isDragging) {
        const dx = x - startPosRef.current.x;
        const dy = y - startPosRef.current.y;
        newSelection = {
          ...startSelectionRef.current,
          x: startSelectionRef.current.x + dx,
          y: startSelectionRef.current.y + dy,
        };
        console.log('拖拽选区:', newSelection);
      } else if (isResizing && resizeHandle) {
        const dx = x - startPosRef.current.x;
        const dy = y - startPosRef.current.y;

        switch (resizeHandle) {
          case 'se':
            newSelection = {
              ...startSelectionRef.current,
              width: Math.max(0, startSelectionRef.current.width + dx),
              height: Math.max(0, startSelectionRef.current.height + dy),
            };
            break;
          case 'sw':
            newSelection = {
              x: startSelectionRef.current.x + dx,
              y: startSelectionRef.current.y,
              width: Math.max(0, startSelectionRef.current.width - dx),
              height: Math.max(0, startSelectionRef.current.height + dy),
            };
            break;
          case 'ne':
            newSelection = {
              x: startSelectionRef.current.x,
              y: startSelectionRef.current.y + dy,
              width: Math.max(0, startSelectionRef.current.width + dx),
              height: Math.max(0, startSelectionRef.current.height - dy),
            };
            break;
          case 'nw':
            newSelection = {
              x: startSelectionRef.current.x + dx,
              y: startSelectionRef.current.y + dy,
              width: Math.max(0, startSelectionRef.current.width - dx),
              height: Math.max(0, startSelectionRef.current.height - dy),
            };
            break;
        }
        console.log('调整选区大小:', newSelection);
      }

      onSelectionChange(newSelection);
    },
    [isSelectionEnabled, isDragging, isResizing, resizeHandle, selection, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    console.log('鼠标释放，选区完成');
  }, []);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div
        ref={containerRef}
        className="video-container flex-1 relative cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {capturedFrame ? (
          // 显示截取的帧图片
          <>
            <img
              src={capturedFrame}
              alt="截取的帧"
              className="w-full h-full object-contain"
              style={{ maxHeight: '100%', maxWidth: '100%', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-3">
              <span>📸 已截取帧图片</span>
              <button
                onClick={() => {
                  if (onPreview) {
                    onPreview();
                  }
                }}
                className="btn-secondary text-xs px-3 py-1"
              >
                预览效果
              </button>
              <button
                onClick={onReturnToVideo}
                className="btn-secondary text-xs px-3 py-1"
              >
                返回视频
              </button>
            </div>
          </>
        ) : (
          // 显示视频
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {isSelectionEnabled && selection.width > 0 && selection.height > 0 && (
          <div
            className="selection-overlay"
            style={{
              left: `${selection.x}px`,
              top: `${selection.y}px`,
              width: `${selection.width}px`,
              height: `${selection.height}px`,
            }}
          >
            <div className="resize-handle nw" data-handle="nw" />
            <div className="resize-handle ne" data-handle="ne" />
            <div className="resize-handle sw" data-handle="sw" />
            <div className="resize-handle se" data-handle="se" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!capturedFrame && (
        <div className="p-4 rounded-lg bg-primary-secondary">
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-lg bg-primary-tertiary transition-colors hover:bg-primary-tertiary/80"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full"
                style={{ accentColor: '#00d4ff' }}
              />
            </div>

            <span className="font-mono text-sm text-text-secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              className="btn-secondary text-sm px-4 py-2 hover:bg-primary-tertiary/80 active:scale-95 transition-all"
              onClick={captureFrame}
              type="button"
            >
              📸 截取当前帧
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
