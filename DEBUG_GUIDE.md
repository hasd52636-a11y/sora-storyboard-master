# 🔧 调试指南

## 项目状态

✅ **开发服务器已启动**
- 运行地址: http://localhost:3001
- 原因: 端口3000被占用，Vite自动切换到3001

## 快速诊断工具

### 1. 状态检查脚本
```bash
check-status.bat
```
这个脚本会检查：
- Node.js和npm版本
- 项目依赖安装情况
- 环境变量配置
- 端口占用情况
- 开发服务器状态

### 2. API端点测试页面
```bash
start test-api-endpoints.html
```
或直接在浏览器中打开: `test-api-endpoints.html`

这个页面可以：
- 查看所有API代理配置
- 测试聊天API端点
- 测试图像生成API端点
- 检查环境变量配置

### 3. 启动开发服务器
```bash
start-dev.bat
```
或使用npm命令:
```bash
npm run dev
```

## 常见问题解决

### 问题1: 端口3000被占用
**现象**: Vite提示 "Port 3000 is in use, trying another one..."

**解决方案**:
1. 这是正常的，Vite会自动切换到3001端口
2. 如果需要释放3000端口，查找占用进程：
   ```bash
   netstat -ano | findstr :3000
   ```
3. 结束占用进程（替换PID为实际进程ID）：
   ```bash
   taskkill /PID <PID> /F
   ```

### 问题2: API调用失败
**现象**: 应用中API请求返回错误

**解决方案**:
1. 检查API密钥是否配置：
   - 打开应用设置页面
   - 确认LLM和Image API密钥已填写
   
2. 使用测试页面验证API端点：
   ```bash
   start test-api-endpoints.html
   ```

3. 检查.env.local文件：
   ```bash
   type .env.local
   ```

### 问题3: 依赖安装问题
**现象**: 启动时报错找不到模块

**解决方案**:
```bash
# 删除node_modules和package-lock.json
rmdir /s /q node_modules
del package-lock.json

# 重新安装依赖
npm install
```

### 问题4: 构建失败
**现象**: npm run build报错

**解决方案**:
1. 检查TypeScript错误：
   ```bash
   npm run build-api
   ```

2. 清理缓存后重新构建：
   ```bash
   rmdir /s /q dist
   rmdir /s /q api-dist
   npm run build
   ```

## API配置说明

### 开发环境代理配置
项目在开发环境下配置了以下API代理（vite.config.ts）：

| 本地路径 | 目标API | 说明 |
|---------|---------|------|
| /api/deepseek | https://api.deepseek.com | DeepSeek API |
| /api/openai | https://api.openai.com | OpenAI API |
| /api/zhipu | https://open.bigmodel.cn | 智谱AI API |
| /api/qwen | https://dashscope.aliyuncs.com | 通义千问API |
| /api/moonshot | https://api.moonshot.cn | Moonshot API |
| /api/doubao | https://ark.cn-beijing.volces.com | 豆包API |
| /api/hunyuan | https://api.hunyuan.cloud.tencent.com | 混元API |
| /api/siliconflow | https://api.siliconflow.cn | 硅基流动API |
| /api/sucreative | https://api.wuyinkeji.com | 速创API |
| /api/ai/chat | - | 统一聊天API端点 |
| /api/ai/image | - | 统一图像生成API端点 |

### 环境变量配置
在`.env.local`文件中配置：
```env
SILICONFLOW_API_KEY=your_api_key_here
```

## 项目结构

```
sora-storyboard-master/
├── api/                    # API端点实现
│   ├── ai/                # AI相关API
│   │   ├── chat.ts       # 聊天API
│   │   └── image.ts      # 图像生成API
│   └── [provider]/       # 各提供商代理
├── components/            # React组件
├── services/             # 服务层
│   ├── aiService.ts     # AI服务
│   └── geminiService.ts # Gemini服务
├── src/                  # 源代码
├── vite.config.ts       # Vite配置
├── package.json         # 项目配置
└── .env.local          # 环境变量

工具文件:
├── check-status.bat           # 状态检查脚本
├── start-dev.bat             # 启动脚本
├── test-api-endpoints.html   # API测试页面
└── DEBUG_GUIDE.md           # 本文档
```

## 开发流程

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问应用**
   - 打开浏览器访问: http://localhost:3001
   - 或使用显示的其他网络地址

3. **配置API密钥**
   - 点击右上角"设置"按钮
   - 配置LLM和Image API的提供商和密钥

4. **开始使用**
   - 输入脚本内容
   - 选择视觉风格
   - 生成分镜

## 生产部署

### Vercel部署
项目已配置Vercel部署（vercel.json）：

```bash
# 构建命令
npm run build && npm run build-api

# 输出目录
dist/
```

### 环境变量配置
在Vercel项目设置中添加：
- `SILICONFLOW_API_KEY`
- 其他需要的API密钥

## 技术栈

- **前端框架**: React 19.2.1
- **构建工具**: Vite 6.2.0
- **样式**: Tailwind CSS 3.4.19
- **AI集成**: 
  - Google Generative AI
  - OpenAI兼容API
  - 多个国内AI提供商

## 获取帮助

如果遇到问题：
1. 运行 `check-status.bat` 检查项目状态
2. 使用 `test-api-endpoints.html` 测试API
3. 查看浏览器控制台错误信息
4. 查看开发服务器终端输出

## 联系方式

- Email: hanjiangstudio@gmail.com
- Web: hanjiangstudio.com
