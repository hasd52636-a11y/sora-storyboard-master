// 单元测试示例脚本
// 测试 geminiService 中的关键功能

import { quickDraft, generateFrameImage } from './api-dist/services/geminiService.js';

// 测试配置
const TEST_API_KEY = 'sk-ksdyamimdziobmnyxdpwmjnyelcmgzfbjzxicasvxuqkrazg'; // 例子: 将'sk-1234567890abcdef1234567890abcdef'替换为你的实际API密钥
const TEST_PROMPT = '一只猫在阳光下睡觉';

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// 测试函数
async function runTest(name, testFunction) {
  testResults.total++;
  console.log(`\n=== 测试: ${name} ===`);
  
  try {
    await testFunction();
    console.log('✅ 测试通过');
    testResults.passed++;
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
    testResults.failed++;
  }
}

// 测试 quickDraft 函数
async function testQuickDraft() {
  // 测试1: 无API密钥时应该抛出错误
  await runTest('quickDraft - 无API密钥', async () => {
    let errorThrown = false;
    try {
      await quickDraft(TEST_PROMPT, '');
    } catch (error) {
      errorThrown = true;
      if (!error.message.includes('API密钥不能为空')) {
        throw new Error('预期抛出API密钥不能为空的错误');
      }
    }
    if (!errorThrown) {
      throw new Error('预期抛出错误，但没有抛出');
    }
  });
  
  // 测试2: 有API密钥时应该成功调用
  if (TEST_API_KEY) {
    await runTest('quickDraft - 有API密钥', async () => {
      const result = await quickDraft(TEST_PROMPT, TEST_API_KEY);
      if (!result || !result.data) {
        throw new Error('预期返回包含data字段的结果');
      }
      if (!Array.isArray(result.data)) {
        throw new Error('预期data字段是数组');
      }
      if (result.data.length === 0) {
        throw new Error('预期data数组不为空');
      }
    });
  }
}

// 测试 generateFrameImage 函数
async function testGenerateFrameImage() {
  // 测试1: 无API密钥时应该抛出错误
  await runTest('generateFrameImage - 无API密钥', async () => {
    let errorThrown = false;
    try {
      await generateFrameImage(TEST_PROMPT, '');
    } catch (error) {
      errorThrown = true;
      if (!error.message.includes('API密钥不能为空')) {
        throw new Error('预期抛出API密钥不能为空的错误');
      }
    }
    if (!errorThrown) {
      throw new Error('预期抛出错误，但没有抛出');
    }
  });
  
  // 测试2: 有API密钥时应该成功调用
  if (TEST_API_KEY) {
    await runTest('generateFrameImage - 有API密钥', async () => {
      const result = await generateFrameImage(TEST_PROMPT, TEST_API_KEY);
      if (!result) {
        throw new Error('预期返回结果不为空');
      }
      // 检查返回的是图片URL还是base64数据
      if (typeof result === 'string') {
        if (!result.startsWith('data:image/') && !result.startsWith('http')) {
          throw new Error('预期返回图片URL或base64数据');
        }
      }
    });
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始运行单元测试...');
  
  await testQuickDraft();
  await testGenerateFrameImage();
  
  console.log(`\n=== 测试结果总结 ===`);
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});