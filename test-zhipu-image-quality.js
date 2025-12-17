// 智谱AI图像生成API测试脚本 - 验证quality和watermark_enabled参数
// 配置参数
const ZHIPU_API_KEY = 'YOUR_API_KEY_HERE'; // 替换为您的智谱API密钥
const TEST_PROMPT = '一只可爱的小猫咪';
const TEST_SIZE = '1024x1024';

// 测试用例
const testCases = [
  { 
    name: '默认参数 (standard quality, watermark enabled)',
    quality: 'standard',
    watermark_enabled: true
  },
  { 
    name: '高清质量 (HD), watermark enabled',
    quality: 'hd',
    watermark_enabled: true
  },
  { 
    name: '标准质量, 无水印',
    quality: 'standard',
    watermark_enabled: false
  }
];

// 测试函数
async function testZhipuImageAPI(testCase) {
  console.log(`\n=== 测试: ${testCase.name} ===`);
  console.log(`参数: quality=${testCase.quality}, watermark_enabled=${testCase.watermark_enabled}`);
  
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'cogview-4-250304',
        prompt: TEST_PROMPT,
        size: TEST_SIZE,
        user_id: 'test-user',
        quality: testCase.quality,
        watermark_enabled: testCase.watermark_enabled
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (data.data && data.data[0]) {
        console.log('✓ 测试成功！');
        console.log('图像URL:', data.data[0].url);
        return true;
      } else {
        console.log('✗ 测试失败: 响应中没有图像数据');
        console.log('完整响应:', JSON.stringify(data, null, 2));
        return false;
      }
    } else {
      console.log(`✗ 测试失败: ${response.status}`);
      console.log('错误信息:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('✗ 测试失败: 网络错误');
    console.log('错误详情:', error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试智谱AI图像生成API参数支持...');
  console.log('测试提示词:', TEST_PROMPT);
  console.log('测试尺寸:', TEST_SIZE);
  console.log('='.repeat(50));
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    const result = await testZhipuImageAPI(testCase);
    if (result) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    // 等待一下，避免触发API速率限制
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总:');
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${failedCount}`);
  console.log(`总测试数: ${testCases.length}`);
  
  if (failedCount === 0) {
    console.log('\n🎉 所有测试都通过了！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置和API密钥。');
  }
}

// 检查API密钥是否配置
if (ZHIPU_API_KEY === 'YOUR_API_KEY_HERE') {
  console.log('错误: 请在脚本中配置您的智谱API密钥！');
  console.log('请将 ZHIPU_API_KEY 变量替换为您的实际API密钥。');
} else {
  runAllTests();
}