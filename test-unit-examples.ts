// 测试 geminiService 中的关键功能

import { quickDraft, generateFrameImage } from './services/geminiService';

// 测试配置
const TEST_CONFIG = {
  apiKey: process.env.API_KEY || '', // 使用环境变量或默认空值
  provider: 'gemini' as const, // 指定为gemini提供商
  model: 'gemini-1.5-pro' as const,
  debug: true
};

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

// 测试执行函数
async function runTest(testName: string, testFn: () => Promise<boolean>) {
  testResults.total++;
  console.log(`\n=== 执行测试: ${testName} ===`);
  
  try {
    const result = await testFn();
    if (result) {
      console.log(`✅ 测试通过: ${testName}`);
      testResults.passed++;
    } else {
      console.log(`❌ 测试失败: ${testName}`);
      testResults.failed++;
    }
  } catch (error) {
    console.log(`❌ 测试出错: ${testName}`);
    console.error('错误详情:', error);
    testResults.failed++;
  }
}

// quickDraft函数测试
async function testQuickDraft() {
  console.log('测试quickDraft函数...');
  
  const prompt = "编写一个关于太空探险的故事，包含3个主要场景";
  const config = { ...TEST_CONFIG };
  
  try {
    const result = await quickDraft(prompt, config);
    
    console.log('测试结果:', result);
    
    // 验证结果
    if (result && Array.isArray(result) && result.length > 0) {
      console.log(`生成了 ${result.length} 个故事板框架`);
      return true;
    } else {
      console.log('结果格式不正确');
      return false;
    }
  } catch (error) {
    console.error('测试失败:', error);
    return false;
  }
}

// generateFrameImage函数测试
async function testGenerateFrameImage() {
  console.log('测试generateFrameImage函数...');
  
  const prompt = "太空站内部，宇航员正在修复设备，窗外是地球";
  const config = { ...TEST_CONFIG };
  
  try {
    const result = await generateFrameImage(prompt, config);
    
    console.log('测试结果:', result);
    
    // 验证结果
    if (result && typeof result === 'string' && result.startsWith('data:image/')) {
      console.log('生成了有效的图像数据');
      return true;
    } else {
      console.log('结果格式不正确');
      return false;
    }
  } catch (error) {
    console.error('测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始执行geminiService单元测试...');
  console.log('使用配置:', JSON.stringify(TEST_CONFIG, null, 2));
  
  // 运行测试
  await runTest('quickDraft', testQuickDraft);
  await runTest('generateFrameImage', testGenerateFrameImage);
  
  // 输出测试报告
  console.log(`\n=== 测试完成 ===`);
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`成功率: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败');
    process.exit(1);
  }
}

// 启动测试
runAllTests().catch(error => {
  console.error('测试运行出错:', error);
  process.exit(1);
});