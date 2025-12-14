import React, { useRef, useState, useEffect } from 'react';
import { ProjectConfig, STYLES, AspectRatio, Language, WorkflowStep } from '../types';
import { t } from '../locales';
import StepIndicator from './StepIndicator';

interface SetupProps {
  config: ProjectConfig;
  updateConfig: (updates: Partial<ProjectConfig>) => void;
  onNext: () => void;
  isLoading: boolean;
  lang: Language;
  setCurrentStep: (step: WorkflowStep) => void;
}

const Setup: React.FC<SetupProps> = ({ config, updateConfig, onNext, isLoading, lang, setCurrentStep }) => {
  const tr = (key: any) => t(lang, key);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 管理提示词模态框
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // 从localStorage加载自定义提示词
  useEffect(() => {
    const savedPrompt = localStorage.getItem('aiCreativePrompt');
    if (savedPrompt) {
      setCustomPrompt(savedPrompt);
    }
  }, []);
  
  // 保存自定义提示词到localStorage
  const saveCustomPrompt = () => {
    if (customPrompt.length <= 1000) {
      localStorage.setItem('aiCreativePrompt', customPrompt);
      setShowPromptModal(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
           updateConfig({ referenceImage: ev.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6 animate-fade-in-up">
      <StepIndicator currentStep={WorkflowStep.SETUP} lang={lang} onStepClick={setCurrentStep} />
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{tr('setupTitle')}</h2>
        <p className="text-gray-500">{tr('setupSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Script & basic settings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 shadow-lg relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('scriptLabel')}</label>
            <textarea
              className="w-full h-40 p-4 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-gray-700 placeholder-gray-400"
              placeholder={tr('scriptPlaceholder')}
              maxLength={2000}
              value={config.script}
              onChange={(e) => updateConfig({ script: e.target.value })}
            />
            
            {/* Action Bar inside Script box */}
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">{config.script.length}/2000</span>
              <div className="flex items-center gap-4">
                 {/* Ref Image Button - Redesigned */}
                 <div className="relative">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center space-x-2 px-3 h-8 rounded-lg text-xs font-medium transition-all shadow-sm border ${config.referenceImage ? 
                            'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 
                            'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{config.referenceImage ? tr('refImageLabel') : tr('addRefImage')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} aria-label={tr('addRefImage')} />
                    {config.referenceImage && (
                        <div className="absolute bottom-full right-0 mb-2 w-24 h-24 bg-white p-2 rounded-xl shadow-xl border border-gray-100">
                             <img src={config.referenceImage} className="w-full h-full object-cover rounded-lg" />
                             <button onClick={(e) => { e.stopPropagation(); updateConfig({ referenceImage: undefined }); }} 
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                                ×
                            </button>
                        </div>
                    )}
                 </div>

                 {/* AI Optimization Section - Redesigned */}
                 <div className="flex items-center space-x-2 px-3 h-8 rounded-lg text-xs font-medium transition-all shadow-sm border bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                    <label className="flex items-center space-x-2 cursor-pointer flex-shrink-0">
                        <input 
                            type="checkbox" 
                            checked={config.useAIoptimization}
                            onChange={(e) => updateConfig({ useAIoptimization: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 transition-all"
                        />
                        <span className="text-xs text-purple-700 font-medium">{tr('aiOpt')}</span>
                    </label>
                    <button 
                        onClick={() => setShowPromptModal(true)}
                        className="ml-auto text-purple-600 hover:text-purple-700 p-1.5 rounded-full hover:bg-purple-100 transition-colors flex items-center justify-center"
                        title="自定义AI创意优化提示词"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                 </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{tr('aspectRatio')}</label>
              <div className="flex flex-wrap gap-3">
                {Object.values(AspectRatio).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => updateConfig({ aspectRatio: ratio })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      config.aspectRatio === ratio
                        ? 'bg-purple-600 text-white shadow-purple-500/30 shadow-lg scale-105'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('duration')}: {config.duration}s</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={config.duration}
                  onChange={(e) => updateConfig({ duration: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  aria-label={tr('duration')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('frameCount')}: {config.frameCount}</label>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={config.frameCount}
                  onChange={(e) => updateConfig({ frameCount: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  aria-label={tr('frameCount')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Style Selection */}
        <div className="lg:col-span-5">
           <div className="glass-panel rounded-2xl p-6 shadow-lg h-full flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-4">{tr('styleLabel')}</label>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2" style={{maxHeight: '400px'}}>
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateConfig({ style })}
                  className={`relative p-4 rounded-xl border text-left transition-all group ${
                    config.style.id === style.id
                      ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-500'
                      : 'border-gray-100 bg-white hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <div 
                    className="absolute top-3 right-3 w-3 h-3 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  <div className="font-semibold text-gray-800 text-sm">
                    {lang === 'zh' && style.nameZh ? style.nameZh : style.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                    {lang === 'zh' && style.descriptionZh ? style.descriptionZh : style.description}
                  </div>
                </button>
              ))}
            </div>
           </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onNext}
          disabled={!config.script.trim() || isLoading}
          className={`
            px-12 py-4 rounded-full text-lg font-bold text-white shadow-2xl transition-all transform
            ${!config.script.trim() || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 hover:shadow-purple-500/40'}
          `}
        >
          {isLoading ? tr('generating') : tr('startBtn')}
        </button>
      </div>
      
      {/* 自定义提示词模态框 */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">自定义AI创意优化提示词</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  提示词（最多1000字）
                </label>
                <textarea
                  className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-gray-700 placeholder-gray-400"
                  placeholder="输入您的自定义提示词..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  maxLength={1000}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {customPrompt.length}/1000
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveCustomPrompt}
                disabled={customPrompt.length > 1000}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  customPrompt.length > 1000 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setup;