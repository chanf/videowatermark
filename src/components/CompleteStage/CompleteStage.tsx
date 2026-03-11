interface CompleteStageProps {
  beforeImage: string;
  afterImage: string;
  onDownload: () => void;
  onReset: () => void;
}

export default function CompleteStage({
  beforeImage,
  afterImage,
  onDownload,
  onReset,
}: CompleteStageProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="video-container flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <SuccessIcon />
          </div>
          <h2 className="text-3xl font-bold mb-4">处理完成！</h2>
          <p className="text-lg mb-8 text-text-secondary">
            您的新视频已准备就绪
          </p>

          <div className="comparison-view grid grid-cols-2 gap-4 mb-8">
            <div className="comparison-item">
              <img src={beforeImage} alt="处理前" className="w-full h-auto" />
              <div className="comparison-label">处理前</div>
            </div>
            <div className="comparison-item">
              <img src={afterImage} alt="处理后" className="w-full h-auto" />
              <div className="comparison-label">处理后</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-4" onClick={onDownload}>
              <span className="flex items-center gap-2">
                <DownloadIcon />
                下载视频
              </span>
            </button>
            <button className="btn-secondary text-lg px-8 py-4" onClick={onReset}>
              处理新视频
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="mx-auto text-success"
    >
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        d="M24 40l12 12 20-24"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
