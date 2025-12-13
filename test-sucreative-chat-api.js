// 速创Chat API测试脚本 - 使用Gemini 3.0 Pro
import fetch from 'node-fetch';
import crypto from 'crypto';

// 配置参数
const config = {
  baseUrl: 'https://api.wuyinkeji.com/api/chat/index',
  model: 'gemini-3-pro',
  apiKey: '你的速创API密钥', // 请替换为实际密钥
  presetName: 'SuCreative Gemini'
};

// 生成签名的函数（与项目中的实现保持一致）
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

// 测试速创Chat API连接
const testSucreativeChatConnection = async () => {
  console.log('=== 测试速创Chat API连接 ===');
  console.log('配置:', {
    baseUrl: config.baseUrl,
    model: config.model,
    presetName: config.presetName
  });
  
  try {
    // 构建测试请求参数
    const params = {
      key: config.apiKey,
      content: 'Hello, how are you?',
      model: config.model
    };
    
    // 生成签名
    const signature = generateSignature(params, config.apiKey);
    
    console.log('测试请求参数:', params);
    console.log('生成的签名:', signature);
    
    // 构建请求体
    const requestBody = new URLSearchParams({
      ...params,
      sign: signature
    });
    
    // 发送测试请求
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody.toString()
    });
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    // 检查响应是否成功
    if (response.ok && responseData.code === 0) {
      console.log('✅ 速创Chat API连接测试成功！');
      console.log('✅ 响应内容:', responseData.data);
      return true;
    } else {
      console.log('❌ 速创Chat API连接测试失败！');
      console.log('❌ 错误信息:', responseData.msg || '未知错误');
      console.log('❌ 错误码:', responseData.code);
      return false;
    }
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error);
    return false;
  }
};

// 测试速创Chat API（带图片）
const testSucreativeChatWithImage = async () => {
  console.log('\n=== 测试速创Chat API（带图片）===');
  
  try {
    // 构建带图片的测试请求参数
    const params = {
      key: config.apiKey,
      content: '请描述这张图片的内容',
      image_url: 'https://r2.styleai.art/4bd93796-518a-48b3-aea7-f55cf4d4f0d5.jpeg',
      model: config.model
    };
    
    // 生成签名
    const signature = generateSignature(params, config.apiKey);
    
    // 构建请求体
    const requestBody = new URLSearchParams({
      ...params,
      sign: signature
    });
    
    // 发送测试请求
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody.toString()
    });
    
    const responseData = await response.json();
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    // 检查响应是否成功
    if (response.ok && responseData.code === 0) {
      console.log('✅ 速创Chat API（带图片）测试成功！');
      console.log('✅ 响应内容:', responseData.data);
      return true;
    } else {
      console.log('❌ 速创Chat API（带图片）测试失败！');
      console.log('❌ 错误信息:', responseData.msg || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error);
    return false;
  }
};

// 运行所有测试
const runAllTests = async () => {
  console.log('开始测试速创Chat API...');
  
  const chatTestResult = await testSucreativeChatConnection();
  const chatWithImageTestResult = await testSucreativeChatWithImage();
  
  console.log('\n=== 测试总结 ===');
  console.log('Chat API基础测试:', chatTestResult ? '✅ 成功' : '❌ 失败');
  console.log('Chat API带图片测试:', chatWithImageTestResult ? '✅ 成功' : '❌ 失败');
  
  process.exit(chatTestResult && chatWithImageTestResult ? 0 : 1);
};

// 执行测试
runAllTests();
