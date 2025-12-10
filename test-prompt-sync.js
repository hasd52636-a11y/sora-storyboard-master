// 测试脚本：模拟四个提示词框的同步更新
const fs = require('fs');
const path = require('path');

// 读取相关文件内容
const editorPath = path.join(__dirname, 'components', 'Editor.tsx');
const geminiServicePath = path.join(__dirname, 'services', 'geminiService.ts');
const appPath = path.join(__dirname, 'App.tsx');

console.log('=== 测试四个提示词框同步更新 ===');

// 检查文件是否存在
console.log('Editor.tsx 存在:', fs.existsSync(editorPath));
console.log('geminiService.ts 存在:', fs.existsSync(geminiServicePath));
console.log('App.tsx 存在:', fs.existsSync(appPath));

// 读取部分内容进行检查
if (fs.existsSync(editorPath)) {
    const editorContent = fs.readFileSync(editorPath, 'utf8');
    console.log('\n=== Editor.tsx 关键函数检查 ===');
    console.log('handleSavePrompt 函数存在:', editorContent.includes('handleSavePrompt'));
    console.log('translateText 导入存在:', editorContent.includes('translateText'));
    console.log('updateFrames 调用存在:', editorContent.includes('updateFrames'));
}

if (fs.existsSync(geminiServicePath)) {
    const geminiContent = fs.readFileSync(geminiServicePath, 'utf8');
    console.log('\n=== geminiService.ts 关键函数检查 ===');
    console.log('translateText 函数存在:', geminiContent.includes('translateText'));
    console.log('getApiKey 函数存在:', geminiContent.includes('getApiKey'));
}

if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    console.log('\n=== App.tsx 关键函数检查 ===');
    console.log('setFrames 函数存在:', appContent.includes('setFrames'));
    console.log('appSettings 存在:', appContent.includes('appSettings'));
}

// 模拟测试数据
console.log('\n=== 模拟测试数据 ===');
const mockFrames = [
    {
        id: 'frame-1',
        number: 1,
        visualPrompt: 'A beautiful mountain landscape',
        visualPromptZh: '',
        description: 'The camera pans across the mountain range',
        descriptionZh: '',
        imageUrl: '',
        symbols: [],
        isGenerating: false
    }
];

const mockSettings = {
    llm: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: 'test-api-key',
        baseUrl: ''
    },
    language: 'en'
};

console.log('初始模拟帧数据:', mockFrames[0]);

// 模拟 handleSavePrompt 函数的核心逻辑
console.log('\n=== 模拟 handleSavePrompt 函数执行 ===');
function mockHandleSavePrompt(type, field, newVal, frames, index) {
    const newFrames = [...frames];
    const activeFrame = newFrames[index];
    let translatedText = '';

    console.log('输入:', { type, field, newVal });

    if (type === 'visual') {
        if (field === 'en') {
            activeFrame.visualPrompt = newVal;
            translatedText = `[模拟翻译] ${newVal} (到中文)`;
            activeFrame.visualPromptZh = translatedText;
        } else {
            activeFrame.visualPromptZh = newVal;
            translatedText = `[模拟翻译] ${newVal} (到英文)`;
            activeFrame.visualPrompt = translatedText;
        }
    } else {
        if (field === 'en') {
            activeFrame.description = newVal;
            translatedText = `[模拟翻译] ${newVal} (到中文)`;
            activeFrame.descriptionZh = translatedText;
        } else {
            activeFrame.descriptionZh = newVal;
            translatedText = `[模拟翻译] ${newVal} (到英文)`;
            activeFrame.description = translatedText;
        }
    }

    console.log('更新后的帧数据:', activeFrame);
    return newFrames;
}

// 测试各种情况
console.log('\n--- 测试 1: 修改 Visual Prompt (EN) ---');
mockHandleSavePrompt('visual', 'en', 'A beautiful lake at sunset', mockFrames, 0);

console.log('\n--- 测试 2: 修改 画面描述 (中文) ---');
mockHandleSavePrompt('visual', 'zh', '一个美丽的日落湖泊', mockFrames, 0);

console.log('\n--- 测试 3: 修改 Video Prompt (EN) ---');
mockHandleSavePrompt('video', 'en', 'Camera slowly zooms in on the lake', mockFrames, 0);

console.log('\n--- 测试 4: 修改 视频提示词 (中文) ---');
mockHandleSavePrompt('video', 'zh', '摄像机慢慢向湖泊推进', mockFrames, 0);

console.log('\n=== 测试完成 ===');
console.log('\n分析：');
console.log('1. 如果所有模拟测试都显示正确的翻译和更新，则说明 handleSavePrompt 函数的逻辑是正确的');
console.log('2. 如果实际使用中四个框未同步，可能是：');
console.log('   a. translateText 函数返回空值或原始文本');
console.log('   b. updateFrames 函数未正确更新父组件状态');
console.log('   c. PromptCard 组件的 value 属性未正确绑定到帧数据');
console.log('   d. 缺少 API 密钥导致翻译失败');
