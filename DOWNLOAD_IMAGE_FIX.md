# 下载分镜图修复说明

## 问题
- ✅ 分镜合成页面显示正常（有分镜图像）
- ❌ 点击"下载分镜图"后，下载的 PNG 文件中分镜内容为空（白色）
- ✅ 其他元素（参考图、符号、标签等）正常显示

## 根本原因
html2canvas 无法直接捕获从 CDN 加载的外部图片，因为：
1. CORS 限制 - CDN 图片可能没有正确的 CORS 头
2. 跨域问题 - html2canvas 默认无法访问跨域资源
3. 图片加载时序 - 即使图片在页面上显示，html2canvas 也可能无法捕获

## 修复方案

**文件**: `components/ExportDownload.ts`

### 核心修复：将图片转换为 Data URLs

在调用 html2canvas 之前，将所有 `<img>` 标签的 `src` 属性从 CDN URL 转换为 Data URL：

```typescript
// 将图片 URL 转换为 data URL
async function imageUrlToDataUrl(url: string): Promise<string> {
  try {
    // 如果已经是 data URL，直接返回
    if (url.startsWith('data:')) {
      return url;
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to data URL:', url, error);
    return url;
  }
}
```

### 工作流程

1. **获取所有图片** - 查询 DOM 中的所有 `<img>` 元素
2. **转换为 Data URLs** - 将每个图片 URL 转换为 Base64 Data URL
3. **更新 DOM** - 将 `img.src` 更新为 Data URL
4. **调用 html2canvas** - 现在 html2canvas 可以直接访问这些图片
5. **生成 PNG** - 创建包含所有图片的 PNG 文件

## 优势

✅ **完全解决 CORS 问题** - Data URLs 不受 CORS 限制
✅ **确保图片被捕获** - html2canvas 可以直接访问 Data URLs
✅ **保持原始功能** - 不影响页面显示或其他功能
✅ **优雅降级** - 如果转换失败，使用原始 URL

## 预期结果

现在下载的 PNG 文件应该包含：
- ✅ 参考图片（REF SUBJECT）
- ✅ 所有分镜图像（SC-01, SC-02 等）
- ✅ 符号和标签
- ✅ 所有其他页面元素

## 部署信息

**最新部署 URL**: https://sora-storyboard-master-jfk5xn0s8-hanjiangs-projects-bee54024.vercel.app

**修改的文件**:
- `components/ExportDownload.ts` - 添加图片转换为 Data URL 的逻辑

## 使用方法

1. 在分镜合成页面，点击"下载分镜图"按钮
2. 等待转换完成（可能需要几秒钟，取决于图片数量和大小）
3. PNG 文件会自动下载
4. 打开 PNG 文件，应该能看到所有分镜图像

## 故障排除

如果下载的图片仍然为空：

1. **检查浏览器控制台** (F12 > Console)
   - 查看是否有错误信息
   - 查看图片转换日志

2. **检查网络连接**
   - 确保能访问 CDN
   - 检查是否有网络错误

3. **尝试刷新页面**
   - 重新加载页面
   - 重新生成分镜
   - 再次尝试下载

4. **检查图片加载**
   - 确保分镜图像在页面上正常显示
   - 如果页面上也看不到图片，说明是图片生成问题

## 技术细节

### 为什么使用 Data URLs？

Data URLs 是自包含的 URL，包含了完整的图片数据：
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

优点：
- 不受 CORS 限制
- 可以被任何 JavaScript 代码访问
- html2canvas 可以直接使用

### 性能考虑

- 转换过程可能需要几秒钟（取决于图片数量和大小）
- 每个图片都需要单独转换
- 使用 `Promise.all()` 并行处理以加快速度

## 需要帮助？

如果问题仍未解决：
1. 检查浏览器控制台的错误信息
2. 确认分镜图像在页面上正常显示
3. 尝试使用不同的浏览器
4. 查看网络标签页，确认图片能正确加载
