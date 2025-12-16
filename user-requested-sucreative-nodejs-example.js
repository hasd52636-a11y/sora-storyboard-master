// 用户提供的速创图像API官方示例代码 (Node.js版本)
// 基于官方文档和项目实际配置更新
import https from 'https';

// 配置参数
const config = {
  hostname: 'api.wuyinkeji.com',
  path: '/api/img/nanoBanana',
  apiKey: 'your-api-key', // 请替换为实际API密钥
  prompt: '山水风景图，水墨画风格',
  aspectRatio: '1:1',
  imageSize: '1K'
};

// === GET请求示例（仅供参考，速创图像API主要使用POST）===
const getOptions = {
  hostname: config.hostname,
  path: config.path,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${config.apiKey}`
  }
};

// 发送GET请求（速创图像API通常不使用GET，仅作参考）
const sendGetRequest = () => {
  console.log('=== 发送GET请求（仅供参考）===');
  
  const req = https.get(getOptions, res => {
    console.log(`状态码: ${res.statusCode}`);
    
    res.on('data', d => {
      process.stdout.write(d);
    });
  });
  
  req.on('error', error => {
    console.error('GET请求错误:', error);
  });
  
  req.end();
};

// === POST请求示例（速创图像API主要使用POST）===
const postOptions = {
  hostname: config.hostname,
  path: config.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  }
};

// 发送POST请求（速创图像API推荐方式）
const sendPostRequest = () => {
  console.log('\n=== 发送POST请求（推荐方式）===');
  
  // 构建请求体（使用JSON格式，与项目中保持一致）
  const postData = JSON.stringify({
    prompt: config.prompt,
    aspectRatio: config.aspectRatio,
    imageSize: config.imageSize
  });
  
  // 更新Content-Length头
  postOptions.headers['Content-Length'] = Buffer.byteLength(postData);
  
  const req = https.request(postOptions, res => {
    console.log(`状态码: ${res.statusCode}`);
    
    let responseData = '';
    
    res.on('data', d => {
      responseData += d;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('响应数据:', JSON.stringify(parsedData, null, 2));
        
        if (res.statusCode === 200) {
          console.log('✅ 速创图像API请求成功！');
        } else {
          console.log('❌ 速创图像API请求失败！');
        }
      } catch (e) {
        console.error('响应解析错误:', e);
        console.log('原始响应:', responseData);
      }
    });
  });
  
  req.on('error', error => {
    console.error('POST请求错误:', error);
  });
  
  // 写入请求体并结束请求
  req.write(postData);
  req.end();
};

// 执行示例请求
sendGetRequest(); // 仅供参考
sendPostRequest(); // 推荐使用