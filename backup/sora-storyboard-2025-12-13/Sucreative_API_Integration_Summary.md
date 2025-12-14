# 速创API接入总结文档

## 项目概述
本项目成功接入了速创API的两大核心功能：
- **Chat API**：基于Gemini 3.0 Pro模型的文本对话功能
- **Image API**：基于NanoBanana模型的图像生成功能

## 已完成的工作

### 1. Vite代理配置
- 配置文件：`vite.config.ts`
- 为速创API添加了代理配置，解决跨域问题
- 支持开发环境和生产环境的API路径处理

### 2. API预设配置
- 配置文件：`src/components/SettingsModal.tsx`
- 添加了速创Chat API预设（Gemini 3.0 Pro）
- 添加了速创Image API预设（NanoBanana）
- 包含完整的模型参数和API端点配置

### 3. API服务实现
- 实现文件：`services/geminiService.ts`
- **签名生成逻辑**：实现了速创API的签名生成函数
- **Chat API调用**：支持文本对话功能
- **Image API调用**：支持图片生成和图片编辑功能
- **请求格式处理**：根据API文档要求调整了Content-Type和请求体格式

### 4. 模型名称修正
- 将错误的模型名称 `nanoBanana-pro` 修正为 `nano-banana`
- 同步更新了SettingsModal和geminiService中的配置

### 5. 测试脚本创建
- **Chat API测试**：`test-sucreative-chat-api.js`
- **Image API测试**：`test-sucreative-image-api.js`
- 支持基本功能测试和参数验证

## API使用方法

### Chat API
- **接口地址**：`https://api.wuyinkeji.com/api/chat/index`
- **认证方式**：API密钥 + 签名
- **请求方式**：POST
- **支持模型**：`gemini-3-pro`

### Image API
- **接口地址**：`https://api.wuyinkeji.com/api/img/nanoBanana`
- **认证方式**：Authorization头
- **请求方式**：POST
- **支持模型**：`nano-banana`
- **请求体格式**：
```json
{
  "model": "nano-banana",
  "prompt": "图片描述",
  "aspectRatio": "1:1",
  "img_url": ["图片URL1", "图片URL2"]
}
```

## 配置说明

### API密钥配置
1. 打开应用设置
2. 选择"速创API"预设
3. 输入您的API密钥
4. 保存配置

### 代理配置
- 开发环境：通过`/api/sucreative`代理
- 生产环境：直接调用速创API地址

## 注意事项

1. **API密钥安全**：请勿将API密钥暴露在前端代码中
2. **请求频率限制**：1秒最多300次请求
3. **参数格式**：严格按照API文档要求的格式发送请求
4. **图片URL**：仅支持外网可访问的图片链接
5. **模型名称**：请使用正确的模型名称 `nano-banana`

## 错误处理

常见错误及解决方案：
- **403错误**：API密钥不正确或签名错误
- **405错误**：请求方式不正确（需使用POST）
- **格式错误**：检查Content-Type和请求体格式
- **网络错误**：检查网络连接和代理配置

## 测试结果

- API请求格式正确，能正常连接到速创服务器
- 需要有效的API密钥才能获取成功响应
- 所有参数验证通过，符合API文档要求

## 后续优化建议

1. 添加API使用统计功能
2. 实现自动重试机制
3. 优化错误提示信息
4. 添加更多模型支持
5. 实现API密钥加密存储
