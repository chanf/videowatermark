/**
 * 格式化时间显示
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 获取视频信息
 */
export async function getVideoInfo(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('无法加载视频'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * 从视频截取一帧
 */
export function captureFrame(video: HTMLVideoElement, time: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas 上下文');

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/**
 * 计算视频总帧数
 */
export function calculateTotalFrames(duration: number, frameRate: number = 30): number {
  return Math.floor(duration * frameRate);
}

/**
 * 将视频文件转换为可播放的 URL
 */
export function createVideoUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 清理视频 URL
 */
export function revokeVideoUrl(url: string): void {
  URL.revokeObjectURL(url);
}
