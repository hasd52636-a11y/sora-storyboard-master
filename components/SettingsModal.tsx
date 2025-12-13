
import React, { useState, useEffect } from 'react';
import { AppSettings, ApiConfig, ApiPreset } from '../types';
import { translations, t } from '../locales';
import { testApiConnection } from '../services/geminiService';
import CryptoJS from 'crypto-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

interface ExtendedPreset extends ApiPreset {
    nameZh?: string;
}

const LLM_PRESETS: ExtendedPreset[] = [
  { id: 'gemini', name: 'Google Gemini (Official)', nameZh: '谷歌 Gemini (官方)', provider: 'gemini', baseUrl: '', defaultModel: 'gemini-2.5-flash' },
  { id: 'deepseek', name: 'DeepSeek (Official)', nameZh: 'DeepSeek (官方)', provider: 'openai', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { id: 'zhipu', name: 'Zhipu AI (ChatGLM)', nameZh: '智谱清言 (ChatGLM)', provider: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4' },
  { id: 'qwen', name: 'Qwen / Tongyi (Aliyun)', nameZh: '通义千问 (阿里云)', provider: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', nameZh: '月之暗面 (Kimi)', provider: 'openai', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  { id: 'doubao', name: 'Doubao (Volcengine)', nameZh: '豆包 (火山引擎)', provider: 'openai', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-pro-32k' },
  { id: 'hunyuan', name: 'Hunyuan (Tencent)', nameZh: '腾讯混元', provider: 'openai', baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', defaultModel: 'hunyuan-standard' },
  { id: 'siliconflow', name: 'SiliconFlow', nameZh: '硅基流动', provider: 'openai', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'THUDM/GLM-Z1-9B-0414' },
  { id: 'custom', name: 'Custom / Other', nameZh: '自定义 / 其他', provider: 'openai', baseUrl: '', defaultModel: '' },
];

const IMG_PRESETS: ExtendedPreset[] = [
  { id: 'gemini-img', name: 'Google Gemini Image', nameZh: '谷歌 Gemini 绘图', provider: 'gemini', baseUrl: '', defaultModel: 'gemini-2.5-flash-image' },
  { id: 'dalle', name: 'OpenAI DALL-E 3', nameZh: 'OpenAI DALL-E 3', provider: 'openai', baseUrl: 'https://api.openai.com/v1', defaultModel: 'dall-e-3' },
  { id: 'silicon-flux', name: 'SiliconFlow (Flux)', nameZh: '硅基流动 (Flux绘图)', provider: 'openai', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'black-forest-labs/FLUX.1-schnell' },
  { id: 'silicon-sd', name: 'SiliconFlow (Stable Diffusion)', nameZh: '硅基流动 (SD绘图)', provider: 'openai', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'stabilityai/stable-diffusion-3-5-large' },
  { id: 'zhipu-img', name: 'Zhipu CogView', nameZh: '智谱 CogView', provider: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'cogview-3' },
  { id: 'jimeng', name: 'Jimeng (ByteDance)', nameZh: '即梦 (字节跳动)', provider: 'openai', baseUrl: 'https://api.jimeng.com/v1', defaultModel: 'jimeng-2.0' },
  { id: 'custom-img', name: 'Custom / Other', nameZh: '自定义 / 其他', provider: 'openai', baseUrl: '', defaultModel: '' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [activeTab, setActiveTab] = useState<'general' | 'api'>('api');
  const [testStatus, setTestStatus] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'failed'}>({});
  
  // 用于加密和解密API密钥的密钥（与App.tsx中保持一致）
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

  // 从localStorage加载已验证的配置，并解密API密钥
  const loadVerifiedList = (): {llm: ApiConfig[], image: ApiConfig[]} => {
    const saved = localStorage.getItem('verifiedList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 解密API密钥
        return {
          llm: parsed.llm.map((config: ApiConfig) => ({
            ...config,
            apiKey: decryptApiKey(config.apiKey)
          })),
          image: parsed.image.map((config: ApiConfig) => ({
            ...config,
            apiKey: decryptApiKey(config.apiKey)
          }))
        };
      } catch (error) {
        console.error('Failed to parse verifiedList:', error);
      }
    }
    return { llm: [], image: [] };
  };
  
  // Store verified configurations [key]: { config }
  const [verifiedList, setVerifiedList] = useState<{llm: ApiConfig[], image: ApiConfig[]}>(loadVerifiedList);
  
  // Track visibility of API keys
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({
    llm: false,
    image: false
  });
  
  // Toggle visibility for specific API key
  const toggleKeyVisibility = (type: 'llm' | 'image') => {
    setShowKeys(prev => ({...prev, [type]: !prev[type]}));
  };

  useEffect(() => {
    if (isOpen) {
       setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentLang = localSettings.language;
  const isZh = currentLang === 'zh';
  const tr = (key: keyof typeof translations['en']) => t(currentLang, key);

  const handleConfigChange = (type: 'llm' | 'image', field: keyof ApiConfig, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handlePresetSelect = (type: 'llm' | 'image', presetId: string) => {
    const list = type === 'llm' ? LLM_PRESETS : IMG_PRESETS;
    const preset = list.find(p => p.id === presetId);
    if (!preset) return;

    // 检查已验证列表中是否有该预设的配置
    const verifiedConfig = verifiedList[type].find(v => 
      v.presetName === (isZh && preset.nameZh ? preset.nameZh : preset.name)
    );

    setLocalSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        provider: preset.provider,
        baseUrl: preset.baseUrl,
        model: preset.defaultModel,
        presetName: isZh && preset.nameZh ? preset.nameZh : preset.name,
        // 如果有已验证的配置，使用其API密钥，否则重置为空
        apiKey: verifiedConfig?.apiKey || ''
      }
    }));
  };

  // 保存已验证的配置到localStorage，并加密API密钥
  const saveVerifiedList = (list: {llm: ApiConfig[], image: ApiConfig[]}) => {
    // 加密API密钥
    const encryptedList = {
      llm: list.llm.map(config => ({
        ...config,
        apiKey: encryptApiKey(config.apiKey)
      })),
      image: list.image.map(config => ({
        ...config,
        apiKey: encryptApiKey(config.apiKey)
      }))
    };
    localStorage.setItem('verifiedList', JSON.stringify(encryptedList));
  };
  
  const runApiTest = async (type: 'llm' | 'image') => {
    setTestStatus(prev => ({...prev, [type]: 'loading'}));
    const config = type === 'llm' ? localSettings.llm : localSettings.image;
    
    const success = await testApiConnection(config, type);
    
    setTestStatus(prev => ({...prev, [type]: success ? 'success' : 'failed'}));
    
    if (success) {
       // Add to verified list if not exists
       setVerifiedList(prev => {
           const list = prev[type];
           // Simple duplicate check
           if (!list.some(item => item.baseUrl === config.baseUrl && item.model === config.model && item.apiKey === config.apiKey)) {
              const newList = { ...prev, [type]: [...list, { ...config }] };
              saveVerifiedList(newList);
              return newList;
           }
           return prev;
       });
    }

    // 测试成功后按钮保持绿色，不自动重置状态
    if (!success) {
      setTimeout(() => setTestStatus(prev => ({...prev, [type]: 'idle'})), 3000);
    }
  };

  const applyVerifiedConfig = (type: 'llm' | 'image', config: ApiConfig) => {
      setLocalSettings(prev => ({ ...prev, [type]: config }));
  };

  const removeVerifiedConfig = (type: 'llm' | 'image', index: number) => {
      setVerifiedList(prev => {
          const newList = {
              ...prev,
              [type]: prev[type].filter((_, i) => i !== index)
          };
          saveVerifiedList(newList);
          return newList;
      });
  };

  const renderApiSection = (type: 'llm' | 'image') => {
      const config = type === 'llm' ? localSettings.llm : localSettings.image;
      const presets = type === 'llm' ? LLM_PRESETS : IMG_PRESETS;
      const title = type === 'llm' ? tr('apiLlmTitle') : tr('apiImgTitle');
      const verified = type === 'llm' ? verifiedList.llm : verifiedList.image;

      return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-black uppercase text-purple-600 tracking-wide">{title}</h3>
                </div>

            {/* Presets Dropdown */}
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{tr('selectPreset')}</label>
                <select 
                    className="w-full p-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
                    onChange={(e) => handlePresetSelect(type, e.target.value)}
                    value={presets.find(p => 
                        // 优先通过presetName匹配，更准确
                        (config.presetName && (isZh && p.nameZh === config.presetName || p.name === config.presetName)) ||
                        // 如果没有presetName或匹配失败，回退到通过baseUrl和model匹配
                        (p.baseUrl === config.baseUrl && p.model === config.model) ||
                        // 最后检查是否为自定义类型
                        (config.presetName?.includes('custom') && p.id === 'custom')
                    )?.id || 'custom'}
                >
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>
                            {isZh && p.nameZh ? p.nameZh : p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{tr('modelName')}</label>
                    <input 
                        type="text" 
                        value={config.model} 
                        onChange={(e) => handleConfigChange(type, 'model', e.target.value)} 
                        className="w-full p-2 text-sm rounded border border-gray-300 focus:border-purple-500 outline-none"
                    />
                </div>
                
                {config.provider === 'openai' && (
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">{tr('baseUrl')}</label>
                        <input 
                            type="text" 
                            value={config.baseUrl} 
                            onChange={(e) => handleConfigChange(type, 'baseUrl', e.target.value)} 
                            placeholder="https://api.example.com/v1" 
                            className="w-full p-2 text-sm rounded border border-gray-300 font-mono text-xs focus:border-purple-500 outline-none"
                        />
                    </div>
                )}
                
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{tr('apiKey')}</label>
                    <div className="flex gap-2">
                        <input 
                            type={showKeys[type] ? "text" : "password"} 
                            value={config.apiKey} 
                            onChange={(e) => handleConfigChange(type, 'apiKey', e.target.value)} 
                            placeholder={tr('placeholderKey')} 
                            className="flex-1 p-2 text-sm rounded border border-gray-300 font-mono focus:border-purple-500 outline-none"
                        />
                        <button 
                            onClick={() => toggleKeyVisibility(type)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors min-w-[80px] flex items-center justify-center"
                            title={showKeys[type] ? tr('hideKey') : tr('showKey')}
                        >
                            {showKeys[type] ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button 
                            onClick={() => runApiTest(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold min-w-[80px] transition-colors ${testStatus[type] === 'loading' ? 'bg-yellow-600 text-white' : testStatus[type] === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-900 text-white hover:bg-black'}`}
                        >
                            {testStatus[type] === 'loading' ? '...' : tr('testApi')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Verified List */}
            {verified.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-bold text-green-600 mb-2">{tr('verifiedModels')}</label>
                    <div className="flex flex-wrap gap-2">
                        {verified.map((v, idx) => (
                            <div key={idx} className="flex items-center bg-green-50 border border-green-200 rounded-lg px-2 py-1 gap-2">
                                <button 
                                    onClick={() => applyVerifiedConfig(type, v)}
                                    className="text-xs font-bold text-green-800 hover:underline"
                                    title={tr('clickToApply')}
                                >
                                    {v.presetName || v.model}
                                </button>
                                <button 
                                    onClick={() => removeVerifiedConfig(type, idx)}
                                    className="text-green-400 hover:text-red-500 text-xs"
                                    title={tr('delete')}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-800">{tr('settingsTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button onClick={() => setActiveTab('api')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'api' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}>{tr('tabAPI')}</button>
          <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'general' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}>{tr('tabGeneral')}</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">{tr('langLabel')}</label>
                <div className="flex gap-3">
                  <button onClick={() => setLocalSettings(p => ({...p, language: 'en'}))} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${localSettings.language === 'en' ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-white text-gray-600 hover:border-purple-300'}`}>English</button>
                  <button onClick={() => setLocalSettings(p => ({...p, language: 'zh'}))} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${localSettings.language === 'zh' ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-white text-gray-600 hover:border-purple-300'}`}>中文 (Chinese)</button>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2">{tr('helpTitle')}</h3>
                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{tr('helpContent')}</p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-8">
              {renderApiSection('llm')}
              {renderApiSection('image')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm">{tr('cancelEdit')}</button>
          <button onClick={() => { onSave(localSettings); onClose(); }} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/30 transform transition-all hover:-translate-y-0.5 text-sm">
            {tr('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
