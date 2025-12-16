// 速创图像API格式验证脚本
// 只验证请求参数格式，不实际发送请求
import fetch from 'node-fetch';

// 模拟API调用，验证参数格式
const testSucreativeFormat = () => {
  console.log('=== 速创图像API格式验证 ===');
  
  try {
    // 模拟从前端传递的参数
    const frontendParams = {
      prompt: '山水风景图，水墨画风格',
      aspectRatio: '1:1',
      imageSize: '1K',
      img_url: ['https://example.com/reference.jpg']
    };
    
    // 模拟API配置
    const apiConfig = {
      baseUrl: 'https://api.wuyinkeji.com/api/img',
      defaultModel: 'nano-banana'
    };
    
    console.log('前端传递的参数:', frontendParams);
    console.log('API配置:', apiConfig);
    
    // 模拟API代理的处理逻辑
    const isSucreativeApi = apiConfig.baseUrl.includes('wuyinkeji.com') || apiConfig.defaultModel.includes('nano-banana');
    
    let endpoint, requestBody;
    
    if (isSucreativeApi) {
      // 构建速创API请求参数
      if (apiConfig.baseUrl.includes('/api/img/nanoBanana')) {
        endpoint = apiConfig.baseUrl;
      } else if (apiConfig.baseUrl === 'https://api.wuyinkeji.com/api/img') {
        endpoint = `${apiConfig.baseUrl}/nanoBanana`;
      } else {
        endpoint = `${apiConfig.baseUrl}/api/img/nanoBanana`;
      }
      
      requestBody = {
        prompt: frontendParams.prompt,
        aspectRatio: frontendParams.aspectRatio || 'auto',
        imageSize: frontendParams.imageSize || '1K'
      };
      
      // 仅当提供了img_url参数时添加
      if (frontendParams.img_url) {
        requestBody.img_url = frontendParams.img_url;
      }
    } else {
      throw new Error('不是速创API');
    }
    
    console.log('\n处理后的请求:');
    console.log('端点:', endpoint);
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    console.log('请求头格式: { Authorization: "<api-key>", Content-Type: "application/json" }');
    
    // 验证请求体格式
    if (!requestBody.prompt) {
      throw new Error('缺少必填参数: prompt');
    }
    
    if (requestBody.aspectRatio && !['auto', '1:1', '16:9', '4:3', '9:16'].includes(requestBody.aspectRatio)) {
      throw new Error('无效的aspectRatio参数');
    }
    
    if (requestBody.imageSize && !['1K', '2K'].includes(requestBody.imageSize)) {
      throw new Error('无效的imageSize参数');
    }
    
    if (requestBody.img_url && !Array.isArray(requestBody.img_url)) {
      throw new Error('img_url必须是数组格式');
    }
    
    console.log('\n✅ 速创图像API请求格式验证成功！');
    console.log('\n验证通过的参数格式:');
    console.log('- 端点: https://api.wuyinkeji.com/api/img/nanoBanana');
    console.log('- 请求方法: POST');
    console.log('- 请求头: Content-Type: application/json');
    console.log('- 请求头: Authorization: <api-key>');
    console.log('- 请求体: JSON格式，包含prompt、aspectRatio、imageSize等参数');
    
    return true;
  } catch (error) {
    console.error('\n❌ 格式验证失败:', error.message);
    return false;
  }
};

// 运行测试
const success = testSucreativeFormat();
console.log('\n=== 验证完成 ===');
console.log('结果:', success ? '✅ 格式正确' : '❌ 格式错误');