import axios from 'axios';

// 从.env.local文件中读取API密钥
import fs from 'fs';
import path from 'path';

// 读取.env.local文件
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    }
});

const apiKey = envVars['SF_KEY'];
const baseUrl = 'http://localhost:3004';

console.log('=== API 可用性测试 ===');
console.log('使用API密钥:', apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : '未找到');
console.log('测试地址:', baseUrl);
console.log('========================');

// 测试Chat API
async function testChatApi() {
    console.log('\n1. 测试 Chat API...');
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
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('✗ Chat API 调用失败');
        console.error('错误信息:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        return false;
    }
}

// 测试Image API
async function testImageApi() {
    console.log('\n2. 测试 Image API...');
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
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('✗ Image API 调用失败');
        console.error('错误信息:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始API测试...');
    
    const chatResult = await testChatApi();
    const imageResult = await testImageApi();
    
    console.log('\n=== 测试结果总结 ===');
    console.log('Chat API:', chatResult ? '✓ 可用' : '✗ 不可用');
    console.log('Image API:', imageResult ? '✓ 可用' : '✗ 不可用');
    
    if (chatResult && imageResult) {
        console.log('\n✅ 所有API测试通过！');
        process.exit(0);
    } else {
        console.log('\n❌ 部分API测试失败！');
        process.exit(1);
    }
}

runAllTests();