

import React, { useState, useEffect } from 'react';
import { WorkflowStep, ProjectConfig, StoryboardFrame, STYLES, AspectRatio, AppSettings, DEFAULT_SETTINGS, CONTACT_INFO, Language } from './types';
import OptimizedSetup from './components/OptimizedSetup';
import QuickSetupWizard from './components/QuickSetupWizard';
import Editor from './components/Editor';
import Export from './components/Export';
import SettingsModal from './components/SettingsModal';
import { generateFrames, generateFrameImage, quickDraft } from './services/geminiService';
import { saveUserPreference } from './services/smartRecommendation';
import { t } from './locales';
import CryptoJS from 'crypto-js';

const App: React.FC = () => {
  // 用于加密和解密API密钥的密钥（在实际应用中应该使用更安全的方式存储这个密钥）
  const encryptionKey = 'storyboard-master-secret-key';

  // 加密API密钥
  const encryptApiKey = (key: string): string => {
    if (!key) return '';
    return CryptoJS.AES.encrypt(key, encryptionKey).toString();
  };

  // 解密API密钥
  const decryptApiKey = (encryptedKey: string): string => {
    if (!encryptedKey) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
      // 确保bytes对象存在且有toString方法
      if (bytes && typeof bytes.toString === 'function') {
        return bytes.toString(CryptoJS.enc.Utf8);
      } else {
        console.error('Invalid decryption result:', bytes);
        return '';
      }
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return '';
    }
  };

  // 从localStorage加载设置，如果没有则使用默认设置
  const loadSettingsFromStorage = (): AppSettings => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // 解密API密钥
        return {
          ...parsedSettings,
          llm: {
            ...parsedSettings.llm,
            apiKey: decryptApiKey(parsedSettings.llm.apiKey)
          },
          image: {
            ...parsedSettings.image,
            apiKey: decryptApiKey(parsedSettings.image.apiKey)
          }
        };
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
    return DEFAULT_SETTINGS;
  };

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.SETUP);
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false); // 全局加载状态，用于控制动效
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettingsFromStorage());
  const [config, setConfig] = useState<ProjectConfig>({
    script: '',
    style: STYLES[0],
    aspectRatio: AspectRatio.RATIO_16_9,
    duration: 15,
    frameCount: 4,
    useAIoptimization: true,
  });

  // 检查是否需要显示配置向导
  useEffect(() => {
    const hasConfigured = localStorage.getItem('appSettings');
    if (!hasConfigured) {
      setShowWizard(true);
    }
  }, []);

  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const tr = (key: any) => t(appSettings.language, key);

  const toggleLanguage = () => {
    setAppSettings(prev => ({ ...prev, language: prev.language === 'en' ? 'zh' : 'en' }));
  };

  const handleConfigUpdate = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const startGeneration = async () => {
    // 保存用户偏好
    saveUserPreference(config.style.name, config.frameCount);
    
    setIsLoading(true);
    setIsGlobalLoading(true); // 开始生成时显示全局动效
    try {
      const plan = await generateFrames(config, appSettings);
      
      // Ensure all frames have proper Chinese translations
      const framesWithTranslations = plan.map(p => ({
        ...p,
        descriptionZh: p.descriptionZh || p.description!,
        visualPromptZh: p.visualPromptZh || p.visualPrompt!
      }));
      let initialFrames: StoryboardFrame[] = plan.map(p => ({
        id: p.id!,
        number: p.number!,
        description: p.description!,
        descriptionZh: p.descriptionZh || p.description!,
        visualPrompt: p.visualPrompt!,
        visualPromptZh: p.visualPromptZh || p.visualPrompt!,
        symbols: [],
        isGenerating: false,
        imageUrl: undefined
      }));
      setFrames(initialFrames);
      // 更新配置中的分镜数量为实际生成的数量
      setConfig(prev => ({ ...prev, frameCount: initialFrames.length }));
      setCurrentStep(WorkflowStep.EDITOR);
      setIsLoading(false);
      
      // 生成所有分镜的图片，一张生成完成后自动生成下一张
      if (initialFrames.length > 0) {
        const framesWithImages = [...initialFrames];
        
        // 定义递归生成函数
        const generateNextDraftFrame = async (index: number) => {
          if (index >= framesWithImages.length) return;
          
          const currentFrame = framesWithImages[index];
          framesWithImages[index] = {
            ...currentFrame,
            isGenerating: true
          };
          setFrames([...framesWithImages]);
          
          try {
            // 调用 quickDraft 生成当前分镜的草图，使用完整的settings以获取正确的图片API配置
            const draftResult = await quickDraft(currentFrame.visualPrompt, appSettings);
            
            framesWithImages[index] = {
              ...framesWithImages[index],
              imageUrl: draftResult.data?.[0]?.url,
              isGenerating: false,
              generationError: !draftResult.data?.[0]?.url,
              isDraft: true // 标记为草稿图
            };
          } catch (e) {
            console.error(`生成第${index + 1}张分镜草图失败:`, e);
            framesWithImages[index] = {
              ...framesWithImages[index],
              isGenerating: false,
              generationError: true
            };
          }
          
          setFrames([...framesWithImages]);
          
          // 等待1秒后生成下一张分镜
          setTimeout(() => {
            generateNextDraftFrame(index + 1);
          }, 1000);
        };
        
        // 开始生成第一张分镜
        generateNextDraftFrame(0);
      }
      
      // 生成完成后隐藏全局动效
      setIsGlobalLoading(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate storyboard. Check API Settings.");
      setIsLoading(false);
      setIsGlobalLoading(false); // 生成失败时也要隐藏动效
    }
  };

  const handleRegenerateFrame = async (frameId: string) => {
    const frameIndex = frames.findIndex(f => f.id === frameId);
    if (frameIndex === -1) return;
    const updatedFrames = [...frames];
    updatedFrames[frameIndex].isGenerating = true;
    setFrames(updatedFrames);
    try {
      // 精修时调用 generateFrameImage 生成高分辨率图片，传递config参数以支持参考主体
      const url = await generateFrameImage(updatedFrames[frameIndex], config.style.name, appSettings, config);
      const finalFrames = [...frames];
      // 重新生成图片时清除用户添加的符号
      finalFrames[frameIndex] = { 
        ...finalFrames[frameIndex], 
        imageUrl: url, 
        isGenerating: false,
        symbols: [], // 清空符号数组
        isDraft: false // 标记为精修图
      };
      setFrames(finalFrames);
      
      // 自动生成下一个分镜
      const nextFrameIndex = finalFrames.findIndex((f, i) => i > frameIndex && !f.imageUrl && !f.isGenerating);
      if (nextFrameIndex !== -1) {
        // 等待1秒后自动生成下一个分镜，给用户视觉反馈时间
        setTimeout(() => {
          handleRegenerateFrame(finalFrames[nextFrameIndex].id);
        }, 1000);
      }
    } catch(e) {
      console.error('Regenerate frame error:', e);
      const finalFrames = [...frames];
      finalFrames[frameIndex].isGenerating = false;
      setFrames(finalFrames);
      alert("Redraw failed. Please check the console for more details.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800 overflow-x-hidden font-sans">
      {/* 智能配置向导 */}
      <QuickSetupWizard
        isOpen={showWizard}
        onComplete={(newSettings) => {
          setAppSettings(newSettings);
          const settingsToSave = {
            ...newSettings,
            llm: {
              ...newSettings.llm,
              apiKey: encryptApiKey(newSettings.llm.apiKey)
            },
            image: {
              ...newSettings.image,
              apiKey: encryptApiKey(newSettings.image.apiKey)
            }
          };
          localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
          setShowWizard(false);
        }}
        onSkip={() => setShowWizard(false)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSave={(newSettings) => {
          setAppSettings(newSettings);
          // 加密API密钥后保存到localStorage
          const settingsToSave = {
            ...newSettings,
            llm: {
              ...newSettings.llm,
              apiKey: encryptApiKey(newSettings.llm.apiKey)
            },
            image: {
              ...newSettings.image,
              apiKey: encryptApiKey(newSettings.image.apiKey)
            }
          };
          localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
        }}
      />

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-white/50 sticky top-0 z-50 shadow-sm">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-lg shadow-lg flex items-center justify-center text-white font-black text-sm tracking-tight transform hover:scale-105 transition-transform">
                SM
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-800 leading-none">
                  {tr('appName')}
              </h1>
              <span className="text-[10px] text-purple-600 font-semibold tracking-wider">STORYBOARD MASTER</span>
            </div>
        </div>

        {/* Contact Info - 居中显示 */}
        <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="bg-purple-50 px-8 py-3 rounded-full border border-purple-200 flex items-center justify-center gap-6 text-base font-bold text-purple-900 opacity-100 shadow-md">
                <span className="pointer-events-auto cursor-text">{CONTACT_INFO.email}</span>
                <span className="w-1 h-4 bg-purple-400"></span>
                <span className="pointer-events-auto cursor-text">{CONTACT_INFO.web}</span>
            </div>
        </div>
        
        {/* Right Section: Buttons */}
        <div className="flex items-center gap-3">
             {/* Language Switch */}
             <button 
                onClick={toggleLanguage}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-purple-600 transition-colors uppercase"
             >
                {appSettings.language === 'en' ? 'EN' : '中文'}
             </button>

             {/* Settings Button */}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-all"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {tr('settings')}
             </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-6 pb-12 overflow-y-auto">
        {/* Global Loading Animation */}
        {isGlobalLoading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center justify-center">
              {/* Outer rotating circle */}
              <div className="w-48 h-48 border-4 border-t-transparent border-r-purple-400 border-b-purple-500 border-l-transparent rounded-full animate-spin-slow"></div>
              
              {/* Middle rotating circle */}
              <div className="absolute w-36 h-36 border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-blue-500 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
              
              {/* Inner circle with text */}
              <div className="absolute w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                <span className="text-white font-bold text-base tracking-wide text-center">AI生成中...</span>
              </div>
            </div>
          </div>
        )}
        {currentStep === WorkflowStep.SETUP && (
          <OptimizedSetup 
            config={config} 
            updateConfig={handleConfigUpdate} 
            onNext={startGeneration} 
            isLoading={isLoading}
            lang={appSettings.language}
          />
        )}
        {currentStep === WorkflowStep.EDITOR && (
          <Editor 
            frames={frames}
            updateFrames={setFrames}
            config={config}
            onNext={() => setCurrentStep(WorkflowStep.EXPORT)}
            onBack={() => setCurrentStep(WorkflowStep.SETUP)}
            regenerateImage={handleRegenerateFrame}
            lang={appSettings.language}
            settings={appSettings}
            isGlobalLoading={isGlobalLoading}
            updateConfig={handleConfigUpdate}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === WorkflowStep.EXPORT && (
          <Export 
            config={config}
            frames={frames}
            onBack={() => setCurrentStep(WorkflowStep.EDITOR)}
            lang={appSettings.language}
            setCurrentStep={setCurrentStep}
          />
        )}
      </main>
      
      {/* Mobile Footer Contact for small screens */}
      <div className="lg:hidden text-center p-4 text-[10px] text-gray-400">
         {CONTACT_INFO.email} | {CONTACT_INFO.web}
      </div>
    </div>
  );
};

export default App;