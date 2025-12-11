# DeepSeek 模型说明文档

## 一、两个 DeepSeek 模型的区别

项目中提供了两个 DeepSeek 模型选项，它们的主要区别在于 **API 访问方式** 和 **服务提供商**：

### 1. DeepSeek (官方API)
- **访问方式**：直接连接 DeepSeek 官方 API 服务
- **API 域名**：`https://api.deepseek.com`
- **模型**：`deepseek-chat`
- **特点**：
  - 官方直接服务，稳定性和响应速度有保障
  - 需使用 DeepSeek 官方 API Key
  - 适合已有 DeepSeek 账号的用户

### 2. DeepSeek (硅基流动代理)
- **访问方式**：通过 SiliconFlow (硅基流动) 提供的代理服务访问 DeepSeek 模型
- **API 域名**：`https://api.siliconflow.cn/v1`
- **模型**：`deepseek-ai/DeepSeek-R1`
- **特点**：
  - 通过第三方代理服务，可能支持更多模型版本
  - 需使用 SiliconFlow 的 API Key
  - 适合希望通过硅基流动统一管理多种模型的用户

## 二、本地测试与部署后的差异

### 1. 本地测试工作原理

在本地开发环境中，项目通过 **Vite 代理** 解决跨域问题：

`vite.config.ts` 中的代理配置：
```typescript
proxy: {
  '/api/deepseek': {
    target: 'https://api.deepseek.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
    secure: false
  },
  '/api/siliconflow': {
    target: 'https://api.siliconflow.cn',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/siliconflow/, ''),
    secure: false
  }
}
```

- 本地请求会先发送到 `http://localhost:3004/api/deepseek`
- Vite 代理服务器将请求转发到 `https://api.deepseek.com`
- 响应返回给前端，避免了浏览器的跨域限制

### 2. 部署后可能遇到的问题

当前项目的 `vercel.json` 配置仅包含基本的静态资源路由：
```json
{
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**部署后可能无法访问外部 API 的原因**：

1. **缺少代理配置**：Vercel 部署后不会自动继承 Vite 的代理配置
2. **跨域限制**：浏览器会阻止直接向外部 API 发送请求（CORS 策略）
3. **API Key 安全**：直接在前端暴露 API Key 存在安全风险

## 三、部署解决方案

要在 Vercel 或其他静态托管平台上正常使用 DeepSeek API，您需要：

### 方案 1：使用 Vercel 边缘函数

在项目中创建 `api/proxy/[...path].js` 文件：

```javascript
// api/proxy/[...path].js
export default async function handler(req, res) {
  const { path } = req.query;
  const targetUrl = `https://api.deepseek.com/${path.join('/')}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        // 可以在这里添加其他必要的头部
      },
      body: req.method !== 'GET' ? req.body : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
```

### 方案 2：修改前端请求逻辑

更新 `services/geminiService.ts` 中的代理逻辑，添加生产环境处理：

```typescript
// 生产环境下直接使用完整的 API 地址
const isProduction = import.meta.env.PROD;
let proxyUrl: string;

if (isProduction) {
  proxyUrl = baseUrl; // 生产环境直接使用完整 URL
} else {
  // 本地开发环境使用代理
  if (baseUrl.includes('deepseek.com')) {
    proxyUrl = '/api/deepseek';
  } else if (baseUrl.includes('siliconflow.cn')) {
    proxyUrl = '/api/siliconflow';
  } else {
    proxyUrl = baseUrl;
  }
}
```

注意：此方案可能会遇到浏览器的 CORS 限制，需要 API 服务端支持跨域请求。

### 方案 3：使用第三方 CORS 代理

在 `services/geminiService.ts` 中配置：

```typescript
// 使用第三方 CORS 代理服务
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
let proxyUrl: string;

if (isProduction) {
  proxyUrl = CORS_PROXY + baseUrl;
} else {
  // 本地开发环境使用 Vite 代理
  if (baseUrl.includes('deepseek.com')) {
    proxyUrl = '/api/deepseek';
  } else if (baseUrl.includes('siliconflow.cn')) {
    proxyUrl = '/api/siliconflow';
  } else {
    proxyUrl = baseUrl;
  }
}
```

注意：第三方代理可能存在稳定性和安全性风险，不建议在生产环境中使用。

## 四、最佳实践建议

1. **API Key 管理**：
   - 不要将 API Key 硬编码到前端代码中
   - 使用环境变量或后端服务管理 API Key

2. **选择合适的模型**：
   - 如果已有 DeepSeek 官方账号，优先使用「DeepSeek (官方API)」
   - 如果希望统一管理多种模型，可选择「DeepSeek (硅基流动代理)」

3. **部署配置**：
   - 推荐使用方案 1（Vercel 边缘函数）处理 API 请求
   - 确保所有外部 API 请求都通过代理或服务器端处理

4. **测试验证**：
   - 本地测试通过后，部署前先在测试环境验证 API 连接
   - 检查浏览器控制台是否有 CORS 或其他网络错误

如有其他问题或需要进一步的帮助，请随时联系。