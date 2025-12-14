// 完整的速创API测试脚本
const fetch = require('node-fetch');
const crypto = require('crypto');

// 配置参数
const config = {
  baseUrl: 'https://api.wuyinkeji.com/api/img',
  model: 'nanoBanana-pro',
  apiKey: '你的速创API密钥', // 请替换为实际密钥
  presetName: '速创 NanoBanana-pro'
};

// 生成签名的函数（用于速创API的签名校验）
const generateSignature = (params, key) => {
  // 1. 对参数按照键名进行排序
  const sortedKeys = Object.keys(params).sort();
  // 2. 拼接成 key1=value1&key2=value2 的格式
  const signStr = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  // 3. 在末尾添加密钥
  const secretStr = signStr + key;
  // 4. 使用 MD5 算法生成签名
  return crypto.createHash('md5').update(secretStr).digest('hex');
};

// 测试速创图像API连接
const testSucreativeImageConnection = async () => {
  console.log('=== 测试速创图像API连接 ===');
  console.log('配置:', {
    baseUrl: config.baseUrl,
    model: config.model,
    presetName: config.presetName
  });
  
  try {
    // 构建测试请求
    const testBody = {
      prompt: 'A simple test image',
      aspectRatio: '1:1',
      model: config.model
    };
    
    console.log('测试请求体:', testBody);
    
    // 发送测试请求
    const response = await fetch(config.baseUrl + '/nanoBanana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.apiKey
      },
      body: JSON.stringify(testBody)
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    // 检查响应是否成功
    if (response.ok && responseData.code === 0) {
      console.log('✅ 速创图像API连接测试成功！');
      return true;
    } else {
      console.log('❌ 速创图像API连接测试失败！');
      console.log('错误信息:', responseData.msg || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error);
    return false;
  }
};

// 测试速创Chat API连接
const testSucreativeChatConnection = async () => {
  console.log('\n=== 测试速创Chat API连接 ===');
  console.log('配置:', {
    baseUrl: 'https://api.wuyinkeji.com/api/chat',
    model: 'gemini-3-pro',
    presetName: '速创 Gemini'
  });
  
  try {
    // 构建测试请求参数
    const params = {
      key: config.apiKey,
      content: 'Hi',
      model: 'gemini-3-pro'
    };
    
    // 生成签名
    const signature = generateSignature(params, config.apiKey);
    
    // 构建请求体
    const requestBody = new URLSearchParams({
      ...params,
      sign: signature
    });
    
    console.log('测试请求体:', requestBody.toString());
    
    // 发送测试请求
    const response = await fetch('https://api.wuyinkeji.com/api/chat/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody.toString()
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    // 检查响应是否成功
    if (response.ok && responseData.code === 0) {
      console.log('✅ 速创Chat API连接测试成功！');
      return true;
    } else {
      console.log('❌ 速创Chat API连接测试失败！');
      console.log('错误信息:', responseData.msg || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error);
    return false;
  }
};

// 运行所有测试
const runAllTests = async () => {
  console.log('开始测试速创API...');
  
  const imageTestResult = await testSucreativeImageConnection();
  // const chatTestResult = await testSucreativeChatConnection(); // 如果需要测试Chat API，可以取消注释
  
  console.log('\n=== 测试总结 ===');
  console.log('图像API测试:', imageTestResult ? '✅ 成功' : '❌ 失败');
  // console.log('Chat API测试:', chatTestResult ? '✅ 成功' : '❌ 失败');
  
  process.exit(imageTestResult ? 0 : 1);
};

// 执行测试
runAllTests();