# 全面测试与极限测试指南

## 1. 测试概述

本指南提供了针对 sora-storyboard-master 项目的全面测试和极限测试策略。该项目是一个基于AI的故事板生成工具，主要功能包括故事板帧生成、图片生成和对象检测。

## 2. 测试策略

### 2.1 测试层次

| 测试层次 | 测试目标 | 工具建议 |
|---------|---------|---------|
| 单元测试 | 测试单个函数/组件的功能 | Jest, React Testing Library |
| 集成测试 | 测试模块间的交互 | Jest, Axios Mock |
| 功能测试 | 测试完整的用户功能流程 | Cypress, Playwright |
| 性能测试 | 测试系统响应时间和资源使用 | Lighthouse, Artillery |
| 安全测试 | 测试API密钥处理和数据安全 | OWASP ZAP |
| 极限测试 | 测试系统在极端条件下的表现 | 自定义脚本 |

### 2.2 测试覆盖范围

- **核心功能**：故事板生成、图片生成、对象检测
- **API接口**：所有对外API接口和内部服务调用
- **用户界面**：所有组件的渲染和交互
- **边界条件**：无效输入、空值、极端值
- **错误处理**：异常情况的处理和用户反馈

## 3. 全面测试方法

### 3.1 单元测试

#### 测试文件结构

```
tests/
├── services/
│   ├── geminiService.test.ts
│   ├── aiService.test.ts
│   └── requestQueue.test.ts
├── components/
│   ├── Setup.test.tsx
│   ├── Editor.test.tsx
│   ├── Export.test.tsx
│   └── SettingsModal.test.tsx
└── utils/
    └── fetchRetry.test.ts
```

#### 单元测试示例

```typescript
// tests/services/geminiService.test.ts
import { quickDraft, generateFrameImage } from '../../services/geminiService';

describe('geminiService', () => {
  describe('quickDraft', () => {
    it('应该在没有API密钥时抛出错误', async () => {
      await expect(quickDraft('test prompt', '')).rejects.toThrow('API密钥不能为空');
    });

    it('应该使用正确的参数调用API', async () => {
      // 模拟fetch请求
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          data: [{ url: 'test-url' }]
        })
      } as Response);

      const result = await quickDraft('test prompt', 'test-api-key');
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/image',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-SF-Key': 'test-api-key'
          }),
          body: expect.stringContaining('FLUX.1-schnell')
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        data: expect.any(Array)
      }));
    });
  });
});
```

### 3.2 集成测试

#### API集成测试

```typescript
// tests/integration/api.test.ts
import axios from 'axios';

describe('API Integration Tests', () => {
  it('应该正确处理图片生成请求', async () => {
    const response = await axios.post('http://localhost:3002/api/ai/image', {
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: 'test prompt',
      n: 1,
      size: '1024x1024',
      steps: 4
    }, {
      headers: {
        'X-SF-Key': process.env.SF_KEY
      }
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });
});
```

#### 组件集成测试

```typescript
// tests/integration/editor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Editor from '../../components/Editor';
import { generateFrameImage } from '../../services/geminiService';

// 模拟服务
jest.mock('../../services/geminiService', () => ({
  generateFrameImage: jest.fn().mockResolvedValue('test-image-data')
}));

describe('Editor Component Integration', () => {
  it('应该正确生成和显示故事板帧', async () => {
    const frames = [
      { id: '1', visualPrompt: 'test prompt 1' },
      { id: '2', visualPrompt: 'test prompt 2' }
    ];
    
    render(<Editor frames={frames} onUpdateFrames={() => {}} />);
    
    // 点击生成图片按钮
    const generateButtons = screen.getAllByText('生成图片');
    fireEvent.click(generateButtons[0]);
    
    // 验证服务调用
    expect(generateFrameImage).toHaveBeenCalledWith(
      frames[0].visualPrompt,
      expect.any(String),
      expect.any(Object)
    );
    
    // 验证图片显示
    const image = await screen.findByAltText('Storyboard Frame 1');
    expect(image).toBeInTheDocument();
  });
});
```

### 3.3 功能测试

使用Cypress进行端到端功能测试：

```javascript
// cypress/e2e/storyboard-flow.cy.js
describe('Storyboard Generation Flow', () => {
  it('应该完成完整的故事板生成流程', () => {
    // 访问应用
    cy.visit('http://localhost:3002');
    
    // 配置API密钥
    cy.get('button[aria-label="Settings"]').click();
    cy.get('#api-key-input').type(Cypress.env('SF_KEY'));
    cy.get('button[type="submit"]').click();
    
    // 输入故事描述
    cy.get('#story-description').type('A cat chasing a mouse');
    cy.get('button[type="submit"]').click();
    
    // 等待故事板生成
    cy.get('.storyboard-frame', { timeout: 30000 }).should('have.length.at.least', 3);
    
    // 生成图片
    cy.get('.generate-image-btn').first().click();
    cy.get('.storyboard-image', { timeout: 60000 }).should('be.visible');
    
    // 导出故事板
    cy.get('button[aria-label="Export"]').click();
    cy.get('button[type="download"]').click();
    
    // 验证下载
    cy.readFile('cypress/downloads/storyboard.pdf').should('exist');
  });
});
```

## 4. 极限测试策略

### 4.1 负载测试

```typescript
// tests/performance/load.test.ts
import http from 'http';

const API_KEY = process.env.SF_KEY;
const BASE_URL = 'http://localhost:3002';

// 并发请求数
const CONCURRENT_REQUESTS = 50;

// 测试函数
async function makeRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL.replace('http://', ''),
      path: '/api/ai/image',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SF-Key': API_KEY,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.write(JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: 'test prompt',
      n: 1,
      size: '1024x1024',
      steps: 4
    }));
    req.end();
  });
}

// 执行负载测试
async function runLoadTest() {
  console.log(`Starting load test with ${CONCURRENT_REQUESTS} concurrent requests...`);
  
  const startTime = Date.now();
  const requests = [];
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    requests.push(makeRequest());
  }
  
  try {
    const results = await Promise.all(requests);
    const endTime = Date.now();
    
    console.log(`Load test completed in ${endTime - startTime}ms`);
    
    // 分析结果
    const successCount = results.filter(r => r.status === 200).length;
    const failureCount = CONCURRENT_REQUESTS - successCount;
    
    console.log(`Success: ${successCount}/${CONCURRENT_REQUESTS}`);
    console.log(`Failure: ${failureCount}/${CONCURRENT_REQUESTS}`);
    
    return { successCount, failureCount, duration: endTime - startTime };
  } catch (error) {
    console.error('Load test failed:', error);
    throw error;
  }
}

runLoadTest().catch(console.error);
```

### 4.2 边界条件测试

```typescript
// tests/edge-cases/edge.test.ts
import { generateFrames, generateFrameImage } from '../services/geminiService';

describe('Edge Case Tests', () => {
  describe('generateFrames', () => {
    it('应该处理空故事描述', async () => {
      await expect(generateFrames('', '', {})).rejects.toThrow();
    });
    
    it('应该处理过长的故事描述', async () => {
      const longDescription = 'a'.repeat(10000);
      await expect(generateFrames(longDescription, '', {})).rejects.toThrow();
    });
    
    it('应该处理特殊字符', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      await expect(generateFrames(specialChars, '', {})).rejects.toThrow();
    });
  });
  
  describe('generateFrameImage', () => {
    it('应该处理极小的图片尺寸', async () => {
      await expect(generateFrameImage('test', '', { size: '1x1' })).rejects.toThrow();
    });
    
    it('应该处理极大的图片尺寸', async () => {
      await expect(generateFrameImage('test', '', { size: '10000x10000' })).rejects.toThrow();
    });
    
    it('应该处理过多的生成步骤', async () => {
      await expect(generateFrameImage('test', '', { steps: 100 })).rejects.toThrow();
    });
  });
});
```

### 4.3 异常恢复测试

```typescript
// tests/recovery/recovery.test.ts
import { generateFrameImage } from '../services/geminiService';
import { fetchRetry } from '../src/utils/fetchRetry';

// 模拟网络失败
jest.mock('../src/utils/fetchRetry', () => {
  let callCount = 0;
  return {
    fetchRetry: jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 3) {
        throw new Error('Network Error');
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ data: [{ url: 'test-url' }] })
        });
      }
    })
  };
});

describe('Exception Recovery Tests', () => {
  it('应该在网络错误后自动重试并成功', async () => {
    const result = await generateFrameImage('test prompt', 'test-key', {});
    
    // 验证重试逻辑
    expect(fetchRetry).toHaveBeenCalledTimes(4);
    expect(result).toEqual(expect.objectContaining({
      data: expect.any(Array)
    }));
  });
});
```

## 5. 测试工具配置

### 5.1 Jest配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\.(ts|tsx)$': 'ts-jest',
    '^.+\.(js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/build/**',
  ],
};
```

### 5.2 Cypress配置

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    setupNodeEvents(on, config) {
      // 加载环境变量
      config.env.SF_KEY = process.env.SF_KEY;
      return config;
    },
  },
  chromeWebSecurity: false,
  defaultCommandTimeout: 60000,
  requestTimeout: 120000,
});
```

## 6. 测试执行与报告

### 6.1 运行单元测试

```bash
# 安装依赖
npm install --save-dev jest ts-jest @types/jest @testing-library/react @testing-library/jest-dom

# 运行测试
npx jest

# 生成覆盖率报告
npx jest --coverage
```

### 6.2 运行集成测试

```bash
# 启动开发服务器
npm run dev

# 运行API集成测试
npx jest tests/integration/api.test.ts

# 运行组件集成测试
npx jest tests/integration/editor.test.tsx
```

### 6.3 运行功能测试

```bash
# 安装Cypress
npm install --save-dev cypress

# 打开Cypress
npx cypress open

# 运行所有测试
npx cypress run
```

### 6.4 运行性能测试

```bash
# 运行负载测试
node tests/performance/load.test.ts

# 运行Lighthouse测试
npx lighthouse http://localhost:3002 --output html --output-path ./lighthouse-report.html
```

## 7. 极限测试场景

| 测试场景 | 测试方法 | 预期结果 |
|---------|---------|---------|
| 并发请求 | 同时发送50+请求 | 系统应优雅处理，返回适当错误或队列请求 |
| 超大文件 | 尝试生成4K+分辨率图片 | 系统应返回错误或适当调整大小 |
| 长文本输入 | 输入10,000+字符的故事描述 | 系统应返回错误或截断文本 |
| 无效API密钥 | 使用错误/过期的API密钥 | 系统应返回清晰错误信息 |
| 网络波动 | 模拟网络延迟和中断 | 系统应实现重试机制并恢复 |
| 内存限制 | 在低内存环境下运行 | 系统应优化内存使用或返回错误 |
| 长时间运行 | 连续生成100+故事板 | 系统应保持稳定性能 |

## 8. 测试最佳实践

1. **测试驱动开发(TDD)**：先编写测试，再实现功能
2. **代码覆盖率**：争取达到80%+的代码覆盖率
3. **持续集成**：在CI/CD流程中自动运行测试
4. **测试隔离**：确保测试之间相互独立
5. **模拟依赖**：使用mock隔离外部依赖
6. **文档化测试**：清晰记录测试用例和预期结果
7. **定期更新测试**：随着代码变更更新测试用例

## 9. 工具推荐

### 9.1 测试框架
- **Jest**：JavaScript/TypeScript单元测试
- **Cypress**：端到端功能测试
- **Playwright**：跨浏览器测试
- **Artillery**：负载和性能测试

### 9.2 辅助工具
- **React Testing Library**：React组件测试
- **Axios Mock Adapter**：API模拟
- **Lighthouse**：性能和可访问性测试
- **OWASP ZAP**：安全测试

### 9.3 报告工具
- **Jest Coverage Reports**：代码覆盖率报告
- **Cypress Dashboard**：测试结果可视化
- **Allure Report**：详细的测试报告

## 10. 总结

全面测试和极限测试是确保软件质量和可靠性的关键步骤。本指南提供了一个结构化的测试框架，涵盖了从单元测试到极限测试的各个方面。通过实施这些测试策略，您可以：

1. 提高软件的可靠性和稳定性
2. 减少生产环境中的错误和故障
3. 优化性能和用户体验
4. 确保系统在极端条件下的可用性
5. 建立用户对软件的信任

建议将测试集成到您的开发流程中，采用持续测试的方法，确保每次代码变更都经过充分的测试验证。