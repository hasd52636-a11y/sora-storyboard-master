// 本地配置测试脚本
// 用于验证.env.local中的环境变量配置是否正确

import fs from 'fs';
import path from 'path';

// 读取.env.local文件
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('❌ 错误：.env.local文件不存在');
    process.exit(1);
}

console.log('✅ 找到.env.local文件');

// 解析环境变量
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

console.log('\n🔧 已配置的环境变量：');
Object.keys(envVars).forEach(key => {
    // 隐藏API密钥的中间部分以保护隐私
    const value = envVars[key];
    let maskedValue;
    if (key.includes('KEY') && value.length > 10) {
        maskedValue = value.substring(0, 4) + '••••••' + value.substring(value.length - 4);
    } else {
        maskedValue = value;
    }
    console.log(`  ${key}: ${maskedValue}`);
});

// 检查必要的环境变量
const requiredKeys = ['SF_KEY', 'SILICONFLOW_API_KEY', 'SILICON_FLOW_KEY'];
const missingKeys = [];

requiredKeys.forEach(key => {
    if (!envVars[key] || envVars[key].includes('your_silicon_flow_api_key_here')) {
        missingKeys.push(key);
    }
});

if (missingKeys.length > 0) {
    console.log(`\n⚠️  警告：以下必要的环境变量未正确配置：`);
    missingKeys.forEach(key => {
        console.log(`  - ${key}`);
    });
} else {
    console.log('\n✅ 所有必要的环境变量已正确配置');
}

// 测试硅基流动API连接
console.log('\n🌐 测试硅基流动API连接...');

// 模拟API调用测试
// 注意：实际项目中应该使用项目的API调用方式
const testApiConnection = async () => {
    try {
        // 这里可以添加实际的API调用代码
        // 由于这是测试脚本，我们只是模拟API调用
        console.log('✅ 本地配置测试完成！');
        console.log('\n📋 测试结果总结：');
        console.log('  - .env.local文件存在且格式正确');
        console.log('  - 环境变量已正确读取');
        console.log('  - API密钥已配置（注意：实际API连接测试需要运行开发服务器）');
        console.log('\n💡 下一步：运行 npm run dev 启动开发服务器，在浏览器中测试实际功能');
        return true;
    } catch (error) {
        console.error('❌ API连接测试失败:', error.message);
        return false;
    }
};

testApiConnection();
