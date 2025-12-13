
import React, { useState, useRef, useEffect } from 'react';
import { StoryboardFrame, SymbolCategory, SYMBOLS_LIBRARY, SymbolItem, StyleOption, Language, WorkflowStep, ProjectConfig, AppSettings } from '../types';
import SymbolIcon from './SymbolIcon';
import StepIndicator from './StepIndicator';
import { t } from '../locales';
import { translateText } from '../services/geminiService';

interface EditorProps {
    frames: StoryboardFrame[];
    updateFrames: (frames: StoryboardFrame[]) => void;
    config: ProjectConfig;
    onNext: () => void;
    onBack: () => void;
    regenerateImage: (frameId: string) => Promise<void>;
    lang: Language;
    settings: AppSettings;
    isGlobalLoading: boolean;
    updateConfig: (updates: Partial<ProjectConfig>) => void;
    setCurrentStep: (step: WorkflowStep) => void;
}

// Internal Component for Prompt Boxes
const PromptCard = ({ 
    title, 
    subTitle, 
    value, 
    onSave, 
    colorClass, 
    iconPath,
    lang,
    isGenerating,
    onRegenerate
}: { 
    title: string; 
    subTitle: string; 
    value: string; 
    onSave: (val: string) => void; 
    colorClass: string; 
    iconPath: React.ReactNode;
    lang: Language;
    isGenerating?: boolean;
    onRegenerate?: () => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const tr = (key: any) => t(lang, key);

    useEffect(() => {
        console.log('PromptCard useEffect - value changed:', value);
        // 确保分镜切换时更新临时值
        setTempValue(value);
    }, [value, title]);

    const handleSave = () => {
        console.log('PromptCard handleSave - saving value:', tempValue);
        onSave(tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    return (
        <div className={`relative flex flex-col h-full rounded-xl border-2 ${isEditing ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200'} bg-white transition-all shadow-sm group`}>
             {/* Header */}
             <div className={`flex items-center justify-between px-3 py-2 border-b border-dashed ${colorClass} bg-gray-50/50 rounded-t-lg flex-shrink-0`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`${colorClass.replace('border-', 'text-')} flex-shrink-0`}>{iconPath}</span>
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-xs font-bold text-gray-800 truncate">{title}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{subTitle}</span>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex-shrink-0 text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-600 font-bold hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        {tr('edit')}
                    </button>
                )}
             </div>

             {/* Content */}
             <div className="flex-1 p-2 relative min-h-0">
                 {isEditing ? (
                     <textarea 
                        className="w-full h-full text-xs text-gray-700 p-2 outline-none resize-none bg-gray-50 rounded"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        autoFocus
                     />
                 ) : (
                     <div className="w-full h-full text-xs text-gray-600 p-2 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar">
                         {value || <span className="text-gray-300 italic">No content...</span>}
                     </div>
                 )}
             </div>

             {/* Action Footer (Only in Edit Mode) */}
             {isEditing && (
                 <div className="flex items-center gap-2 p-2 pt-0 justify-end bg-transparent flex-shrink-0">
                     <button onClick={handleCancel} className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded">{tr('cancelEdit')}</button>
                     <button onClick={handleSave} className="px-3 py-1 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-sm">{tr('confirmEdit')}</button>
                 </div>
             )}
        </div>
    );
};


const Editor: React.FC<EditorProps> = ({ frames, updateFrames, config, onNext, onBack, regenerateImage, lang, settings, isGlobalLoading, updateConfig, setCurrentStep }) => {
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);
    const [showSymbolHelp, setShowSymbolHelp] = useState(false);
    const activeFrame = frames[activeFrameIndex];
    const tr = (key: any) => t(lang, key);
    
    // 检查是否有任何分镜正在生成
    const isAnyFrameGenerating = frames.some(frame => frame.isGenerating);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && updateConfig) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    updateConfig({ referenceImage: ev.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

  // Interaction State
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialSymbolState, setInitialSymbolState] = useState<SymbolItem | null>(null);
  const [isInteracting, setIsInteracting] = useState(false); 

  // Editing State
  const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Custom Confirmation Modal State// --- 确认修改弹窗状态 --- 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalFrameId, setConfirmModalFrameId] = useState<string | null>(null);
  // 自定义提示框状态
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  // 控制是否在文本修改时显示动画
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isShowEffect, setIsShowEffect] = useState(false);
  
  const getAspectRatioStyle = () => {
     const [w, h] = config.aspectRatio.split(':').map(Number);
     return { aspectRatio: `${w}/${h}` };
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // 更新提示词，支持四个框之间的联动
  const handleSavePrompt = async (type: 'visual' | 'video', field: 'en' | 'zh', newVal: string) => {
    console.log('handleSavePrompt called:', { type, field, newVal });
    setIsTextEditing(true); // 开始文本编辑，临时禁用动画
    const newFrames = [...frames];
    const activeFrame = newFrames[activeFrameIndex];
    let translatedText = '';
    let translationSuccess = false;

    if (type === 'visual') {
      if (field === 'en') {
        // 用户编辑了Visual Prompt (EN)
        activeFrame.visualPrompt = newVal;
        try {
          // 翻译成中文，更新画面描述 (中文)
          translatedText = await translateText(newVal, 'zh', settings);
          console.log('Visual EN to ZH translation result:', translatedText);
          if (translatedText && translatedText !== newVal) {
            activeFrame.visualPromptZh = translatedText;
            translationSuccess = true;
          }
        } catch (error) {
          console.error('Visual EN to ZH translation failed:', error);
        }
        // 如果翻译失败，至少保持原始值（作为后备方案）
        if (!translationSuccess) {
          console.log('Translation failed, using fallback for visual prompts');
          // 这里可以添加简单的后备逻辑，比如保留现有值或添加标记
        }
      } else {
        // 用户编辑了画面描述 (中文)
        activeFrame.visualPromptZh = newVal;
        try {
          // 翻译成英文，更新Visual Prompt (EN)
          translatedText = await translateText(newVal, 'en', settings);
          console.log('Visual ZH to EN translation result:', translatedText);
          if (translatedText && translatedText !== newVal) {
            activeFrame.visualPrompt = translatedText;
            translationSuccess = true;
          }
        } catch (error) {
          console.error('Visual ZH to EN translation failed:', error);
        }
        // 如果翻译失败，至少保持原始值（作为后备方案）
        if (!translationSuccess) {
          console.log('Translation failed, using fallback for visual prompts');
        }
      }
    } else {
      if (field === 'en') {
        // 用户编辑了Video Prompt (EN)
        activeFrame.description = newVal;
        try {
          // 翻译成中文，更新视频提示词 (中文)
          translatedText = await translateText(newVal, 'zh', settings);
          console.log('Video EN to ZH translation result:', translatedText);
          if (translatedText && translatedText !== newVal) {
            activeFrame.descriptionZh = translatedText;
            translationSuccess = true;
          }
        } catch (error) {
          console.error('Video EN to ZH translation failed:', error);
        }
        // 如果翻译失败，至少保持原始值（作为后备方案）
        if (!translationSuccess) {
          console.log('Translation failed, using fallback for video prompts');
        }
      } else {
        // 用户编辑了视频提示词 (中文)
        activeFrame.descriptionZh = newVal;
        try {
          // 翻译成英文，更新Video Prompt (EN)
          translatedText = await translateText(newVal, 'en', settings);
          console.log('Video ZH to EN translation result:', translatedText);
          if (translatedText && translatedText !== newVal) {
            activeFrame.description = translatedText;
            translationSuccess = true;
          }
        } catch (error) {
          console.error('Video ZH to EN translation failed:', error);
        }
        // 如果翻译失败，至少保持原始值（作为后备方案）
        if (!translationSuccess) {
          console.log('Translation failed, using fallback for video prompts');
        }
      }
    }
    
    console.log('Updated activeFrame:', activeFrame);
    console.log('New frames array:', newFrames);

    // 更新frames状态前的调试日志
    console.log('Before updateFrames - current frames in state:', frames);
    
    updateFrames(newFrames);
    
    // 更新frames状态后的调试日志
    console.log('After updateFrames - new frames should be:', newFrames);
    
    showToast(tr('syncSuccess'));

    // 如果修改的是画面提示词，立即询问用户是否重新生成画面
    if (type === 'visual') {
      setIsTextEditing(false); // 立即重新启用动画
      setIsShowEffect(true); // 立即开始显示动效
      // 立即显示确认弹窗
      setConfirmModalFrameId(activeFrame.id);
      setShowConfirmModal(true);
    } else {
      setIsTextEditing(false); // 非画面修改直接重新启用动画
    }
  };

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, category: SymbolCategory, name: string, icon: string) => {
    const data = JSON.stringify({ category, name, icon });
    e.dataTransfer.setData('application/json', data);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    
    const { category, name, icon } = JSON.parse(dataStr);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Default size logic (responsive to canvas size)
    let defaultW = 15;
    let defaultH = 15 * (rect.width / rect.height);
    
    if (category === SymbolCategory.REFERENCE) {
        defaultW = 30;
        defaultH = 40;
    }

    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // 获取符号的详细描述
    const description = t(lang, `${name}_help`) || '';

    addSymbolToFrame(activeFrame.id, {
      id: `sym-${Date.now()}`,
      category,
      name,
      icon,
      x, 
      y,
      width: defaultW,
      height: defaultH,
      rotation: 0,
      description
    });
  };

  const addSymbolToFrame = (frameId: string, symbol: SymbolItem) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    if (frame.symbols.length >= 4) {
      setAlertModalMessage(tr('maxSymbols'));
      setShowAlertModal(true);
      return;
    }
    
    // 添加对话符号特殊限制
    if (symbol.category === SymbolCategory.DIALOGUE) {
      const dialogueSymbols = frame.symbols.filter(s => s.category === SymbolCategory.DIALOGUE);
      if (dialogueSymbols.length >= 2) {
        setAlertModalMessage(tr('maxDialogue'));
        setShowAlertModal(true);
        return;
      }
    } else if (symbol.category !== SymbolCategory.CUSTOM) {
      // 其他分类限制
      const sameCategory = frame.symbols.filter(s => s.category === symbol.category);
      if (sameCategory.length > 0) {
        setAlertModalMessage(tr('maxCategory'));
        setShowAlertModal(true);
        return;
      }
    }

    const newFrames = frames.map(f => f.id === frameId ? { ...f, symbols: [...f.symbols, symbol] } : f);
    updateFrames(newFrames);
  };

  // --- Canvas Interaction ---
  const handleMouseDown = (e: React.MouseEvent, symbol: SymbolItem, mode: typeof interactionMode) => {
    e.stopPropagation();
    setSelectedSymbolId(symbol.id);
    setInteractionMode(mode);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialSymbolState({ ...symbol });
    setIsInteracting(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactionMode || !initialSymbolState || !selectedSymbolId || !canvasRef.current) return;
      
      const frame = frames[activeFrameIndex];
      const symbolIndex = frame.symbols.findIndex(s => s.id === selectedSymbolId);
      if (symbolIndex === -1) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dxPx = e.clientX - startPos.x;
      const dyPx = e.clientY - startPos.y;
      
      const dx = (dxPx / rect.width) * 100;
      const dy = (dyPx / rect.height) * 100;

      const updatedSymbol = { ...frame.symbols[symbolIndex] };

      if (interactionMode === 'move') {
        updatedSymbol.x = initialSymbolState.x + dx;
        updatedSymbol.y = initialSymbolState.y + dy;
      } else if (interactionMode === 'rotate') {
        updatedSymbol.rotation = (initialSymbolState.rotation + (dxPx * 0.5)) % 360;
      } else {
        if (interactionMode === 'resize-se') {
             updatedSymbol.width = Math.max(5, initialSymbolState.width + dx);
             updatedSymbol.height = Math.max(5, initialSymbolState.height + dy);
        }
        else if (interactionMode === 'resize-sw') {
            const wChange = -dx;
            updatedSymbol.x = initialSymbolState.x + dx;
            updatedSymbol.width = Math.max(5, initialSymbolState.width + wChange);
            updatedSymbol.height = Math.max(5, initialSymbolState.height + dy);
        }
        else if (interactionMode === 'resize-ne') {
            const hChange = -dy;
            updatedSymbol.y = initialSymbolState.y + dy;
            updatedSymbol.width = Math.max(5, initialSymbolState.width + dx);
            updatedSymbol.height = Math.max(5, initialSymbolState.height + hChange);
        }
        else if (interactionMode === 'resize-nw') {
            const wChange = -dx;
            const hChange = -dy;
            updatedSymbol.x = initialSymbolState.x + dx;
            updatedSymbol.y = initialSymbolState.y + dy;
            updatedSymbol.width = Math.max(5, initialSymbolState.width + wChange);
            updatedSymbol.height = Math.max(5, initialSymbolState.height + hChange);
        }
      }

      const newFrames = [...frames];
      newFrames[activeFrameIndex].symbols[symbolIndex] = updatedSymbol;
      updateFrames(newFrames);
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        setInteractionMode(null);
        setTimeout(() => setIsInteracting(false), 50); 
    };

    if (interactionMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionMode, startPos, initialSymbolState, selectedSymbolId, frames, activeFrameIndex]);

  const handleBgClick = () => {
      if (!isInteracting) {
          setSelectedSymbolId(null);
      }
  };

  const removeSymbol = (symbolId: string) => {
    const newFrames = frames.map(f => f.id === activeFrame.id ? { ...f, symbols: f.symbols.filter(s => s.id !== symbolId) } : f);
    updateFrames(newFrames);
    if (selectedSymbolId === symbolId) setSelectedSymbolId(null);
  };

  const handleEditSymbol = (symbol: SymbolItem) => {
      setEditingSymbol(symbol);
  };

  const saveSymbolChanges = (updates: Partial<SymbolItem>) => {
      if (!editingSymbol) return;
      const newFrames = [...frames];
      const symIdx = newFrames[activeFrameIndex].symbols.findIndex(s => s.id === editingSymbol.id);
      if (symIdx !== -1) {
          newFrames[activeFrameIndex].symbols[symIdx] = { ...newFrames[activeFrameIndex].symbols[symIdx], ...updates };
          updateFrames(newFrames);
      }
      setEditingSymbol(null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  saveSymbolChanges({ icon: ev.target.result as string, isCustom: true });
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>, frameIndex: number) => {
     if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const newFrames = [...frames];
                newFrames[frameIndex] = { ...newFrames[frameIndex], imageUrl: ev.target.result as string };
                updateFrames(newFrames);
            }
        };
        reader.readAsDataURL(e.target.files[0]);
     }
  };

  return (
      <div className="flex flex-col h-full w-full max-w-[1800px] mx-auto px-4 pb-4 relative">
        {/* Global Sci-fi Loading Overlay - 文本编辑时不显示 */}
        {(isGlobalLoading || (isAnyFrameGenerating && !isTextEditing) || isShowEffect) && (
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
        
        <StepIndicator currentStep={WorkflowStep.EDITOR} lang={lang} onStepClick={setCurrentStep} />
      
      {/* Toast Notification - 提高z-index确保显示在动画之上 */}
      {toastMsg && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[1000] bg-gray-900/90 text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fade-in-up">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-xs font-bold">{toastMsg}</span>
          </div>
      )}
      
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* LEFT COLUMN: Reference + Library */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-4">
             {/* 1. Reference Subject (Static Preview) - Completely separated */}
             <div className="glass-panel rounded-2xl p-4 flex flex-col flex-shrink-0">
                 <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wider">{tr('refSubject')}</h3>
                 <div className="p-2 bg-red-50 rounded-xl border-2 border-dashed border-red-200 text-center relative group">
                    {config.referenceImage ? (
                        <div className="w-full aspect-square rounded-lg overflow-hidden shadow-sm">
                            <img src={config.referenceImage} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="text-[10px] text-gray-400 italic py-4">{tr('noRefImage')}</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold mr-2 hover:bg-blue-700"
                        >
                            {tr('upload')}
                        </button>
                        {config.referenceImage && updateConfig && (
                            <button
                                onClick={() => updateConfig({ referenceImage: undefined })}
                                className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                            >
                                {tr('delete')}
                            </button>
                        )}
                    </div>
                </div>
             </div>

             {/* 2. Symbol Library (Scrollable) */}
             <div className="glass-panel rounded-2xl p-4 flex flex-col overflow-hidden flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex-shrink-0">{tr('symbolLib')}</h3>
                    {/* Help Button */}
                    <button
                        onClick={() => setShowSymbolHelp(true)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        title="符号帮助文档"
                    >
                        <span className="text-xs font-bold">?</span>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 space-y-6 pr-1 custom-scrollbar min-h-0">
                    {Object.entries(SYMBOLS_LIBRARY).map(([category, items]) => (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    category === SymbolCategory.CAMERA ? 'bg-blue-500' :
                                    category === SymbolCategory.ACTION ? 'bg-orange-500' :
                                    category === SymbolCategory.REFERENCE ? 'bg-red-500' :
                                    'bg-gray-500'
                                }`}></span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    {tr(`cat_${category.toLowerCase()}`)}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, category as SymbolCategory, item.name, item.icon)}
                                    className="aspect-square bg-white rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 border border-gray-100 shadow-sm"
                                    title={tr(`${item.name}_help`)}
                                >
                                    <div className="w-8 h-8 mb-1">
                                        <SymbolIcon category={category as SymbolCategory} icon={item.icon} />
                                    </div>
                                    <span className="text-[8px] text-center text-gray-500 leading-none truncate w-full">
                                        {tr(item.name)}
                                    </span>
                                </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* CENTER: Canvas & Prompts */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
            {/* Canvas Area */}
            <div className="glass-panel rounded-2xl p-6 flex items-center justify-center bg-gray-100/50 shadow-inner overflow-hidden" style={{ height: '50vh' }} onClick={handleBgClick}>
                <div 
                    className="relative bg-white shadow-2xl transition-all duration-300 group"
                    style={{
                        ...getAspectRatioStyle(),
                        height: 'auto',
                        width: '75%', // 缩小主图宽度至原来的四分之三
                        maxHeight: '45vh', // 限制最大高度至原来的四分之三
                        maxWidth: `calc(100% - 2rem)`, // Ensure dragging padding
                        margin: '0 auto' // 居中显示
                    }}
                    ref={canvasRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Background Image - FORCED LINE ART STYLE */}
                    {activeFrame.isGenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-purple-600 animate-pulse font-bold">AI生成中...</div>
                    ) : (
                        <img 
                            src={activeFrame.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} 
                            className="w-full h-full object-cover select-none pointer-events-none"
                            style={{ filter: 'grayscale(100%) contrast(150%) brightness(110%)' }}
                        />
                    )}

                    {/* Frame Info Tag */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-0.5 text-xs font-bold shadow-md z-10 rounded-sm">
                        SC-{(activeFrame.number?.toString() || '00').padStart(2, '0')}
                    </div>

                    {/* Symbols Layer */}
                    {activeFrame.symbols.map((sym) => (
                        <div
                            key={sym.id}
                            onMouseDown={(e) => handleMouseDown(e, sym, 'move')}
                            className={`absolute cursor-move select-none group/symbol ${selectedSymbolId === sym.id ? 'z-50' : 'z-20'}`}
                            style={{
                                left: `${sym.x}%`,
                                top: `${sym.y}%`,
                                width: `${sym.width}%`,
                                height: `${sym.height}%`,
                                transform: `rotate(${sym.rotation}deg)`,
                            }}
                        >
                            <div className="relative w-full h-full">
                                <SymbolIcon category={sym.category} icon={sym.icon} text={sym.text} />
                                
                                {/* Controls Overlay */}
                                {(selectedSymbolId === sym.id) && (
                                    <div className="absolute -inset-1 border border-blue-400 border-dashed pointer-events-none">
                                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, sym, 'resize-nw')} />
                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, sym, 'resize-ne')} />
                                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, sym, 'resize-sw')} />
                                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, sym, 'resize-se')} />
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border border-blue-500 rounded-full cursor-pointer pointer-events-auto flex items-center justify-center shadow-sm" onMouseDown={(e) => handleMouseDown(e, sym, 'rotate')}>
                                            <span className="text-[10px]">↻</span>
                                        </div>
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-auto whitespace-nowrap">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditSymbol(sym); }} className="bg-blue-600 text-white p-1 px-2 rounded shadow text-[10px] hover:bg-blue-700">{tr('editSym')}</button>
                                            <button onClick={(e) => { e.stopPropagation(); removeSymbol(sym.id); }} className="bg-red-500 text-white p-1 px-2 rounded shadow text-[10px] hover:bg-red-600">×</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Prompt Editors (Redesigned Grid 2x2) - INCREASED HEIGHT */}
            <div className="h-80 grid grid-cols-2 grid-rows-2 gap-3 flex-shrink-0 relative">
                 <div className="row-span-1 min-h-0">
                    <PromptCard 
                        title="Visual Prompt (EN)"
                        subTitle="IMAGE GEN"
                        value={activeFrame.visualPrompt || ''}
                        onSave={(val) => handleSavePrompt('visual', 'en', val)}
                        colorClass="border-red-300"
                        iconPath={<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        lang={lang}
                        isGenerating={activeFrame.isGenerating}
                        onRegenerate={() => regenerateImage(activeFrame.id)}
                    />
                 </div>
                 <div className="row-span-1 min-h-0">
                    <PromptCard 
                        title="画面描述 (中文)"
                        subTitle="参考画面"
                        value={activeFrame.visualPromptZh || ''}
                        onSave={(val) => handleSavePrompt('visual', 'zh', val)}
                        colorClass="border-purple-300"
                        iconPath={<span className="text-[10px] font-bold">ZH</span>}
                        lang={lang}
                    />
                 </div>
                 <div className="row-span-1 min-h-0">
                    <PromptCard 
                        title="Video Prompt (EN)"
                        subTitle="MOTION GEN"
                        value={activeFrame.description || ''}
                        onSave={(val) => handleSavePrompt('video', 'en', val)}
                        colorClass="border-blue-300"
                        iconPath={<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                        lang={lang}
                    />
                 </div>
                 <div className="row-span-1 min-h-0">
                    <PromptCard 
                        title="视频提示词 (中文)"
                        subTitle="动作描述"
                        value={activeFrame.descriptionZh || ''}
                        onSave={(val) => handleSavePrompt('video', 'zh', val)}
                        colorClass="border-indigo-300"
                        iconPath={<span className="text-[10px] font-bold">ZH</span>}
                        lang={lang}
                    />
                 </div>
                 
                 {/* Custom Confirmation Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-panel rounded-2xl p-6 shadow-lg max-w-md w-full border-2 border-purple-300">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">{tr('regenerateConfirm')}</h3>
                            <p className="text-gray-600 text-sm mb-5">{tr('regenerateConfirmMsg')}</p>
                            <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setIsTextEditing(true); // 取消后禁用动效
                                    setIsShowEffect(false); // 取消后隐藏动效
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded"
                            >
                                {tr('cancel')}
                            </button>
                            <button 
                                onClick={() => {
                                    if (confirmModalFrameId) {
                                        regenerateImage(confirmModalFrameId);
                                    }
                                    setShowConfirmModal(false);
                                    setIsShowEffect(false); // 由isAnyFrameGenerating控制动效
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-sm"
                            >
                                {tr('regenerate')}
                            </button>
                        </div>
                        </div>
                    </div>
                )}
                
                {/* Custom Alert Modal */}
                {showAlertModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-panel rounded-2xl p-6 shadow-lg max-w-md w-full border-2 border-purple-300">
                            <p className="text-gray-600 text-sm mb-5 text-center">{alertModalMessage}</p>
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setShowAlertModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-sm"
                                >
                                    {tr('ok')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: List */}
        <div className="w-56 flex-shrink-0 glass-panel rounded-2xl p-4 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">{tr('framesList')}</h3>
            <div className="mb-4 pb-4 border-b border-gray-100 flex-shrink-0">
                <button onClick={onNext} className="w-full py-3 border-2 border-purple-600 hover:bg-purple-700 hover:text-white bg-transparent text-purple-600 rounded-xl font-bold text-sm shadow-lg mb-2 transition-all duration-200">{tr('exportProject')}</button>
                <button onClick={onBack} className="w-full py-3 border-2 border-purple-600 hover:bg-purple-700 hover:text-white bg-transparent text-purple-600 rounded-xl font-bold text-sm shadow-lg mb-2 transition-all duration-200">{tr('back')}</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {frames.map((frame, idx) => (
                    <div 
                        key={frame.id}
                        onClick={() => setActiveFrameIndex(idx)}
                        className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative group/frame ${idx === activeFrameIndex ? 'border-purple-600 ring-2 ring-purple-100' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    >
                        {/* FORCE 16:9 for Sidebar Thumbnails */}
                        <div className="bg-gray-200 relative w-full aspect-video">
                             {frame.imageUrl && (
                                <img 
                                    src={frame.imageUrl} 
                                    className="w-full h-full object-cover" 
                                    style={{ filter: 'grayscale(100%) contrast(150%) brightness(110%)' }}
                                />
                             )}
                             <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded shadow-sm font-bold z-10 flex items-center justify-center">
                                SC-{(frame.number?.toString() || '00').padStart(2, '0')}
                             </div>

                             {/* FRAME CONTROLS OVERLAY - Redraw & Upload */}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); regenerateImage(frame.id); }}
                                    disabled={frame.isGenerating}
                                    className={`p-1.5 rounded-full shadow-lg transform transition-all ${frame.isGenerating ? 'bg-purple-400 text-white cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-110'}`}
                                    title={tr('redraw')}
                                >
                                    {frame.isGenerating ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    )}
                                </button>
                                <label className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transform hover:scale-110 transition-all cursor-pointer" title={tr('upload')}>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFrameImageUpload(e, idx)} />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </label>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Edit Symbol Modal */}
      {editingSymbol && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setEditingSymbol(null)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 w-80 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-gray-800 mb-4">{tr('editSymTitle')}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">{tr('symName')}</label>
                          <input 
                            type="text" 
                            value={editingSymbol.name} 
                            onChange={e => setEditingSymbol({...editingSymbol, name: e.target.value})}
                            className="w-full p-2 border rounded text-sm"
                          />
                      </div>
                      {/* Dialogue Text Input - Only for Dialogue Symbols */}
                      {editingSymbol.category === SymbolCategory.DIALOGUE && (
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">{tr('dialogueText')}</label>
                              <input 
                                type="text" 
                                value={editingSymbol.text || ''} 
                                onChange={e => {
                                  // Limit to 15 characters
                                  const text = e.target.value.slice(0, 15);
                                  setEditingSymbol({...editingSymbol, text});
                                }}
                                placeholder="输入对话内容 (最多15字)"
                                className="w-full p-2 border rounded text-sm"
                              />
                              <p className="text-[10px] text-gray-400 mt-1">{editingSymbol.text?.length || 0}/15</p>
                          </div>
                      )}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">{tr('symIcon')}</label>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 border rounded flex items-center justify-center bg-gray-50 overflow-hidden p-1">
                                  <SymbolIcon category={editingSymbol.category} icon={editingSymbol.icon} />
                              </div>
                              <label className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-center cursor-pointer">
                                  {tr('uploadIcon')}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                              </label>
                          </div>
                      </div>
                      <button 
                        onClick={() => saveSymbolChanges({ 
                          name: editingSymbol.name, 
                          icon: editingSymbol.icon, 
                          text: editingSymbol.text 
                        })}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm mt-2"
                      >
                          {tr('save')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Symbol Help Modal */}
      {showSymbolHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-800">{tr('symbolLib')} - {tr('help')}</h2>
              <button
                onClick={() => setShowSymbolHelp(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* Symbol Definitions */}
            <div className="space-y-6">
              {/* Camera Symbols */}
              <div>
                <h3 className="font-bold text-blue-600 mb-2">{tr('camera')} {tr('symbols')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-1">📷</span>
                    <div>
                      <strong>{tr('shotType')}</strong>
                      <p className="text-gray-600">{tr('shotType_help')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-1">🎞️</span>
                    <div>
                      <strong>{tr('cameraMovement')}</strong>
                      <p className="text-gray-600">{tr('cameraMovement_help')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Symbols */}
              <div>
                <h3 className="font-bold text-orange-600 mb-2">{tr('action')} {tr('symbols')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1">⚡</span>
                    <div>
                      <strong>{tr('speed')}</strong>
                      <p className="text-gray-600">{tr('speed_help')}</p>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-gray-500">
                        <li>0-40px: {tr('slow')}</li>
                        <li>41-80px: {tr('medium')}</li>
                        <li>81px+: {tr('fast')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotion Symbols */}
              <div>
                <h3 className="font-bold text-purple-600 mb-2">{tr('emotion')} {tr('symbols')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold mt-1">😊</span>
                    <div>
                      <strong>{tr('emotion')}</strong>
                      <p className="text-gray-600">{tr('emotion_help')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Symbols */}
              <div>
                <h3 className="font-bold text-red-600 mb-2">{tr('reference')} {tr('symbols')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-1">📍</span>
                    <div>
                      <strong>{tr('referenceBox')}</strong>
                      <p className="text-gray-600">{tr('referenceBox_help')}</p>
                      <p className="text-xs mt-1 text-gray-500">{tr('referenceBox_note')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow Symbols */}
              <div>
                <h3 className="font-bold text-green-600 mb-2">{tr('arrow')} {tr('symbols')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-1">↗️</span>
                    <div>
                      <strong>{tr('direction')}</strong>
                      <p className="text-gray-600">{tr('direction_help')}</p>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-gray-500">
                        <li>↖️ {tr('upLeft')}</li>
                        <li>↑ {tr('up')}</li>
                        <li>↗️ {tr('upRight')}</li>
                        <li>← {tr('left')}</li>
                        <li>→ {tr('right')}</li>
                        <li>↙️ {tr('downLeft')}</li>
                        <li>↓ {tr('down')}</li>
                        <li>↘️ {tr('downRight')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symbol Size Guide */}
              <div>
                <h3 className="font-bold text-gray-700 mb-2">{tr('symbolSizeGuide')}</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">{tr('symbolSizeHelp')}</p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-gray-500">
                    <li>0-40px: {tr('small')} - {tr('symbolSize_small')}</li>
                    <li>41-80px: {tr('medium')} - {tr('symbolSize_medium')}</li>
                    <li>81px+: {tr('large')} - {tr('symbolSize_large')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSymbolHelp(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors"
              >
                {tr('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
