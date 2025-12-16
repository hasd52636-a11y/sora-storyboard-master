# Sora Storyboard Master 使用说明

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

编辑 `.env` 文件，配置您的API密钥：

```env
# 智谱AI API密钥（用于文本和图像生成）
ZIPPU_API_KEY=your_zhipu_api_key

# 速创AI API密钥（用于图像生成）
SUCREATIVE_API_KEY=your_sucreative_api_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 或其他可用端口上启动。

### 4. 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist` 目录中。

## 功能说明

### 工作流程

1. **设置**：输入脚本内容，选择风格和宽高比
2. **编辑**：修改分镜描述和视觉提示，生成图像
3. **导出**：导出故事板为图像或视频

### 配置选项

在设置页面，您可以配置：

- **语言**：选择英语或中文
- **LLM配置**：选择文本生成API提供商（Gemini、DeepSeek、智谱等）
- **图像配置**：选择图像生成API提供商（智谱CogView、速创NanoBanana）

### 图像生成

- 支持智谱和速创两种图像生成API提供商
- 支持参考图像上传
- 支持风格选择和自定义提示词

## API提供商支持

### 文本生成API

- Google Gemini
- DeepSeek
- 智谱清言（ChatGLM）
- 通义千问
- 月之暗面（Kimi）
- 豆包
- 腾讯混元
- 硅基流动
- 速创
- 自定义API

### 图像生成API

- 智谱CogView（支持cogview-4和cogview-3-flash模型）
- 速创NanoBanana
- 自定义API

## 常见问题

### Q: 图像生成失败怎么办？

A: 请检查：
1. API密钥是否正确配置
2. 网络连接是否正常
3. 提示词是否符合要求（避免敏感内容）
4. 尝试更换API提供商

### Q: 如何选择图像生成模型？

A: 在设置页面的图像配置部分，您可以选择智谱CogView或速创NanoBanana模型。

### Q: 如何清除本地存储的配置？

A: 运行以下命令：

```bash
node clear-local-storage.js
```

## 技术支持

如有问题，请联系：
- 邮箱：909599954@qq.com
- 网站：www.wboke.com

## 更新日志

- 支持多语言（中文/英文）
- 支持多种API提供商
- 支持图像参考功能
- 优化的用户界面和体验
- 内置免费图像生成通道
