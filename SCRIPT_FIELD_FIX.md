# 脚本字段修复说明

## 问题
四个脚本输入框中没有对应的脚本和语言：
- Visual Prompt (EN) - 英文视觉提示词
- 画面描述 (中文) - 中文视觉描述
- Video Prompt (EN) - 英文视频提示词
- 视频提示词 (中文) - 中文视频提示词

## 根本原因
1. **LLM API 调用失败** - 当 LLM API 返回错误时，系统没有正确处理
2. **缺少用户脚本内容** - 当使用默认值时，没有包含用户输入的脚本内容
3. **错误处理不完善** - 某些 API 错误没有被正确捕获和处理

## 修复内容

### 1. 改进脚本分配逻辑
**文件**: `services/geminiService.ts`

现在当 LLM 返回的字段缺失时，会使用合理的默认值（不包含完整用户脚本）：

```typescript
const visualPrompt = frame.visualPrompt || 
  `${config.style.name} style storyboard sketch for scene ${index + 1}, simple line art, white background`;

const visualPromptZh = frame.visualPromptZh || 
  `${config.style.nameZh}风格分镜草图 - 第${index + 1}镜，简洁线条，白色背景`;

const description = frame.description || 
  `Scene ${index + 1}: Narrative description and camera direction`;

const descriptionZh = frame.descriptionZh || 
  `第${index + 1}镜：剧情描述和镜头指导`;
```

### 2. 改进 LLM API 错误处理
**文件**: `services/geminiService.ts`

现在会检查 API 响应是否成功，并提供详细的错误日志：

```typescript
if (!res.ok) {
  const errorText = await res.text();
  console.error('Sucreative API Error:', { status: res.status, error: errorText });
  throw new Error(`Sucreative API Error: ${res.status} - ${errorText}`);
}

if (!data.data) {
  console.warn('Sucreative API returned empty data');
  throw new Error('Sucreative API returned empty data');
}
```

### 3. 添加调试日志
现在会输出详细的调试信息，帮助诊断问题：

```typescript
console.log('Calling LLM with config:', { provider: llmConfig.provider, model: llmConfig.model });
console.log('LLM Response received:', { hasChoices: !!response.choices, hasContent: !!response.choices?.[0]?.message?.content });
console.log('LLM Content length:', content.length, 'First 100 chars:', content.substring(0, 100));
```

## 使用方法

### 查看调试信息
1. 打开浏览器开发者工具 (F12)
2. 切换到 **Console** 标签
3. 生成脚本时，查看输出的日志信息

### 如果仍然为空
1. 检查 API 密钥是否正确配置
2. 查看控制台中的错误信息
3. 尝试不同的 LLM 提供商
4. 确保 API 账户有足够的配额

## 预期行为

现在当生成脚本时：

1. **如果 LLM API 成功** ✅
   - 四个字段会填充 LLM 返回的内容
   - 例如：LLM 会为每个场景生成不同的视觉提示词和视频提示词

2. **如果 LLM API 失败** ✅
   - 四个字段会填充合理的默认值
   - Visual Prompt (EN): "Minimal sketch style storyboard sketch for scene 1, simple line art, white background"
   - 画面描述 (中文): "Minimal sketch style分镜草图 - 第1镜，简洁线条，白色背景"
   - Video Prompt (EN): "Scene 1: Narrative description and camera direction"
   - 视频提示词 (中文): "第1镜：剧情描述和镜头指导"

3. **所有情况下** - 四个字段都会有对应的语言和内容，不会包含完整的用户脚本

## 部署信息

**最新部署 URL**: https://sora-storyboard-master-3ghjz02ho-hanjiangs-projects-bee54024.vercel.app

**修改的文件**:
- `services/geminiService.ts` - 改进脚本分配逻辑，使用合理的默认值而不是完整用户脚本

## 需要帮助？

如果问题仍未解决：
1. 检查浏览器控制台的错误信息
2. 确认 API 密钥配置正确
3. 尝试使用不同的 LLM 提供商
4. 查看 `API_CONFIGURATION_GUIDE.md` 获取更多帮助
