import { Selection, FillMode } from '../../types';
import VideoPlayer from '../VideoPlayer';

interface WorkStageProps {
  videoUrl: string;
  capturedFrame: string | null;
  currentStep: number;
  selection: Selection;
  fillMode: FillMode;
  onStepChange: (step: number) => void;
  onSelectionChange: (selection: Selection) => void;
  onFrameCapture: (frameData: string) => void;
  onReturnToVideo: () => void;
  onPreview: () => void;
}

export default function WorkStage({
  videoUrl,
  capturedFrame,
  currentStep,
  selection,
  fillMode,
  onStepChange,
  onSelectionChange,
  onFrameCapture,
  onReturnToVideo,
  onPreview,
}: WorkStageProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* 阶段指示器 */}
      <StepIndicator currentStep={currentStep} onStepChange={onStepChange} />

      {/* 工作区容器 */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* 视频预览 */}
        <VideoPlayer
          videoUrl={videoUrl}
          capturedFrame={capturedFrame}
          selection={selection}
          isSelectionEnabled={currentStep >= 3}
          onSelectionChange={onSelectionChange}
          onFrameCapture={onFrameCapture}
          onReturnToVideo={onReturnToVideo}
          onPreview={onPreview}
        />
      </div>
    </div>
  );
}

function StepIndicator({
  currentStep,
  onStepChange,
}: {
  currentStep: number;
  onStepChange: (step: number) => void;
}) {
  const steps = [
    { num: 1, label: '选择参考帧' },
    { num: 2, label: '框选水印区域' },
    { num: 3, label: '配置填充方式' },
    { num: 4, label: '预览与处理' },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center gap-2">
          {index > 0 && (
            <div className="w-12 h-px bg-border" />
          )}
          <button
            className="step-indicator flex items-center gap-2"
            onClick={() => onStepChange(step.num)}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={
                currentStep > step.num
                  ? { background: 'var(--color-success)', color: 'var(--color-primary)' }
                  : currentStep === step.num
                  ? { background: 'var(--color-accent)', color: 'var(--color-primary)' }
                  : { background: 'var(--color-primary-tertiary)', color: 'var(--color-text-secondary)' }
              }
            >
              {step.num}
            </span>
            <span
              className={`ml-2 text-sm font-medium ${
                currentStep >= step.num ? 'text-text' : 'text-text-secondary'
              }`}
            >
              {step.label}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
