interface ProcessStageProps {
  progress: number;
  currentFrame: number;
  totalFrames: number;
}

export default function ProcessStage({
  progress,
  currentFrame,
  totalFrames,
}: ProcessStageProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="video-container flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <LoadingSpinner />
          </div>
          <h2 className="text-2xl font-bold mb-4">正在处理视频...</h2>
          <p className="mb-8 text-text-secondary">这可能需要几分钟时间</p>

          <div className="max-w-md mx-auto">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-text-secondary">
              <span>正在处理第 {currentFrame} 帧...</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      className="mx-auto text-accent"
    >
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M50 10 A40 40 0 0 1 90 50"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
