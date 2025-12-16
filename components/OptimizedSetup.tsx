import React, { useState, useEffect } from 'react';
import { ProjectConfig, STYLES, Language, AppSettings } from '../types';
import { recommendStyle, recommendFrameCount, generateRecommendationSummary, saveUserPreference } from '../services/smartRecommendation';
import ScriptDialog from './ScriptDialog';

interface OptimizedSetupProps {
  config: ProjectConfig;
  updateConfig: (updates: Partial<ProjectConfig>) => void;
  onNext: () => void;
  isLoading: boolean;
  lang: Language;
  appSettings: AppSettings;
}

const OptimizedSetup: React.FC<OptimizedSetupProps> = ({
  config,
  updateConfig,
  onNext,
  isLoading,
  lang,
  appSettings
}) => {
  const [recommendation, setRecommendation] = useState<ReturnType<typeof generateRecommendationSummary> | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputMode, setInputMode] = useState<'direct' | 'dialog'>('direct');

  // 当脚本内容变化时，自动生成推荐
  useEffect(() => {
    if (config.script && config.script.trim().length > 0) {
      const rec = generateRecommendationSummary(config.script);
      setRecommendation(rec);
      
      // 自动应用推荐（如果用户还没有手动修改）
      updateConfig({
        style: rec.style,
        frameCount: rec.frameCount
      });
    }
  }, [config.script]);

  const handleGenerate = () => {
    // 保存用户偏好
    saveUserPreference(config.style.name, config.frameCount);
    onNext();
  };

  const handleScriptConfirmed = (script: string) => {
    updateConfig({ script });
    // 自动生成推荐
    const rec = generateRecommendationSummary(script);
    setRecommendation(rec);
    updateConfig({
      style: rec.style,
      frameCount: rec.frameCount
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          ✨ 开始创作你的分镜脚本
        </h1>
        <p className="text-xl text-gray-600">
          {lang === 'zh' ? '输入故事内容，AI将自动为你生成专业的分镜脚本' : 'Input your story, AI will generate professional storyboard scripts for you'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
        {/* Input Mode Toggle */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setInputMode('direct')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              inputMode === 'direct'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✍️ {lang === 'zh' ? '直接输入' : 'Direct'}
          </button>
          <button
            onClick={() => setInputMode('dialog')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              inputMode === 'dialog'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💬 {lang === 'zh' ? '对话优化' : 'Dialog'}
          </button>
        </div>

        {/* Step 1: 输入脚本 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              📝 {lang === 'zh' ? '输入你的故事脚本' : 'Input Your Story Script'}
            </h2>
          </div>
          
          {inputMode === 'direct' ? (
            <div className="space-y-3">
              <textarea
                value={config.script}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig({ script: e.target.value })}
                placeholder={lang === 'zh' 
                  ? "在这里输入你的故事内容...\n\n例如：\n一个年轻的宇航员在太空站中醒来，发现自己是唯一的幸存者。他必须找到回家的方法，同时揭开这场灾难的真相..."
                  : "Input your story content here...\n\nExample:\nA young astronaut wakes up in a space station and discovers he is the only survivor. He must find a way home while uncovering the truth about the disaster..."}
                className="w-full h-48 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-all resize-none text-lg"
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {config.script.length} {lang === 'zh' ? '字' : 'chars'}
                </span>
                {config.script.length > 0 && (
                  <span className="text-purple-600 font-semibold">
                    ✨ {lang === 'zh' ? 'AI正在分析你的内容...' : 'AI is analyzing your content...'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <ScriptDialog
              onScriptConfirmed={handleScriptConfirmed}
              appSettings={appSettings}
              lang={lang}
            />
          )}
        </div>

        {/* Step 2: 智能推荐 */}
        {recommendation && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                🎨 AI智能推荐
              </h2>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 space-y-4">
              {/* 推荐风格 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  🎨
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">推荐风格</h3>
                    <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full font-semibold">
                      智能推荐
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-purple-600 mb-1">
                    {lang === 'zh' ? recommendation.style.nameZh : recommendation.style.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {recommendation.reasoning.style}
                  </p>
                </div>
              </div>

              {/* 推荐分镜数 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">推荐分镜数</h3>
                  <p className="text-lg font-semibold text-purple-600 mb-1">
                    {recommendation.frameCount} 个分镜
                  </p>
                  <p className="text-sm text-gray-600">
                    {recommendation.reasoning.frameCount}
                  </p>
                </div>
              </div>

              {/* 复杂度分析 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  📈
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">内容复杂度</h3>
                  <p className="text-lg font-semibold text-purple-600 mb-1">
                    {recommendation.complexity === 'simple' && '简单'}
                    {recommendation.complexity === 'medium' && '中等'}
                    {recommendation.complexity === 'complex' && '复杂'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {recommendation.reasoning.complexity}
                  </p>
                </div>
              </div>
            </div>

            {/* 高级选项 */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              {showAdvanced ? '▼' : '▶'} 高级选项（手动调整）
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-6 bg-white rounded-2xl border-2 border-gray-200">
                {/* 风格选择 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    视觉风格
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {STYLES.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => updateConfig({ style })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          config.style.name === style.name
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg mb-2" style={{ backgroundColor: style.color, opacity: 0.2 }}></div>
                        <div className="text-sm font-semibold text-gray-800">
                          {lang === 'zh' ? style.nameZh : style.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分镜数量 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    分镜数量: {config.frameCount} 个
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={config.frameCount}
                    onChange={(e) => updateConfig({ frameCount: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>12</span>
                  </div>
                </div>

                {/* 视频时长 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    视频时长: {config.duration} 秒
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={config.duration}
                    onChange={(e) => updateConfig({ duration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5秒</span>
                    <span>60秒</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !config.script.trim()}
            className="group relative px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
          >
            {/* 动画背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* 按钮内容 */}
            <span className="relative flex items-center gap-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI生成中...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  智能生成分镜
                </>
              )}
            </span>
          </button>
        </div>

        {/* 提示信息 */}
        {!config.script.trim() && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            💡 请先输入故事脚本内容
          </p>
        )}
      </div>

      {/* 快速示例 */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          💡 不知道写什么？试试这些示例：
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            '一个关于时间旅行的科幻故事',
            '古代侠客的江湖传奇',
            '温馨的家庭日常片段',
            '悬疑推理故事'
          ].map((example) => (
            <button
              key={example}
              onClick={() => updateConfig({ script: example })}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-700 hover:border-purple-500 hover:text-purple-600 transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OptimizedSetup;
