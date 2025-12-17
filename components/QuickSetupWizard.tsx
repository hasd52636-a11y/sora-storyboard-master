import React, { useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { testApiConnection } from '../services/geminiService';

interface QuickSetupWizardProps {
  isOpen: boolean;
  onComplete: (settings: AppSettings) => void;
  onSkip: () => void;
}

const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ isOpen, onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) {
      setError('请输入API密钥');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // 使用智谱AI作为默认提供商
      const testConfig = {
        provider: 'zhipu' as const,
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4',
        apiKey: apiKey
      };

      const isValid = await testApiConnection(testConfig, 'llm');

      if (isValid) {
        // 配置成功，保存设置
        const newSettings: AppSettings = {
          ...DEFAULT_SETTINGS,
          llm: {
            provider: 'zhipu',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            model: 'glm-4',
            apiKey: apiKey
          },
          image: {
            provider: 'zhipu',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            model: 'cogview-3',
            apiKey: apiKey
          },
          language: 'zh'
        };
        onComplete(newSettings);
      } else {
        setError('API密钥验证失败，请检查密钥是否正确');
      }
    } catch (err) {
      setError('验证失败，请检查网络连接或API密钥');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">🎬 欢迎使用 Storyboard Master</h2>
          <p className="text-purple-100">让我们用30秒完成配置，开始创作你的分镜脚本</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">快速开始</h3>
                <p className="text-gray-600">
                  我们已为你预设了最适合中国用户的配置
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">智谱AI (GLM-4)</p>
                    <p className="text-sm text-gray-600">国内访问快速稳定</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">CogView-3 图像生成</p>
                    <p className="text-sm text-gray-600">高质量中文理解</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">智能默认参数</p>
                    <p className="text-sm text-gray-600">无需手动配置</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  配置API密钥 →
                </button>
                <button
                  onClick={onSkip}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  跳过，使用演示模式
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                💡 演示模式可以体验完整功能，但生成的内容为示例数据
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
                  <span className="text-4xl">🔑</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">配置API密钥</h3>
                <p className="text-gray-600">
                  输入你的智谱AI API密钥即可开始使用
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    智谱AI API密钥
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setError('');
                    }}
                    placeholder="请输入你的API密钥"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      {error}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>如何获取API密钥？</strong>
                  </p>
                  <ol className="mt-2 text-sm text-blue-700 space-y-1 ml-4 list-decimal">
                    <li>访问 <a href="https://open.bigmodel.cn" target="_blank" rel="noopener noreferrer" className="underline">open.bigmodel.cn</a></li>
                    <li>注册并登录账号</li>
                    <li>在控制台创建API密钥</li>
                    <li>复制密钥并粘贴到上方输入框</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  ← 返回
                </button>
                <button
                  onClick={handleValidateAndSave}
                  disabled={isValidating || !apiKey.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      验证中...
                    </span>
                  ) : (
                    '验证并保存 →'
                  )}
                </button>
              </div>

              <button
                onClick={onSkip}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                暂时跳过，稍后在设置中配置
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickSetupWizard;
