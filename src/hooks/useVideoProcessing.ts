import { useState, useCallback, useRef } from 'react';
import { Selection, FillMode, ProcessState } from '../types';

interface UseVideoProcessingReturn {
  processState: ProcessState;
  isFFmpegLoaded: boolean;
  loadFFmpeg: () => Promise<void>;
  processVideo: (
    videoUrl: string,
    capturedFrame: string,
    selection: Selection,
    fillMode: FillMode,
    fillColor: string,
    fillImage: HTMLImageElement | null,
    onProgress: (progress: number, currentFrame: number) => void,
    containerInfo?: { containerWidth: number; containerHeight: number; imageNaturalWidth: number; imageNaturalHeight: number }
  ) => Promise<string | null>;
  cancelProcessing: () => void;
}

export function useVideoProcessing(): UseVideoProcessingReturn {
  const [processState, setProcessState] = useState<ProcessState>({
    currentFrame: 0,
    totalFrames: 0,
    progress: 0,
    isProcessing: false,
  });
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(true); // 简化版本，不需要 FFmpeg
  const cancelledRef = useRef(false);

  const loadFFmpeg = useCallback(async () => {
    // 简化版本，不需要预加载
    setIsFFmpegLoaded(true);
  }, []);

  const processVideo = useCallback(async (
    videoUrl: string,
    capturedFrame: string,
    selection: Selection,
    fillMode: FillMode,
    fillColor: string,
    fillImage: HTMLImageElement | null,
    onProgress: (progress: number, currentFrame: number) => void,
    containerInfo?: { containerWidth: number; containerHeight: number; imageNaturalWidth: number; imageNaturalHeight: number }
  ): Promise<string | null> => {
    cancelledRef.current = false;

    // 在 try 块外部声明变量
    let video: HTMLVideoElement | null = null;

    try {
      setProcessState({
        currentFrame: 0,
        totalFrames: 0,
        progress: 0,
        isProcessing: true,
      });

      console.log('=== 开始处理视频 ===');
      console.log('填充模式:', fillMode);
      console.log('填充颜色:', fillColor);
      console.log('显示选区坐标:', selection);

      // 创建视频元素
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.style.position = 'absolute';
      video.style.visibility = 'hidden';
      video.style.top = '-9999px';
      document.body.appendChild(video);

      // 等待视频加载
      await new Promise<void>((resolve, reject) => {
        if (!video) {
          reject(new Error('视频元素创建失败'));
          return;
        }
        video.onloadedmetadata = () => {
          console.log('视频元数据加载完成');
          console.log('原始尺寸:', video!.videoWidth, 'x', video!.videoHeight);
          resolve();
        };
        video.onerror = () => reject(new Error('视频加载失败'));
        video.src = videoUrl;
      });

      if (!video) {
        throw new Error('视频元素未初始化');
      }

      const duration = video!.duration;
      const fps = 30;
      const totalFrames = Math.floor(duration * fps);

      console.log('视频时长:', duration, '秒');
      console.log('总帧数:', totalFrames);

      // 获取容器和图片信息
      let containerWidth: number;
      let containerHeight: number;
      let imageNaturalWidth: number;
      let imageNaturalHeight: number;

      if (containerInfo) {
        // 使用传入的容器信息
        containerWidth = containerInfo.containerWidth;
        containerHeight = containerInfo.containerHeight;
        imageNaturalWidth = containerInfo.imageNaturalWidth;
        imageNaturalHeight = containerInfo.imageNaturalHeight;
        console.log('使用传入的容器信息');
      } else {
        // 尝试从 DOM 获取（兼容旧逻辑）
        const container = document.querySelector('.video-container') as HTMLElement;
        const imgElement = container?.querySelector('img') as HTMLImageElement;

        if (!container || !imgElement) {
          throw new Error('无法找到容器或图片元素，请在预览界面进行处理');
        }

        containerWidth = container.clientWidth;
        containerHeight = container.clientHeight;
        imageNaturalWidth = imgElement.naturalWidth;
        imageNaturalHeight = imgElement.naturalHeight;
        console.log('从 DOM 获取容器信息');
      }

      console.log('容器尺寸:', containerWidth, 'x', containerHeight);
      console.log('图片原始尺寸:', imageNaturalWidth, 'x', imageNaturalHeight);

      // 计算 object-fit: contain 下的显示尺寸和偏移
      const containerRatio = containerWidth / containerHeight;
      const imageRatio = imageNaturalWidth / imageNaturalHeight;

      let displayedWidth: number;
      let displayedHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imageRatio > containerRatio) {
        // 图片更宽，以宽度为基准
        displayedWidth = containerWidth;
        displayedHeight = containerWidth / imageRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayedHeight) / 2;
      } else {
        // 图片更高，以高度为基准
        displayedHeight = containerHeight;
        displayedWidth = containerHeight * imageRatio;
        offsetX = (containerWidth - displayedWidth) / 2;
        offsetY = 0;
      }

      console.log('计算出的图片显示信息:');
      console.log('  实际显示尺寸:', displayedWidth.toFixed(2), 'x', displayedHeight.toFixed(2));
      console.log('  X 偏移:', offsetX.toFixed(2));
      console.log('  Y 偏移:', offsetY.toFixed(2));
      console.log('  截取帧图片原始尺寸:', imageNaturalWidth, 'x', imageNaturalHeight);

      // 调整选区坐标，减去图片在容器中的偏移（和预览功能一样）
      const adjustedSelection = {
        x: selection.x - offsetX,
        y: selection.y - offsetY,
        width: selection.width,
        height: selection.height,
      };

      console.log('用户选区坐标 (相对于容器):', selection);
      console.log('调整后的选区坐标 (相对于图片显示区域):', adjustedSelection);

      // 计算缩放比例（图片显示尺寸 -> 原始图片尺寸）
      // 使用 imageNaturalWidth/Height 而不是 video.videoWidth/Height
      // 确保与预览功能完全一致
      const scaleX = imageNaturalWidth / displayedWidth;
      const scaleY = imageNaturalHeight / displayedHeight;

      console.log('坐标转换:');
      console.log('  显示尺寸:', displayedWidth, 'x', displayedHeight);
      console.log('  原始图片尺寸 (截取帧):', imageNaturalWidth, 'x', imageNaturalHeight);
      console.log('  视频元素尺寸 (videoElement):', video.videoWidth, 'x', video.videoHeight);
      console.log('  缩放比例 X:', scaleX.toFixed(3), 'Y:', scaleY.toFixed(3));

      // 转换选区坐标到原始视频坐标系
      let scaledSelection: Selection = {
        x: Math.round(adjustedSelection.x * scaleX),
        y: Math.round(adjustedSelection.y * scaleY),
        width: Math.round(adjustedSelection.width * scaleX),
        height: Math.round(adjustedSelection.height * scaleY),
      };

      console.log('转换后的选区坐标 (原始视频):', scaledSelection);
      console.log('选区是否有效:', scaledSelection.width > 0 && scaledSelection.height > 0);

      // 如果选区无效，抛出错误
      if (scaledSelection.width <= 0 || scaledSelection.height <= 0) {
        throw new Error(`选区无效: width=${scaledSelection.width}, height=${scaledSelection.height}。请重新选择要填充的区域。`);
      }

      // 验证坐标在图片范围内
      if (scaledSelection.x < 0) scaledSelection.x = 0;
      if (scaledSelection.y < 0) scaledSelection.y = 0;
      if (scaledSelection.x + scaledSelection.width > imageNaturalWidth) {
        scaledSelection.width = imageNaturalWidth - scaledSelection.x;
      }
      if (scaledSelection.y + scaledSelection.height > imageNaturalHeight) {
        scaledSelection.height = imageNaturalHeight - scaledSelection.y;
      }

      console.log('调整后的选区坐标:', scaledSelection);

      // 设置 Canvas
      const canvas = document.createElement('canvas');
      // 使用截取帧图片的原始尺寸作为 Canvas 尺寸
      canvas.width = imageNaturalWidth;
      canvas.height = imageNaturalHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('无法创建 Canvas 上下文');
      }

      console.log('Canvas 创建完成，尺寸:', canvas.width, 'x', canvas.height);
      console.log('使用的尺寸来源: 截取帧图片原始尺寸');

      // 使用 MediaRecorder 录制
      const stream = canvas.captureStream(fps);

      // 尝试不同的 MediaRecorder 格式
      // 优先使用更兼容的格式
      let mediaRecorder: MediaRecorder | null = null;
      let selectedMime = 'video/webm'; // 默认

      // 按优先级排序的格式列表
      const formats = [
        'video/mp4', // 最兼容，但浏览器支持有限
        'video/webm;codecs=h264', // WebM 容器 + H264 编码，部分浏览器支持
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

      for (const format of formats) {
        try {
          console.log('尝试格式:', format);
          if (MediaRecorder.isTypeSupported(format)) {
            mediaRecorder = new MediaRecorder(stream, {
              mimeType: format,
              videoBitsPerSecond: 8000000
            });
            selectedMime = format;
            console.log('✅ 使用格式:', format);
            break;
          } else {
            console.log('❌ 格式不支持:', format);
          }
        } catch (e) {
          console.log('❌ 格式创建失败:', format, e);
        }
      }

      // 如果没有支持的格式，使用默认
      if (!mediaRecorder) {
        console.log('使用默认 MediaRecorder 配置');
        mediaRecorder = new MediaRecorder(stream, {
          videoBitsPerSecond: 8000000
        });
      }

      const chunks: Blob[] = [];
      mediaRecorder!.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log('收到数据块，大小:', e.data.size);
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder!.onstop = () => {
          console.log('MediaRecorder 停止，总数据块数:', chunks.length);
          if (chunks.length === 0) {
            reject(new Error('没有录制到任何数据'));
            return;
          }
          const blob = new Blob(chunks, { type: selectedMime });
          console.log('视频 Blob 创建完成，大小:', blob.size, '类型:', selectedMime);
          resolve(blob);
        };
      });

      mediaRecorder!.start(100); // 每100ms触发一次ondataavailable
      console.log('MediaRecorder 开始录制');

      // 播放视频并处理每一帧
      let currentFrameNum = 0;
      let processedFrames = 0;
      let isProcessing = false; // 开始为 false，等待播放开始
      let drawFrameId: number | null = null;

      console.log('=== 准备开始处理 ===');

      // 使用 requestAnimationFrame 持续绘制
      const drawFrame = () => {
        if (!isProcessing || cancelledRef.current || !video) {
          console.log('drawFrame 退出，isProcessing:', isProcessing, 'cancelled:', cancelledRef.current);
          return;
        }

        // 清空 Canvas（可选，drawImage 会覆盖）
        // ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制当前帧
        // 确保视频帧和 Canvas 尺寸匹配
        if (video.videoWidth === canvas.width && video.videoHeight === canvas.height) {
          // 尺寸一致，直接绘制
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          // 尺寸不一致，需要缩放
          console.log('视频元素尺寸与 Canvas 不一致，进行缩放:', {
            videoSize: `${video.videoWidth}x${video.videoHeight}`,
            canvasSize: `${canvas.width}x${canvas.height}`
          });
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
        }

        // 应用填充效果
        if (scaledSelection.width > 0 && scaledSelection.height > 0) {
          applyFillEffect(ctx, scaledSelection, fillMode, fillColor, fillImage);
        } else {
          console.warn('⚠️ 跳过填充：选区无效', scaledSelection);
        }

        // 计算当前帧号
        currentFrameNum = Math.floor(video.currentTime * fps);
        const progress = Math.min((currentFrameNum / totalFrames) * 100, 100);

        processedFrames++;

        if (processedFrames % 30 === 1 || currentFrameNum % 30 === 0) {
          console.log(`处理进度: ${currentFrameNum}/${totalFrames} (${progress.toFixed(1)}%)`);
          onProgress(progress, currentFrameNum);
        }

        // 继续绘制下一帧
        if (!video!.ended && !video!.paused && isProcessing) {
          drawFrameId = requestAnimationFrame(drawFrame);
        } else {
          console.log('drawFrame 循环结束，视频状态:', {
            ended: video!.ended,
            paused: video!.paused,
            currentTime: video!.currentTime
          });
        }
      };

      // 视频结束时停止录制
      const handleEnded = () => {
        console.log('=== 视频播放完成 ===');
        console.log(`总处理帧数: ${currentFrameNum}/${totalFrames}`);
        isProcessing = false;

        if (drawFrameId !== null) {
          cancelAnimationFrame(drawFrameId);
          drawFrameId = null;
        }

        if (!video) return;

        // 清理事件监听器
        video.removeEventListener('ended', handleEnded);
        video.pause();

        // 停止录制（这会触发 onstop）
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            console.log('停止 MediaRecorder');
            mediaRecorder.stop();
          }
        }, 200); // 给最后一帧一些时间被捕获
      };

      video.addEventListener('ended', handleEnded);

      // 播放视频
      try {
        console.log('开始播放视频...');
        await video!.play();
        console.log('✅ 视频开始播放');
        console.log('时长:', duration.toFixed(2), '秒，帧率:', fps);
        console.log('预计总帧数:', totalFrames);

        // 视频开始播放后，开始绘制循环
        isProcessing = true;
        console.log('开始 drawFrame 循环');
        drawFrame();

      } catch (error) {
        console.error('❌ 视频播放失败:', error);
        isProcessing = false;
        if (video) {
          video.removeEventListener('ended', handleEnded);
          if (video.parentNode) {
            document.body.removeChild(video);
          }
        }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        throw error;
      }

      // 等待录制完成
      console.log('等待 MediaRecorder 完成...');
      const blob = await recordingPromise;
      console.log('MediaRecorder 完成，创建 Blob URL');

      // 清理视频元素
      if (video && video.parentNode) {
        document.body.removeChild(video);
      }

      if (blob.size === 0) {
        throw new Error('生成的视频文件为空，请检查视频源文件');
      }

      const url = URL.createObjectURL(blob);

      setProcessState({
        currentFrame: totalFrames,
        totalFrames,
        progress: 100,
        isProcessing: false,
      });

      console.log('=== 视频处理完成 ===');
      console.log('输出视频 URL:', url);

      return url;
    } catch (error) {
      console.error('❌ 视频处理错误:', error);

      // 清理视频元素
      if (video != null) {
        try {
          if (video.parentNode) {
            document.body.removeChild(video);
          }
        } catch (e) {
          console.error('清理视频元素失败:', e);
        }
      }

      setProcessState(prev => ({
        ...prev,
        isProcessing: false,
      }));
      throw error;
    }
  }, []);

  const applyFillEffect = (
    ctx: CanvasRenderingContext2D,
    selection: Selection,
    fillMode: FillMode,
    fillColor: string,
    fillImage: HTMLImageElement | null
  ) => {
    const { x, y, width, height } = selection;

    console.log('=== 应用填充效果 ===');
    console.log('填充模式:', fillMode);
    console.log('选区坐标:', { x, y, width, height });
    console.log('Canvas 尺寸:', ctx.canvas.width, 'x', ctx.canvas.height);

    // 验证选区是否有效
    if (width <= 0 || height <= 0) {
      console.warn('⚠️ 选区无效，跳过填充');
      return;
    }

    if (x < 0 || y < 0 || x + width > ctx.canvas.width || y + height > ctx.canvas.height) {
      console.warn('⚠️ 选区超出 Canvas 范围，进行调整');
    }

    switch (fillMode) {
      case 'color':
        // 纯色填充
        console.log('执行纯色填充，颜色:', fillColor);
        console.log(`fillRect(${x}, ${y}, ${width}, ${height})`);

        // 保存当前状态
        ctx.save();

        // 设置填充颜色
        ctx.fillStyle = fillColor;

        // 绘制填充矩形
        ctx.fillRect(x, y, width, height);

        // 恢复状态
        ctx.restore();

        console.log('✅ 纯色填充完成');
        break;

      case 'image':
        // 图片填充
        console.log('执行图片填充');
        if (fillImage) {
          console.log('使用填充图片:', fillImage);
          ctx.drawImage(fillImage, x, y, width, height);
          console.log('✅ 图片填充完成');
        } else {
          console.warn('⚠️ 填充图片未提供，使用纯色填充');
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, width, height);
        }
        break;

      case 'smart':
        // 智能填充 - 简化版本，使用周围像素
        console.log('执行智能填充');
        try {
          applySmartFillEffect(ctx, selection);
          console.log('✅ 智能填充完成');
        } catch (error) {
          console.error('智能填充失败，使用纯色填充:', error);
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, width, height);
          console.log('✅ 回退到纯色填充');
        }
        break;
    }
  };

  const applySmartFillEffect = (ctx: CanvasRenderingContext2D, selection: Selection) => {
    const { x, y, width, height } = selection;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // 简单的智能填充：使用周围像素
    const padding = 5;

    // 上方像素
    if (y - padding >= 0) {
      const topData = ctx.getImageData(
        Math.max(0, x),
        Math.max(0, y - padding),
        width,
        padding
      );
      ctx.putImageData(topData, x, y);
    }

    // 下方像素
    if (y + height + padding <= canvasHeight) {
      const bottomData = ctx.getImageData(
        Math.max(0, x),
        Math.min(canvasHeight - padding, y + height),
        width,
        padding
      );
      ctx.putImageData(bottomData, x, y + height - padding);
    }

    // 左方像素
    if (x - padding >= 0) {
      const leftData = ctx.getImageData(
        Math.max(0, x - padding),
        Math.max(0, y),
        padding,
        height
      );
      ctx.putImageData(leftData, x, y);
    }

    // 右方像素
    if (x + width + padding <= canvasWidth) {
      const rightData = ctx.getImageData(
        Math.min(canvasWidth - padding, x + width),
        Math.max(0, y),
        padding,
        height
      );
      ctx.putImageData(rightData, x + width - padding, y);
    }

    // 中间区域使用简单模糊
    try {
      const centerData = ctx.getImageData(x, y, width, height);
      blurImageData(centerData, width, height);
      ctx.putImageData(centerData, x, y);
    } catch (error) {
      console.error('中间区域模糊失败:', error);
    }
  };

  const blurImageData = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nidx = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += copy[nidx];
            }
          }
          data[idx + c] = sum / 9;
        }
      }
    }
  };

  const cancelProcessing = useCallback(() => {
    cancelledRef.current = true;
    setProcessState(prev => ({
      ...prev,
      isProcessing: false,
    }));
  }, []);

  return {
    processState,
    isFFmpegLoaded,
    loadFFmpeg,
    processVideo,
    cancelProcessing,
  };
}
