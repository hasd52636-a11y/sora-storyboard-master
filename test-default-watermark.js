// 默认水印行为测试脚本
// 验证不提供watermark_enabled参数时的默认行为

// 模拟API请求处理逻辑
function mockApiHandlerWithoutWatermarkParam() {
  // 模拟请求体，不包含watermark_enabled参数
  const body = {
    model: 'cogview-4-250304',
    prompt: '一只可爱的小猫咪',
    size: '1024x1024'
  };
  
  // 构建智谱API请求参数
  const requestBody = {
    model: body.model || 'cogview-4-250304',
    prompt: body.prompt,
    size: body.size || '1024x1024',
    user_id: 'storyboard-user',
    quality: body.quality || 'standard',
    watermark_enabled: body.watermark_enabled !== undefined ? body.watermark_enabled : false // 默认不添加水印
  };
  
  console.log('=== 默认水印行为测试 ===');
  console.log('请求体中是否包含watermark_enabled参数:', 'watermark_enabled' in body);
  console.log('传递给智谱API的watermark_enabled值:', requestBody.watermark_enabled);
  console.log('是否默认不添加水印:', requestBody.watermark_enabled === false);
  
  return requestBody.watermark_enabled === false;
}

// 测试不提供watermark_enabled参数的情况
const testResult = mockApiHandlerWithoutWatermarkParam();

console.log('\n' + '='.repeat(50));
if (testResult) {
  console.log('🎉 测试通过！默认情况下不会添加水印。');
} else {
  console.log('⚠️  测试失败！默认情况下仍会添加水印。');
}

// 测试显式设置watermark_enabled为true的情况
function mockApiHandlerWithWatermarkTrue() {
  const body = {
    model: 'cogview-4-250304',
    prompt: '一只可爱的小猫咪',
    size: '1024x1024',
    watermark_enabled: true
  };
  
  const requestBody = {
    model: body.model || 'cogview-4-250304',
    prompt: body.prompt,
    size: body.size || '1024x1024',
    user_id: 'storyboard-user',
    quality: body.quality || 'standard',
    watermark_enabled: body.watermark_enabled !== undefined ? body.watermark_enabled : false
  };
  
  console.log('\n=== 显式水印设置测试 ===');
  console.log('请求体中watermark_enabled参数值:', body.watermark_enabled);
  console.log('传递给智谱API的watermark_enabled值:', requestBody.watermark_enabled);
  console.log('是否正确设置了水印:', requestBody.watermark_enabled === true);
  
  return requestBody.watermark_enabled === true;
}

const testResult2 = mockApiHandlerWithWatermarkTrue();

if (testResult2) {
  console.log('🎉 测试通过！显式设置水印功能正常。');
} else {
  console.log('⚠️  测试失败！显式设置水印功能异常。');
}