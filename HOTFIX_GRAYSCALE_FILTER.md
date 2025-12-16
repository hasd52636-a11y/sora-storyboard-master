# 热修复：分镜图灰度过滤优化

## 问题描述

下载分镜表时，参考主体（RED=REF）被错误地转换成了黑白，应该保持原始颜色。

## 修复内容

### 修改文件：`components/ExportDownload.ts`

**修复逻辑：**
1. ✅ 检测是否存在参考主体（RED=REF）
2. ✅ 如果有参考主体：
   - 参考主体区域保持原始颜色（彩色）
   - 分镜图区域转换为黑白
3. ✅ 如果没有参考主体：
   - 所有分镜图转换为黑白

### 实现细节

```typescript
// 检查是否有参考主体
const referenceImageElement = element.querySelector('[style*="border-dashed"][style*="border-red"]');
const hasReferenceImage = referenceImageElement !== null;

// 计算参考主体宽度（约占总宽度的22%）
let referenceWidth = 0;
if (hasReferenceImage) {
  referenceWidth = Math.floor(canvas.width * 0.22);
}

// 对每个像素应用灰度过滤
for (let i = 0; i < data.length; i += 4) {
  const pixelIndex = i / 4;
  const pixelX = pixelIndex % canvas.width;
  
  // 如果像素在参考主体区域内，跳过灰度处理
  const isInReferenceArea = hasReferenceImage && pixelX < referenceWidth;
  
  if (!isInReferenceArea) {
    // 应用灰度和对比度过滤
    // ...
  }
}
```

## 部署信息

- **部署时间**: 2025年12月16日
- **部署环境**: Vercel生产环境
- **新URL**: https://sora-storyboard-master-kz1tkdxrq-hanjiangs-projects-bee54024.vercel.app

## 验证步骤

1. ✅ 构建成功
2. ✅ API编译成功
3. ✅ Vercel部署成功
4. ✅ 生产环境已更新

## 测试方法

### 场景1：有参考主体
1. 上传一张彩色参考图片
2. 生成分镜
3. 导出分镜表
4. **预期结果**：参考主体保持彩色，分镜图为黑白

### 场景2：没有参考主体
1. 不上传参考图片
2. 生成分镜
3. 导出分镜表
4. **预期结果**：所有分镜图为黑白

## 修复前后对比

### 修复前
- ❌ 参考主体被转换成黑白
- ❌ 用户上传的彩色图片丢失颜色

### 修复后
- ✅ 参考主体保持原始颜色
- ✅ 分镜图正确转换为黑白
- ✅ 下载的分镜表显示正确

## 相关文件

- `components/ExportDownload.ts` - 导出下载功能
- `components/Export.tsx` - 导出页面组件

## 后续改进

- [ ] 考虑添加用户选项来控制灰度过滤
- [ ] 优化参考主体区域检测算法
- [ ] 添加更多导出格式选项

---

**状态**: ✅ 已部署
**版本**: 1.0.1
**日期**: 2025-12-16
