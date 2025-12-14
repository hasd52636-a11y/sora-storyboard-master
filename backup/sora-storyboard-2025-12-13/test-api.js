const axios = require('axios');
const readline = require('readline');

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入API密钥
rl.question('请输入SiliconFlow API密钥: ', (apiKey) => {
  console.log('\n正在测试API...');
  
  // API基础URL
  const baseUrl = 'http://localhost:3002';
  
  // 测试Chat API
  async function testChatApi() {
    console.log('\n1. 测试Chat API...');
    try {
      const response = await axios.post(`${baseUrl}/api/ai/chat`, {
        messages: [
          {
            role: 'user',
            content: '[PROJECT SETTINGS]\n- Project Name: Test Project\n- Core Script: "A man walking in the park"\n- Total Frames: 2'
          }
        ],
        frameCount: 2
      }, {
        headers: {
          'x-sf-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✓ Chat API 调用成功');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('✗ Chat API 调用失败');
      console.error('错误信息:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }
  }
  
  // 测试Image API
  async function testImageApi() {
    console.log('\n2. 测试Image API...');
    try {
      const response = await axios.post(`${baseUrl}/api/ai/image`, {
        prompt: 'A man walking in the park, storyboard sketch',
        size: '512x512',
        n: 1
      }, {
        headers: {
          'x-sf-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✓ Image API 调用成功');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('✗ Image API 调用失败');
      console.error('错误信息:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }
  }
  
  // 测试Proxy Image API
  async function testProxyImageApi() {
    console.log('\n3. 测试Proxy Image API...');
    try {
      const response = await axios.post(`${baseUrl}/api/proxy-image`, {
        prompt: 'A man walking in the park, storyboard sketch'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✓ Proxy Image API 调用成功');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('✗ Proxy Image API 调用失败');
      console.error('错误信息:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }
  }
  
  // 运行所有测试
  async function runAllTests() {
    await testChatApi();
    await testImageApi();
    await testProxyImageApi();
    
    console.log('\n所有API测试完成！');
    rl.close();
  }
  
  runAllTests();
});