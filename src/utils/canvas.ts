import { Selection, FillMode } from '../types';

/**
 * 对 canvas 应用填充效果
 */
export function applyFill(
  ctx: CanvasRenderingContext2D,
  selection: Selection,
  fillMode: FillMode,
  fillColor: string,
  fillImage: HTMLImageElement | null
): void {
  const { x, y, width, height } = selection;

  console.log('=== applyFill 被调用 ===');
  console.log('📝 填充模式:', fillMode);
  console.log('📝 Canvas 尺寸:', ctx.canvas.width, 'x', ctx.canvas.height);
  console.log('📝 填充颜色:', fillColor);

  console.log('🎨 最终绘制的填充区域四角坐标:');
  console.log('   左上角 (x, y):', x, ',', y);
  console.log('   右上角 (x+width, y):', x + width, ',', y);
  console.log('   左下角 (x, y+height):', x, ',', y + height);
  console.log('   右下角 (x+width, y+height):', x + width, ',', y + height);
  console.log('   填充尺寸 (width x height):', width, 'x', height);

  // 验证选区
  if (width <= 0 || height <= 0) {
    console.warn('⚠️ 选区无效，跳过填充');
    return;
  }

  switch (fillMode) {
    case 'color':
      console.log('✍️ 执行 ctx.fillRect(', x, ',', y, ',', width, ',', height, ')');
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);
      console.log('✅ fillRect 完成');
      break;

    case 'image':
      if (fillImage) {
        ctx.drawImage(fillImage, x, y, width, height);
      }
      break;

    case 'smart':
      applySmartFill(ctx, selection);
      break;
  }
}

/**
 * 智能填充 - 使用周围像素扩展
 */
function applySmartFill(
  ctx: CanvasRenderingContext2D,
  selection: Selection
): void {
  const { x, y, width, height } = selection;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  // 简单的智能填充：从选区周围的像素采样并扩展
  const padding = 5;

  // 验证选区尺寸
  if (width <= 0 || height <= 0) {
    console.warn('选区尺寸无效，跳过智能填充');
    return;
  }

  // 获取周围的像素数据
  // 上方
  if (y - padding > 0 && width > 0) {
    const topHeight = Math.min(padding, y);
    const topData = ctx.getImageData(
      Math.max(0, x),
      Math.max(0, y - topHeight),
      Math.min(width, canvasWidth - x),
      topHeight
    );
    ctx.putImageData(topData, x, y);
  }

  // 下方
  if (y + height + padding < canvasHeight && width > 0) {
    const bottomHeight = Math.min(padding, canvasHeight - y - height);
    const bottomData = ctx.getImageData(
      Math.max(0, x),
      Math.min(canvasHeight - bottomHeight, y + height),
      Math.min(width, canvasWidth - x),
      bottomHeight
    );
    ctx.putImageData(bottomData, x, y + height - bottomHeight);
  }

  // 左方
  if (x - padding > 0 && height > 0) {
    const leftWidth = Math.min(padding, x);
    const leftData = ctx.getImageData(
      Math.max(0, x - leftWidth),
      Math.max(0, y),
      leftWidth,
      Math.min(height, canvasHeight - y)
    );
    ctx.putImageData(leftData, x, y);
  }

  // 右方
  if (x + width + padding < canvasWidth && height > 0) {
    const rightWidth = Math.min(padding, canvasWidth - x - width);
    const rightData = ctx.getImageData(
      Math.min(canvasWidth - rightWidth, x + width),
      Math.max(0, y),
      rightWidth,
      Math.min(height, canvasHeight - y)
    );
    ctx.putImageData(rightData, x + width - rightWidth, y);
  }

  // 填充中间区域（简单模糊填充）
  try {
    const centerData = ctx.getImageData(x, y, width, height);
    blurImageData(centerData, width, height);
    ctx.putImageData(centerData, x, y);
  } catch (error) {
    console.error('填充中间区域失败:', error);
  }
}

/**
 * 简单的图像模糊算法
 */
function blurImageData(imageData: ImageData, width: number, height: number): void {
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // 简单的 3x3 均值模糊
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
}

/**
 * 创建包含填充效果的预览图
 */
export function createPreviewImage(
  sourceImage: string,
  selection: Selection,
  fillMode: FillMode,
  fillColor: string,
  fillImage: HTMLImageElement | null,
  displayedWidth?: number,
  displayedHeight?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      console.log('=== 创建预览图片 ===');
      console.log('原始图片尺寸:', img.naturalWidth, 'x', img.naturalHeight);
      console.log('显示尺寸:', displayedWidth, 'x', displayedHeight);
      console.log('选区坐标 (显示坐标系，已调整偏移):', selection);

      // 验证选区是否在有效范围内（选区应该是相对于图片显示区域的）
      if (displayedWidth && displayedHeight) {
        if (selection.x < 0 || selection.y < 0 ||
            selection.x + selection.width > displayedWidth ||
            selection.y + selection.height > displayedHeight) {
          console.warn('⚠️ 选区超出图片显示区域，可能需要调整');
          console.warn('选区:', selection, '显示区域:', { width: displayedWidth, height: displayedHeight });
        }
      }

      // 计算坐标转换
      let scaledSelection: Selection;

      if (displayedWidth && displayedHeight && displayedWidth > 0 && displayedHeight > 0) {
        // 计算缩放比例
        const scaleX = img.naturalWidth / displayedWidth;
        const scaleY = img.naturalHeight / displayedHeight;

        console.log('🔄 坐标转换信息:');
        console.log('   缩放比例 X:', scaleX.toFixed(4), 'Y:', scaleY.toFixed(4));

        // 转换坐标到原始图片坐标系
        const rawScaledSelection = {
          x: selection.x * scaleX,
          y: selection.y * scaleY,
          width: selection.width * scaleX,
          height: selection.height * scaleY,
        };

        scaledSelection = {
          x: Math.round(rawScaledSelection.x),
          y: Math.round(rawScaledSelection.y),
          width: Math.round(rawScaledSelection.width),
          height: Math.round(rawScaledSelection.height),
        };

        console.log('📍 转换前的原始坐标 (原始图片坐标系):');
        console.log('   左上角:', rawScaledSelection.x.toFixed(2), ',', rawScaledSelection.y.toFixed(2));
        console.log('   右上角:', (rawScaledSelection.x + rawScaledSelection.width).toFixed(2), ',', rawScaledSelection.y.toFixed(2));
        console.log('   左下角:', rawScaledSelection.x.toFixed(2), ',', (rawScaledSelection.y + rawScaledSelection.height).toFixed(2));
        console.log('   右下角:', (rawScaledSelection.x + rawScaledSelection.width).toFixed(2), ',', (rawScaledSelection.y + rawScaledSelection.height).toFixed(2));

        console.log('📍 四舍五入后的坐标 (原始图片坐标系):');
        console.log('   左上角:', scaledSelection.x, ',', scaledSelection.y);
        console.log('   右上角:', scaledSelection.x + scaledSelection.width, ',', scaledSelection.y);
        console.log('   左下角:', scaledSelection.x, ',', scaledSelection.y + scaledSelection.height);
        console.log('   右下角:', scaledSelection.x + scaledSelection.width, ',', scaledSelection.y + scaledSelection.height);

        // 验证并调整坐标
        let adjusted = false;
        if (scaledSelection.x < 0) {
          scaledSelection.x = 0;
          adjusted = true;
        }
        if (scaledSelection.y < 0) {
          scaledSelection.y = 0;
          adjusted = true;
        }
        if (scaledSelection.x + scaledSelection.width > img.naturalWidth) {
          scaledSelection.width = img.naturalWidth - scaledSelection.x;
          adjusted = true;
        }
        if (scaledSelection.y + scaledSelection.height > img.naturalHeight) {
          scaledSelection.height = img.naturalHeight - scaledSelection.y;
          adjusted = true;
        }

        if (adjusted) {
          console.log('⚠️ 坐标被调整以适应图片范围');
          console.log('   调整后的左上角:', scaledSelection.x, ',', scaledSelection.y);
          console.log('   调整后的右下角:', scaledSelection.x + scaledSelection.width, ',', scaledSelection.y + scaledSelection.height);
        }
      } else {
        // 没有显示尺寸，使用原始选区
        scaledSelection = { ...selection };
        console.log('使用原始选区坐标:', scaledSelection);
      }

      // 验证选区是否有效
      if (scaledSelection.width <= 0 || scaledSelection.height <= 0) {
        console.warn('⚠️ 选区无效，无法创建预览');
        reject(new Error('选区尺寸无效'));
        return;
      }

      // 创建 canvas 并绘制
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      console.log('Canvas 尺寸:', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'));
        return;
      }

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);
      console.log('✅ 原始图片已绘制到 Canvas');

      // 应用填充效果
      console.log('应用填充模式:', fillMode);
      console.log('填充颜色:', fillColor);
      console.log('fillRect 参数:', scaledSelection.x, scaledSelection.y, scaledSelection.width, scaledSelection.height);

      applyFill(ctx, scaledSelection, fillMode, fillColor, fillImage);

      console.log('✅ 预览图片创建完成');

      // 返回 base64 图片
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (error) => {
      console.error('❌ 图片加载失败:', error);
      reject(new Error('无法加载图片'));
    };

    img.src = sourceImage;
  });
}
