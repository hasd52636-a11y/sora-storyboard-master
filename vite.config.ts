import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 加载所有可能的环境变量文件，包括.env.local
    const env = loadEnv(mode, '.', '');
    
    // 如果API_KEY不存在，尝试从.env.local文件读取
    if (!env.API_KEY) {
      try {
        const fs = require('fs');
        const dotenv = require('dotenv');
        const envLocalPath = path.resolve(__dirname, '.env.local');
        if (fs.existsSync(envLocalPath)) {
          const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
          env.API_KEY = envLocal.API_KEY || env.API_KEY;
        }
      } catch (e) {
        console.log('Failed to load .env.local:', e);
      }
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
            // 保留路径中的版本号
            rewrite: (path) => path.replace(/^\/api\/siliconflow/, ''),
            secure: false
          }
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
