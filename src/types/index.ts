export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FillMode = 'color' | 'image' | 'smart' | null;

export interface VideoInfo {
  filename: string;
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  totalFrames: number;
}

export interface ProcessState {
  currentFrame: number;
  totalFrames: number;
  progress: number;
  isProcessing: boolean;
}

export type AppStage = 'upload' | 'work' | 'process' | 'complete';

export interface AppState {
  stage: AppStage;
  videoFile: File | null;
  videoUrl: string | null;
  currentFrame: string | null;
  currentStep?: number;
  selection: Selection;
  fillMode: FillMode;
  fillColor: string;
  fillImage: string | null;
  fillImageElement: HTMLImageElement | null;
  videoInfo: VideoInfo | null;
  processState: ProcessState;
  processedVideoUrl: string | null;
  videoFormat?: 'mp4' | 'webm';
  afterImage?: string | null;
  showPreviewModal?: boolean;
  previewImage?: string;
}
