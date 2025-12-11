import React, { useRef } from 'react';
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
                 {/* Ref Image Button */}
                 <div className="relative">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded border transition-all ${config.referenceImage ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{config.referenceImage ? tr('refImageLabel') : tr('addRefImage')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    {config.referenceImage && (
                        <div className="absolute bottom-full right-0 mb-2 w-20 h-20 bg-white p-1 rounded shadow-lg border">
                             <img src={config.referenceImage} className="w-full h-full object-cover rounded-sm" />
                             <button onClick={(e) => { e.stopPropagation(); updateConfig({ referenceImage: undefined }); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">×</button>
                        </div>
                    )}
                 </div>

                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={config.useAIoptimization}
                        onChange={(e) => updateConfig({ useAIoptimization: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600 font-medium">{tr('aiOpt')}</span>
                 </label>
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
    </div>
  );
};

export default Setup;