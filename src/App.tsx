import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadStage from './components/UploadStage';
import WorkStage from './components/WorkStage';
import ProcessStage from './components/ProcessStage';
import CompleteStage from './components/CompleteStage';
import ControlPanel from './components/ControlPanel';
import PreviewModal from './components/PreviewModal';
import { AppState, AppStage, Selection, FillMode, VideoInfo } from './types';
import { getVideoInfo, calculateTotalFrames, createVideoUrl, revokeVideoUrl } from './utils/video';
import { createPreviewImage } from './utils/canvas';
import { useVideoProcessing } from './hooks/useVideoProcessing';

function App() {
  const [appState, setAppState] = useState<AppState>({
    stage: 'upload',
    videoFile: null,
    videoUrl: null,
    currentFrame: null,
    selection: { x: 0, y: 0, width: 0, height: 0 },
    fillMode: null,
    fillColor: '#000000',
    fillImage: null,
    fillImageElement: null,
    videoInfo: null,
    processState: {
      currentFrame: 0,
      totalFrames: 0,
      progress: 0,
      isProcessing: false,
    },
    processedVideoUrl: null,
  });

  const { processState, processVideo } = useVideoProcessing();

  // 处理视频上传
  const handleVideoUpload = useCallback(async (file: File) => {
    try {
      const videoUrl = createVideoUrl(file);
      const info = await getVideoInfo(file);

      setAppState((prev) => ({
        ...prev,
        stage: 'work',
        videoFile: file,
        videoUrl,
        videoInfo: {
          filename: file.name,
          duration: info.duration,
          width: info.width,
          height: info.height,
          frameRate: 30,
          totalFrames: calculateTotalFrames(info.duration, 30),
        },
        currentStep: 2,
      }));
    } catch (error) {
      console.error('加载视频失败:', error);
      alert('加载视频失败，请重试');
    }
  }, []);

  // 处理帧截取
  const handleFrameCapture = useCallback((frameData: string) => {
    setAppState((prev) => ({
      ...prev,
      currentFrame: frameData,
      currentStep: 3,
    }));
  }, []);

  // 返回视频播放
  const handleReturnToVideo = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      currentFrame: null,
      currentStep: 2,
    }));
  }, []);

  // 处理选区变化
  const handleSelectionChange = useCallback((selection: Selection) => {
    setAppState((prev) => ({
      ...prev,
      selection,
    }));

    // 如果选区有效，自动进入下一步
    if (selection.width > 10 && selection.height > 10 && appState.currentStep === 3) {
      setAppState((prev) => ({ ...prev, currentStep: 4 }));
    }
  }, [appState.currentStep]);

  // 处理填充方式选择
  const handleFillModeChange = useCallback((mode: FillMode) => {
    setAppState((prev) => ({
      ...prev,
      fillMode: mode,
      currentStep: 4,
    }));
  }, []);

  // 处理颜色变化
  const handleFillColorChange = useCallback((color: string) => {
    setAppState((prev) => ({
      ...prev,
      fillColor: color,
    }));
  }, []);

  // 处理图片上传
  const handleFillImageUpload = useCallback((imageData: string) => {
    // 将 base64 转换为 HTMLImageElement
    const img = new Image();
    img.onload = () => {
      setAppState((prev) => ({
        ...prev,
        fillImage: imageData,
        fillImageElement: img,
      }));
    };
    img.onerror = () => {
      console.error('填充图片加载失败');
      alert('图片加载失败，请重试');
    };
    img.src = imageData;
  }, []);

  // 清除填充图片
  const handleFillImageClear = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      fillImage: null,
      fillImageElement: null,
    }));
  }, []);

  // 步骤变化
  const handleStepChange = useCallback((step: number) => {
    setAppState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  // 预览效果
  const handlePreview = useCallback(async () => {
    if (!appState.currentFrame || !appState.fillMode) return;

    try {
      console.log('========== 预览调试信息 ==========');
      console.log('📍 用户选区坐标 (相对于容器):');
      console.log('   左上角:', appState.selection.x, ',', appState.selection.y);
      console.log('   右上角:', appState.selection.x + appState.selection.width, ',', appState.selection.y);
      console.log('   左下角:', appState.selection.x, ',', appState.selection.y + appState.selection.height);
      console.log('   右下角:', appState.selection.x + appState.selection.width, ',', appState.selection.y + appState.selection.height);

      // 获取容器和图片信息
      const container = document.querySelector('.video-container') as HTMLElement;
      const imgElement = container?.querySelector('img') as HTMLImageElement;

      if (!container || !imgElement) {
        throw new Error('无法找到容器或图片元素');
      }

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageNaturalWidth = imgElement.naturalWidth;
      const imageNaturalHeight = imgElement.naturalHeight;

      console.log('📐 容器和图片信息:');
      console.log('   容器尺寸:', containerWidth, 'x', containerHeight);
      console.log('   图片原始尺寸:', imageNaturalWidth, 'x', imageNaturalHeight);

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

      console.log('🔄 计算出的图片显示信息:');
      console.log('   实际显示尺寸:', displayedWidth.toFixed(2), 'x', displayedHeight.toFixed(2));
      console.log('   X 偏移:', offsetX.toFixed(2));
      console.log('   Y 偏移:', offsetY.toFixed(2));

      // 调整选区坐标，减去图片在容器中的偏移
      const adjustedSelection = {
        x: appState.selection.x - offsetX,
        y: appState.selection.y - offsetY,
        width: appState.selection.width,
        height: appState.selection.height,
      };

      console.log('🔄 调整后的选区坐标 (相对于图片显示区域):');
      console.log('   左上角:', adjustedSelection.x.toFixed(2), ',', adjustedSelection.y.toFixed(2));
      console.log('   右上角:', (adjustedSelection.x + adjustedSelection.width).toFixed(2), ',', adjustedSelection.y.toFixed(2));
      console.log('   左下角:', adjustedSelection.x.toFixed(2), ',', (adjustedSelection.y + adjustedSelection.height).toFixed(2));
      console.log('   右下角:', (adjustedSelection.x + adjustedSelection.width).toFixed(2), ',', (adjustedSelection.y + adjustedSelection.height).toFixed(2));

      const previewImage = await createPreviewImage(
        appState.currentFrame,
        adjustedSelection,
        appState.fillMode,
        appState.fillColor,
        appState.fillImageElement,
        displayedWidth,
        displayedHeight
      );

      // 显示预览模态框
      setAppState((prev) => ({
        ...prev,
        showPreviewModal: true,
        previewImage,
      }));
    } catch (error) {
      console.error('预览失败:', error);
      alert('预览失败，请重试');
    }
  }, [appState.currentFrame, appState.selection, appState.fillMode, appState.fillColor]);

  // 开始处理
  const handleProcess = useCallback(async () => {
    if (!appState.videoUrl || !appState.currentFrame || !appState.fillMode) {
      alert('请先完成前面的步骤：截取帧、选择区域、选择填充方式');
      return;
    }

    try {
      // 在切换 stage 之前，先获取容器和图片信息
      const container = document.querySelector('.video-container') as HTMLElement;
      const imgElement = container?.querySelector('img') as HTMLImageElement;

      if (!container || !imgElement) {
        alert('无法找到视频容器，请刷新页面重试');
        return;
      }

      const containerInfo = {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        imageNaturalWidth: imgElement.naturalWidth,
        imageNaturalHeight: imgElement.naturalHeight,
      };

      console.log('捕获的容器信息:', containerInfo);

      // 现在切换到处理阶段
      setAppState((prev) => ({ ...prev, stage: 'process' }));

      console.log('开始处理视频...');
      console.log('视频 URL:', appState.videoUrl);
      console.log('截取帧:', appState.currentFrame ? '已截取' : '未截取');
      console.log('选区:', appState.selection);
      console.log('填充模式:', appState.fillMode);
      console.log('填充颜色:', appState.fillColor);

      const processedUrl = await processVideo(
        appState.videoUrl,
        appState.currentFrame,
        appState.selection,
        appState.fillMode,
        appState.fillColor,
        appState.fillImageElement,
        (progress, currentFrame) => {
          console.log(`处理进度: ${progress.toFixed(1)}%, 帧: ${currentFrame}`);
          setAppState(prev => ({
            ...prev,
            processState: {
              ...prev.processState,
              progress,
              currentFrame,
            },
          }));
        },
        containerInfo
      );

      if (processedUrl) {
        console.log('视频处理成功！');

        // 创建处理后预览图，使用和视频处理相同的坐标转换逻辑
        let afterImage = appState.currentFrame || '';
        if (appState.currentFrame && appState.fillMode) {
          try {
            // 使用之前保存的 containerInfo 重新计算坐标
            const { containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight } = containerInfo;

            // 计算 object-fit: contain 下的显示尺寸和偏移
            const containerRatio = containerWidth / containerHeight;
            const imageRatio = imageNaturalWidth / imageNaturalHeight;

            let displayedWidth: number;
            let displayedHeight: number;
            let offsetX: number;
            let offsetY: number;

            if (imageRatio > containerRatio) {
              displayedWidth = containerWidth;
              displayedHeight = containerWidth / imageRatio;
              offsetX = 0;
              offsetY = (containerHeight - displayedHeight) / 2;
            } else {
              displayedHeight = containerHeight;
              displayedWidth = containerHeight * imageRatio;
              offsetX = (containerWidth - displayedWidth) / 2;
              offsetY = 0;
            }

            // 调整选区坐标，减去偏移
            const adjustedSelection = {
              x: appState.selection.x - offsetX,
              y: appState.selection.y - offsetY,
              width: appState.selection.width,
              height: appState.selection.height,
            };

            console.log('创建处理后预览图，使用调整后的坐标:', adjustedSelection);

            afterImage = await createPreviewImage(
              appState.currentFrame,
              adjustedSelection,
              appState.fillMode,
              appState.fillColor,
              appState.fillImageElement,
              displayedWidth,
              displayedHeight
            );
            console.log('预览图创建成功');
          } catch (error) {
            console.error('创建预览图失败:', error);
          }
        }

        setAppState((prev) => ({
          ...prev,
          stage: 'complete',
          processedVideoUrl: processedUrl,
          videoFormat: processedUrl.includes('mp4') ? 'mp4' : 'webm',
          afterImage,
        }));
      } else {
        console.log('视频处理被取消');
        setAppState((prev) => ({ ...prev, stage: 'work' }));
      }
    } catch (error) {
      console.error('处理失败:', error);
      alert('处理失败：' + (error as Error).message);
      setAppState((prev) => ({ ...prev, stage: 'work' }));
    }
  }, [appState.videoUrl, appState.currentFrame, appState.selection, appState.fillMode, appState.fillColor, processVideo]);

  // 下载视频
  const handleDownload = useCallback(() => {
    if (!appState.processedVideoUrl) return;

    // 直接下载为 MP4 格式
    const a = document.createElement('a');
    a.href = appState.processedVideoUrl;
    a.download = `videoclean-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [appState.processedVideoUrl]);

  // 关闭预览模态框
  const handleClosePreviewModal = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      showPreviewModal: false,
      previewImage: undefined,
    }));
  }, []);

  // 重置应用
  const handleReset = useCallback(() => {
    if (appState.videoUrl) {
      revokeVideoUrl(appState.videoUrl);
    }
    if (appState.processedVideoUrl) {
      revokeVideoUrl(appState.processedVideoUrl);
    }

    setAppState({
      stage: 'upload',
      videoFile: null,
      videoUrl: null,
      currentFrame: null,
      selection: { x: 0, y: 0, width: 0, height: 0 },
      fillMode: null,
      fillColor: '#000000',
      fillImage: null,
      fillImageElement: null,
      videoInfo: null,
      processState: {
        currentFrame: 0,
        totalFrames: 0,
        progress: 0,
        isProcessing: false,
      },
      processedVideoUrl: null,
      videoFormat: undefined,
      showPreviewModal: false,
      previewImage: undefined,
      currentStep: 1,
    });
  }, [appState.videoUrl, appState.processedVideoUrl]);

  // 清理
  useEffect(() => {
    return () => {
      if (appState.videoUrl) {
        revokeVideoUrl(appState.videoUrl);
      }
      if (appState.processedVideoUrl) {
        revokeVideoUrl(appState.processedVideoUrl);
      }
    };
  }, []);

  const canPreview = (appState.currentStep || 0) >= 4 && appState.fillMode !== null;
  const canProcess = (appState.currentStep || 0) >= 4 && appState.fillMode !== null;

  return (
    <div className="min-h-screen grid-bg">
      <Header />

      <main className="max-w-[1800px] mx-auto flex" style={{ height: 'calc(100vh - 73px)' }}>
        {/* 左侧工作区 */}
        <div className="flex-1 flex flex-col">
          {appState.stage === 'upload' && (
            <UploadStage onVideoUpload={handleVideoUpload} />
          )}

          {appState.stage === 'work' && appState.videoUrl && (
            <WorkStage
              videoUrl={appState.videoUrl}
              capturedFrame={appState.currentFrame}
              currentStep={appState.currentStep || 1}
              selection={appState.selection}
              fillMode={appState.fillMode}
              onStepChange={handleStepChange}
              onSelectionChange={handleSelectionChange}
              onFrameCapture={handleFrameCapture}
              onReturnToVideo={handleReturnToVideo}
              onPreview={handlePreview}
            />
          )}

          {appState.stage === 'process' && (
            <ProcessStage
              progress={processState.progress}
              currentFrame={processState.currentFrame}
              totalFrames={processState.totalFrames}
            />
          )}

          {appState.stage === 'complete' && (
            <CompleteStage
              beforeImage={appState.currentFrame || ''}
              afterImage={appState.afterImage || appState.currentFrame || ''}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>

        {/* 右侧控制面板 */}
        {appState.stage === 'work' && (
          <ControlPanel
            currentStep={appState.currentStep || 1}
            selection={appState.selection}
            fillMode={appState.fillMode}
            fillColor={appState.fillColor}
            fillImage={appState.fillImage}
            videoInfo={appState.videoInfo}
            onSelectionChange={handleSelectionChange}
            onFillModeChange={handleFillModeChange}
            onFillColorChange={handleFillColorChange}
            onFillImageUpload={handleFillImageUpload}
            onFillImageClear={handleFillImageClear}
            onPreview={handlePreview}
            onProcess={handleProcess}
            canPreview={canPreview}
            canProcess={canProcess}
          />
        )}
      </main>

      {/* 预览模态框 */}
      {appState.showPreviewModal && appState.previewImage && (
        <PreviewModal
          isOpen={appState.showPreviewModal}
          onClose={handleClosePreviewModal}
          beforeImage={appState.currentFrame || ''}
          afterImage={appState.previewImage}
        />
      )}
    </div>
  );
}

export default App;
