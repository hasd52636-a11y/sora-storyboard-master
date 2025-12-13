// 速创API测试脚本
const fetch = require('node-fetch');

// 测试配置
const apiConfig = {
  baseUrl: 'https://api.wuyinkeji.com/api/img',
  model: 'nanoBanana-pro',
  apiKey: '你的速创API密钥', // 替换为实际密钥
  presetName: '速创 NanoBanana-pro'
};

// 生成签名的函数
const generateSignature = (params, key) => {
  // 1. 对参数按照键名进行排序
  const sortedKeys = Object.keys(params).sort();
  // 2. 拼接成 key1=value1&key2=value2 的格式
  const signStr = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  // 3. 在末尾添加密钥
  const secretStr = signStr + key;
  // 4. 使用 MD5 算法生成签名
  const crypto = require('crypto');
  return crypto.createHash('md5').update(secretStr).digest('hex');
};

// 测试速创图像API
const testSucreativeImageAPI = async () => {
  console.log('=== 测试速创图像API ===');
  console.log('配置:', apiConfig);
  
  try {
    // 构建测试请求
    const params = {
      prompt: 'A simple test image',
      aspectRatio: '1:1',
      model: apiConfig.model
    };
    
    console.log('请求参数:', params);
    
    // 构建完整URL
    const fullUrl = apiConfig.baseUrl + '/nanoBanana';
    console.log('请求URL:', fullUrl);
    
    // 发送请求
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiConfig.apiKey
      },
      body: JSON.stringify(params)
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ 速创图像API测试成功！');
      return true;
    } else {
      console.log('❌ 速创图像API测试失败！');
      return false;
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
};

// 运行测试
testSucreativeImageAPI();