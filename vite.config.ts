import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import dotenv from 'dotenv';

export default defineConfig(({ mode }) => {
    // 加载所有可能的环境变量文件，包括.env.local
    const env = loadEnv(mode, '.', '');
    
    // 尝试从.env.local文件读取环境变量
    try {
      const envLocalPath = path.resolve(__dirname, '.env.local');
      if (fs.existsSync(envLocalPath)) {
        const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
        env.API_KEY = envLocal.API_KEY || env.API_KEY;
        env.SF_KEY = envLocal.SF_KEY || env.SF_KEY;
        env.SILICON_FLOW_KEY = envLocal.SF_KEY || env.SILICON_FLOW_KEY;
        env.SILICONFLOW_API_KEY = envLocal.SF_KEY || env.SILICONFLOW_API_KEY;
      }
    } catch (e) {
      console.log('Failed to load .env.local:', e);
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        secure: false
      },
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        secure: false
      },
      '/api/zhipu': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zhipu/, ''),
        secure: false
      },
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
        secure: false
      },
      '/api/moonshot': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moonshot/, ''),
        secure: false
      },
      '/api/doubao': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, ''),
        secure: false
      },
      '/api/hunyuan': {
        target: 'https://api.hunyuan.cloud.tencent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hunyuan/, ''),
        secure: false
      },
      '/api/siliconflow': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/siliconflow/, ''),
        secure: false
      },
      // AI聊天和图片API现在由Edge函数处理，不再需要代理
      // '/api/ai/chat': {
      //   target: 'https://api.siliconflow.cn',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api\/ai\/chat/, '/v1/chat/completions'),
      //   secure: false,
      //   configure: (proxy, options) => {
      //     proxy.on('proxyReq', (proxyReq, req: any, res) => {
      //       // 将 X-SF-Key 头转换为 Authorization 头
      //       const xSfKey = req.headers['x-sf-key'];
      //       if (xSfKey) {
      //         proxyReq.setHeader('Authorization', `Bearer ${xSfKey}`);
      //         delete req.headers['x-sf-key'];
      //       }
      //     });
      //   },
      // },
      // '/api/ai/image': {
      //   target: 'https://api.siliconflow.cn',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api\/ai\/image/, '/v1/images/generations'),
      //   secure: false,
      //   configure: (proxy, options) => {
      //     proxy.on('proxyReq', (proxyReq, req: any, res) => {
      //       // 将 X-SF-Key 头转换为 Authorization 头
      //       const xSfKey = req.headers['x-sf-key'];
      //       if (xSfKey) {
      //         proxyReq.setHeader('Authorization', `Bearer ${xSfKey}`);
      //         delete req.headers['x-sf-key'];
      //       }
      //     });
      //   },
      // },
      // AI API 代理已移除，使用现有的硅基流动代理
    }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
