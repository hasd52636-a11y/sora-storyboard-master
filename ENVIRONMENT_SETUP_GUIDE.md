# 环境变量设置与调试指南

## 一、环境变量设置

### 1. 创建.env文件
在项目根目录创建`.env`文件，基于提供的`.env.example`模板：

```bash
# 复制模板文件并编辑
cp .env.example .env
```

### 2. 填写API密钥
在`.env`文件中填入您的API密钥：

```
# 智谱AI API密钥
ZIPPU_API_KEY=your_zhipu_api_key_here

# Google Gemini API密钥
GEMINI_API_KEY=your_gemini_api_key_here

# 硅基流动API密钥
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
```

### 3. 环境变量加载机制
项目会从以下位置加载环境变量：
- `.env`：全局环境变量
- `.env.local`：本地开发环境变量（优先级更高）
- 系统环境变量

## 二、在Trae AI中模拟真实环境调试

### 1. 创建.env.local文件
在Trae AI中，您可以直接创建`.env.local`文件并填入API密钥：

```bash
# 创建.env.local文件
write_to_file --file_path .env.local --content "SF_KEY=your_actual_api_key_here" --rewrite false
```

### 2. 验证环境变量加载
您可以创建一个简单的测试脚本来验证环境变量是否正确加载：

```javascript
// test-env.js
import dotenv from 'dotenv';
import { loadEnv } from 'vite';

// 测试dotenv加载
dotenv.config();
console.log('Dotenv加载的环境变量:', {
  API_KEY: process.env.API_KEY,
  SF_KEY: process.env.SF_KEY,
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY
});

// 测试Vite loadEnv加载
const env = loadEnv('development', '.', '');
console.log('Vite loadEnv加载的环境变量:', {
  API_KEY: env.API_KEY,
  SF_KEY: env.SF_KEY,
  SILICONFLOW_API_KEY: env.SILICONFLOW_API_KEY
});
```

### 3. 运行调试命令

```bash
# 运行测试脚本
node test-env.js

# 启动开发服务器（自动加载环境变量）
npm run dev
```

## 三、功能验证：生成图像和脚本

### 1. 图像生成功能
项目确实支持图像生成，主要通过以下方式：

- **智谱AI CogView系列**：通过`/api/ai/image`端点调用
- **Google Gemini**：直接通过Gemini API调用
- **硅基流动**：通过`/api/ai/image`端点调用

**验证步骤**：

1. 确保API密钥已正确设置
2. 启动开发服务器：`npm run dev`
3. 使用curl或Postman测试API：

```bash
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -H "X-SF-Key: your_api_key_here" \
  -d '{"prompt": "A beautiful sunset over the mountains", "size": "512x512"}'
```

### 2. 脚本生成功能
项目支持生成故事板脚本，主要通过Gemini API实现：

- **故事板规划**：`generatePlanGemini`函数
- **快速草稿**：`quickDraft`函数
- **分镜图像生成**：`generateFrameImage`函数

**验证步骤**：

1. 确保Gemini API密钥已设置
2. 启动开发服务器
3. 在浏览器中访问http://localhost:3000/
4. 输入故事描述并点击"生成故事板"

## 四、调试技巧

### 1. 添加调试日志
在代码中添加`console.log`语句来跟踪变量和执行流程：

```javascript
// 在geminiService.ts中添加调试日志
console.log('API密钥:', apiKey.substring(0, 5) + '...'); // 只显示部分密钥，保护安全
console.log('请求参数:', { prompt, size });
```

### 2. 检查API响应
在API调用后检查响应内容：

```javascript
// 在image.ts中添加响应日志
console.log('API响应状态:', sfResponse.status);
console.log('API响应内容:', await sfResponse.json());
```

### 3. 使用模拟数据
在没有真实API密钥的情况下，可以使用模拟数据进行测试：

```javascript
// 模拟图像生成响应
const mockResponse = {
  data: [{
    url: 'https://via.placeholder.com/512x512?text=Mock+Image'
  }]
};
```

## 五、注意事项

1. **密钥安全**：
   - 不要将API密钥提交到版本控制系统
   - 使用环境变量而不是硬编码密钥
   - 限制密钥的权限范围

2. **速率限制**：
   - 智谱AI图像模型并发数限制为5
   - 硅基流动等其他API也有速率限制
   - 项目已实现429错误处理和重试机制

3. **超时处理**：
   - 图像生成API调用可能需要较长时间
   - 项目已设置60秒超时时间

4. **跨域问题**：
   - 项目已配置CORS头，支持跨域请求
   - 本地开发时使用通配符CORS头

通过以上步骤，您可以在Trae AI中模拟真实环境进行调试，并验证项目的图像生成和脚本生成功能。