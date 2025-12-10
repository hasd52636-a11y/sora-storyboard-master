import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
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
