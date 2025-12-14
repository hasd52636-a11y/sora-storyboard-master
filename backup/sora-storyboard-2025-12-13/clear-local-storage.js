// 清除localStorage中的保存设置，让应用使用新的默认设置
const fs = require('fs');
const path = require('path');

// 这个脚本用于模拟浏览器环境下清除localStorage
// 实际使用时，用户需要在浏览器控制台运行：localStorage.removeItem('appSettings');

console.log('=== 清除localStorage设置说明 ===');
console.log('由于应用会优先从localStorage加载之前保存的设置，');
console.log('要看到新的默认设置，请在浏览器控制台执行以下命令：');
console.log('');
console.log('localStorage.removeItem(\"appSettings\");');
console.log('');
console.log('执行后刷新页面，应用将使用新的默认设置（硅基流动作为默认图片API）。');
console.log('');
console.log('=== 其他已修复的问题 ===');
console.log('1. 修复了速创API的URL构建错误（重复路径问题）');
console.log('2. 优化了请求头设置，消除重复代码');
console.log('3. 完善了错误处理机制，提供更具体的错误信息');
console.log('4. 改进了开发环境和生产环境的URL处理逻辑');
