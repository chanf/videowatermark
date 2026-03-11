import { Selection, FillMode, VideoInfo } from '../../types';

interface ControlPanelProps {
  currentStep: number;
  selection: Selection;
  fillMode: FillMode;
  fillColor: string;
  fillImage: string | null;
  videoInfo: VideoInfo | null;
  onSelectionChange: (selection: Selection) => void;
  onFillModeChange: (mode: FillMode) => void;
  onFillColorChange: (color: string) => void;
  onFillImageUpload: (image: string) => void;
  onFillImageClear: () => void;
  onPreview: (displayedWidth?: number, displayedHeight?: number) => void;
  onProcess: () => void;
  canPreview: boolean;
  canProcess: boolean;
}

export default function ControlPanel({
  currentStep,
  selection,
  fillMode,
  fillColor,
  fillImage,
  videoInfo,
  onSelectionChange,
  onFillModeChange,
  onFillColorChange,
  onFillImageUpload,
  onFillImageClear,
  onPreview,
  onProcess,
  canPreview,
  canProcess,
}: ControlPanelProps) {
  return (
    <div className="control-panel w-80 overflow-y-auto bg-primary-secondary border-l border-border p-6">
      <h3 className="text-lg font-bold mb-6">控制面板</h3>

      {/* 当前状态 */}
      <PanelSection title="当前状态">
        <StatusContent currentStep={currentStep} />
      </PanelSection>

      {/* 选区坐标 */}
      <PanelSection title="选区坐标">
        <CoordInputs
          selection={selection}
          onChange={onSelectionChange}
          disabled={currentStep < 3}
        />
      </PanelSection>

      {/* 填充方式 */}
      <PanelSection title="填充方式">
        <FillOptions
          selectedMode={fillMode}
          onSelect={onFillModeChange}
          disabled={currentStep < 4}
        />
      </PanelSection>

      {/* 填充设置 */}
      {fillMode && (
        <PanelSection title="填充设置">
          <FillSettings
            mode={fillMode}
            color={fillColor}
            image={fillImage}
            onColorChange={onFillColorChange}
            onImageUpload={onFillImageUpload}
            onImageClear={onFillImageClear}
          />
        </PanelSection>
      )}

      {/* 操作按钮 */}
      <PanelSection title="操作">
        <div className="space-y-3">
          <button
            className="btn-primary w-full"
            onClick={() => {
              // 从容器获取显示尺寸
              const container = document.querySelector('.video-container');
              if (container) {
                const img = container.querySelector('img');
                if (img) {
                  onPreview(img.clientWidth, img.clientHeight);
                } else {
                  // 如果没有图片，使用容器尺寸
                  onPreview();
                }
              } else {
                onPreview();
              }
            }}
            disabled={!canPreview}
          >
            预览效果
          </button>
          <button
            className="btn-primary w-full"
            onClick={onProcess}
            disabled={!canProcess}
          >
            开始处理
          </button>
        </div>
      </PanelSection>

      {/* 视频信息 */}
      {videoInfo && (
        <PanelSection title="视频信息">
          <VideoInfoDisplay info={videoInfo} />
        </PanelSection>
      )}
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
      <div className="section-title text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatusContent({ currentStep }: { currentStep: number }) {
  const messages = {
    1: '等待上传视频...',
    2: '✅ 视频已加载，请播放并截取参考帧',
    3: '✅ 参考帧已截取，请在帧图片上框选水印区域',
    4: '✅ 水印区域已选择，请选择填充方式并处理',
  };

  return <p className="text-sm">{messages[currentStep as keyof typeof messages]}</p>;
}

function CoordInputs({
  selection,
  onChange,
  disabled,
}: {
  selection: Selection;
  onChange: (selection: Selection) => void;
  disabled: boolean;
}) {
  const handleInputChange = (field: keyof Selection, value: number) => {
    onChange({ ...selection, [field]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <CoordInput
        label="X"
        value={Math.round(selection.x)}
        onChange={(v) => handleInputChange('x', v)}
        disabled={disabled}
      />
      <CoordInput
        label="Y"
        value={Math.round(selection.y)}
        onChange={(v) => handleInputChange('y', v)}
        disabled={disabled}
      />
      <CoordInput
        label="宽度"
        value={Math.round(selection.width)}
        onChange={(v) => handleInputChange('width', v)}
        disabled={disabled}
      />
      <CoordInput
        label="高度"
        value={Math.round(selection.height)}
        onChange={(v) => handleInputChange('height', v)}
        disabled={disabled}
      />
    </div>
  );
}

function CoordInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1 uppercase">
        {label}
      </label>
      <input
        type="number"
        className="input-field"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function FillOptions({
  selectedMode,
  onSelect,
  disabled,
}: {
  selectedMode: FillMode;
  onSelect: (mode: FillMode) => void;
  disabled: boolean;
}) {
  const options = [
    { mode: 'color' as FillMode, label: '纯色填充', desc: '使用单一颜色填充' },
    { mode: 'image' as FillMode, label: '图片填充', desc: '使用图片覆盖水印' },
    { mode: 'smart' as FillMode, label: '智能填充', desc: 'AI 推断周围内容' },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div
          key={option.mode}
          className={`fill-option ${selectedMode === option.mode ? 'active' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => onSelect(option.mode)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-tertiary">
              <FillIcon mode={option.mode} />
            </div>
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-text-secondary">{option.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FillIcon({ mode }: { mode: FillMode }) {
  switch (mode) {
    case 'color':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'image':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'smart':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
  }
}

function FillSettings({
  mode,
  color,
  image,
  onColorChange,
  onImageUpload,
  onImageClear,
}: {
  mode: FillMode;
  color: string;
  image: string | null;
  onColorChange: (color: string) => void;
  onImageUpload: (image: string) => void;
  onImageClear: () => void;
}) {
  if (mode === 'color') {
    return (
      <div>
        <label className="block text-sm mb-2 text-text-secondary">选择颜色</label>
        <div className="color-picker-wrapper mb-4">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex-1 text-sm py-2"
            onClick={() => onColorChange('#000000')}
          >
            黑色
          </button>
          <button
            className="btn-secondary flex-1 text-sm py-2"
            onClick={() => onColorChange('#ffffff')}
          >
            白色
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'image') {
    return (
      <div>
        <label className="block text-sm mb-2 text-text-secondary">上传图片</label>
        {!image ? (
          <div
            className="upload-zone rounded-lg p-4 text-center cursor-pointer mb-4"
            onClick={() => document.getElementById('fill-image-input')?.click()}
          >
            <input
              type="file"
              id="fill-image-input"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    onImageUpload(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div className="text-sm text-text-secondary">点击或拖拽上传图片</div>
          </div>
        ) : (
          <div className="space-y-2">
            <img src={image} alt="填充图片" className="w-full rounded-lg mb-2" />
            <button className="btn-secondary w-full text-sm py-2" onClick={onImageClear}>
              清除图片
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'smart') {
    return (
      <div>
        <p className="text-sm mb-4 text-text-secondary">
          使用 AI 技术智能推断水印周围的内容，自动填充最合适的图像。
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-tertiary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-xs">此功能需要更多处理时间</span>
        </div>
      </div>
    );
  }

  return null;
}

function VideoInfoDisplay({ info }: { info: VideoInfo }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-text-secondary">文件名</span>
        <span className="font-mono truncate ml-2">{info.filename}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">分辨率</span>
        <span className="font-mono ml-2">
          {info.width}x{info.height}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">时长</span>
        <span className="font-mono ml-2">
          {Math.floor(info.duration / 60)}:{Math.floor(info.duration % 60)
            .toString()
            .padStart(2, '0')}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">帧数</span>
        <span className="font-mono ml-2">{info.totalFrames}</span>
      </div>
    </div>
  );
}
