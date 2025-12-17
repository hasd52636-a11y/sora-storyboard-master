// 将图片 URL 转换为 data URL，带重试机制
async function imageUrlToDataUrl(url: string, retries: number = 2): Promise<string> {
  try {
    // 如果已经是 data URL，直接返回
    if (url.startsWith('data:')) {
      return url;
    }
    
    // 使用代理 API 来获取图片，避免 CORS 问题
    try {
      const response = await fetch('/api/ai/proxy-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(15000) // 15秒超时
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.dataUrl) {
          console.log('✓ Proxy API succeeded for:', url.substring(0, 50));
          return data.dataUrl;
        }
      }
      
      console.warn('Proxy API failed with status:', response.status, 'for URL:', url.substring(0, 50));
    } catch (proxyError) {
      console.warn('Proxy API error:', proxyError instanceof Error ? proxyError.message : String(proxyError));
    }
    
    // 如果代理失败，尝试直接获取
    console.log('Attempting direct fetch for:', url.substring(0, 50));
    try {
      const directResponse = await fetch(url, {
        mode: 'no-cors',
        signal: AbortSignal.timeout(15000) // 15秒超时
      });
      
      const blob = await directResponse.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('✓ Direct fetch succeeded for:', url.substring(0, 50));
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.warn('FileReader error for:', url.substring(0, 50));
          reject(new Error('FileReader error'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (directError) {
      console.warn('Direct fetch failed:', directError instanceof Error ? directError.message : String(directError));
      
      // 如果还有重试次数，等待后重试
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return imageUrlToDataUrl(url, retries - 1);
      }
    }
    
    // 所有方法都失败，返回原始 URL
    console.warn('All conversion methods failed, returning original URL:', url.substring(0, 50));
    return url;
  } catch (error) {
    console.error('Unexpected error in imageUrlToDataUrl:', error);
    return url;
  }
}

// 专门处理导出下载的工具函数 - 将图片转换为 data URLs 以确保 html2canvas 能捕获
export async function downloadStoryboardSheet(element: HTMLElement, filename: string): Promise<void> {
  try {
    console.log('Starting download for:', filename);
    
    // 第一步：将所有图片转换为 data URLs
    const images = element.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    console.log('Found', images.length, 'images to convert');
    
    // 创建一个副本数组来存储原始 src，防止在转换过程中丢失引用
    const imageData = Array.from(images).map((img, index) => ({
      element: img,
      originalSrc: img.src,
      index: index
    }));
    
    // 顺序转换图片，而不是并行转换，以避免竞态条件
    for (const data of imageData) {
      try {
        if (data.originalSrc && !data.originalSrc.startsWith('data:')) {
          console.log(`Converting image ${data.index + 1}/${imageData.length}:`, data.originalSrc.substring(0, 50));
          const dataUrl = await imageUrlToDataUrl(data.originalSrc);
          data.element.src = dataUrl;
          console.log(`✓ Image ${data.index + 1} converted successfully`);
        }
      } catch (error) {
        console.warn(`Failed to convert image ${data.index + 1}:`, error);
        // 继续转换其他图片，不中断流程
      }
    }
    
    console.log('All images converted to data URLs');
    
    // 第二步：等待一下让 DOM 完全渲染
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 应用灰度过滤 - 在下载前对所有图片应用灰度
    // 策略：找到所有img元素，对其应用CSS过滤器，然后渲染canvas
    const allImages = element.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    const originalFilters: Map<HTMLImageElement, string> = new Map();
    
    // 检查是否有参考主体（RED=REF）
    const referenceImageElement = element.querySelector('[style*="border-dashed"][style*="border-red"] img') as HTMLImageElement | null;
    
    // 对所有图片应用灰度，除了参考主体
    allImages.forEach(img => {
      originalFilters.set(img, img.style.filter || '');
      
      // 如果是参考主体，保持原色
      if (img === referenceImageElement) {
        console.log('Skipping grayscale for reference image');
        img.style.filter = '';
      } else {
        // 对其他所有图片应用灰度和对比度
        img.style.filter = 'grayscale(100%) contrast(1.2)';
      }
    });
    
    // 等待图片过滤器应用
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 使用 html2canvas
    const html2canvas = (await import('html2canvas')).default;
    
    console.log('Element dimensions:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });
    
    // 使用html2canvas捕获应用了过滤器的元素
    const finalCanvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 10000,
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
      proxy: null,
      ignoreElements: (el: Element) => {
        return el.tagName === 'IFRAME' || el.tagName === 'SCRIPT';
      }
    });
    
    // 恢复原始过滤器
    originalFilters.forEach((originalFilter, img) => {
      img.style.filter = originalFilter;
    });
    
    console.log('Canvas created successfully, size:', finalCanvas.width, 'x', finalCanvas.height);
    console.log('Grayscale filter applied to all storyboard frame images, reference image preserved');
    
    // 转换为 blob 并下载
    finalCanvas.toBlob((blob) => {
      if (blob) {
        console.log('Blob created, size:', blob.size);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Download triggered');
      } else {
        throw new Error('Failed to create blob');
      }
    }, 'image/png');
    
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('下载失败，请重试');
  }
}
