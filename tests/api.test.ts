/**
 * API自动化测试套件
 * 测试所有API端点的连接性和功能
 */

import { testApiConnection } from '../services/geminiService';
import { ApiConfig } from '../types';

// 测试配置
const TEST_CONFIGS: Record<string, ApiConfig> = {
  zhipu: {
    provider: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    apiKey: process.env.ZHIPU_API_KEY || ''
  },
  siliconflow: {
    provider: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-R1',
    apiKey: process.env.SILICONFLOW_API_KEY || ''
  },
  qwen: {
    provider: 'qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    model: 'qwen-turbo',
    apiKey: process.env.QWEN_API_KEY || ''
  }
};

// 测试结果接口
interface TestResult {
  provider: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

/**
 * 测试单个API提供商
 */
async function testProvider(
  name: string,
  config: ApiConfig,
  type: 'llm' | 'image' = 'llm'
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    if (!config.apiKey) {
      return {
        provider: name,
        success: false,
        responseTime: 0,
        error: 'API密钥未配置'
      };
    }

    const success = await testApiConnection(config, type);
    const responseTime = Date.now() - startTime;

    return {
      provider: name,
      success,
      responseTime,
      error: success ? undefined : 'API连接失败'
    };
  } catch (error) {
    return {
      provider: name,
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 测试所有API提供商
 */
export async function testAllProviders(): Promise<TestResult[]> {
  console.log('🧪 开始测试所有API提供商...\n');
  
  const results: TestResult[] = [];
  
  for (const [name, config] of Object.entries(TEST_CONFIGS)) {
    console.log(`测试 ${name}...`);
    const result = await testProvider(name, config);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${name}: 成功 (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${name}: 失败 - ${result.error}`);
    }
  }
  
  return results;
}

/**
 * 生成测试报告
 */
export function generateTestReport(results: TestResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / Math.max(passed, 1);

  let report = '\n' + '='.repeat(50) + '\n';
  report += '📊 API测试报告\n';
  report += '='.repeat(50) + '\n\n';
  
  report += `总计: ${total} 个API\n`;
  report += `✅ 通过: ${passed} 个\n`;
  report += `❌ 失败: ${failed} 个\n`;
  report += `⚡ 平均响应时间: ${Math.round(avgResponseTime)}ms\n\n`;
  
  report += '详细结果:\n';
  report += '-'.repeat(50) + '\n';
  
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const time = result.success ? `${result.responseTime}ms` : 'N/A';
    const error = result.error ? ` (${result.error})` : '';
    report += `${status} ${result.provider.padEnd(15)} ${time.padEnd(10)} ${error}\n`;
  }
  
  report += '='.repeat(50) + '\n';
  
  return report;
}

/**
 * 健康检查 - 快速测试关键API
 */
export async function healthCheck(): Promise<boolean> {
  console.log('🏥 执行健康检查...');
  
  // 只测试智谱AI（主要提供商）
  const zhipuResult = await testProvider('zhipu', TEST_CONFIGS.zhipu);
  
  if (zhipuResult.success) {
    console.log('✅ 健康检查通过');
    return true;
  } else {
    console.log('❌ 健康检查失败');
    return false;
  }
}

/**
 * 运行完整测试套件
 */
export async function runFullTestSuite() {
  console.log('🚀 运行完整测试套件...\n');
  
  // 1. API连接测试
  const apiResults = await testAllProviders();
  const apiReport = generateTestReport(apiResults);
  console.log(apiReport);
  
  // 2. 健康检查
  await healthCheck();
  
  // 3. 生成总结
  const allPassed = apiResults.every(r => r.success);
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！系统运行正常。\n');
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置。\n');
    return false;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runFullTestSuite()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}
