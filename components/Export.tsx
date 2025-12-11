
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ProjectConfig, StoryboardFrame, SymbolCategory, Language, WorkflowStep } from '../types';
import SymbolIcon from './SymbolIcon';
import StepIndicator from './StepIndicator';
import { t } from '../locales';

interface ExportProps {
  config: ProjectConfig;
  frames: StoryboardFrame[];
  onBack: () => void;
  lang: Language;
  setCurrentStep: (step: WorkflowStep) => void;
}

const Export: React.FC<ExportProps> = ({ config, frames, onBack, lang, setCurrentStep }) => {
  const tr = (key: any) => t(lang, key);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Independent state for Technical Prompt Language
  const [promptLang, setPromptLang] = useState<Language>(lang);

  // Helper: Translate % coordinates to Semantic Position (Top-Left, Center, etc.) for AI
  const getPosLabel = (x: number, y: number, targetLang: 'en' | 'zh') => {
      const isZh = targetLang === 'zh';
      let v = 'Center';
      let h = 'Center';

      if (y < 30) v = 'Top';
      else if (y > 70) v = 'Bottom';
      
      if (x < 30) h = 'Left';
      else if (x > 70) h = 'Right';

      if (v === 'Center' && h === 'Center') return isZh ? '画面中心' : 'Center';
      
      const enPos = `${v}-${h}`;
      if (!isZh) return enPos;

      const zhMap: {[key: string]: string} = {
          'Top-Left': '左上角', 'Top-Center': '正上方', 'Top-Right': '右上角',
          'Center-Left': '左侧', 'Center-Right': '右侧',
          'Bottom-Left': '左下角', 'Bottom-Center': '正下方', 'Bottom-Right': '右下角'
      };
      return zhMap[enPos] || enPos;
  };

  // Helper: Get Translated Symbol Name
  const getSymbolName = (name: string, targetLang: 'en' | 'zh') => {
      // Use the 't' function with the target language for the specific prompt
      return t(targetLang, name);
  };

  // Generate Technical Prompts
  const generatePrompt = (subsetFrames: StoryboardFrame[], targetLang: Language) => {
    const isZh = targetLang === 'zh';
    
    // Header: 定义Sora/Runway能理解的全局风格
    let prompt = `=== AI VIDEO GENERATION PROMPT ===\n`;
    prompt += `[GLOBAL CONTEXT]\n`;
    prompt += `Style: ${config.style.name} Cinematic Video\n`;
    prompt += `Resolution: 16:9 (${config.aspectRatio})\n`;
    prompt += `Total Duration: ${config.duration}s\n\n`;

    prompt += `[SHOT SEQUENCE]\n`;
    
    // Symbol to text mapping based on icon field
    const symbolIconToTextMap: Record<string, string> = {
      'zoom-in': "Camera zooms in,",
      'zoom-out': "Camera zooms out,",
      'pan-left': "Camera pans left,",
      'pan-right': "Camera pans right,",
      'tilt-up': "Camera tilts up,",
      'tilt-down': "Camera tilts down,",
      'tracking': "Tracking shot,",
      'hitchcock': "Dolly zoom effect,",
      'speech-bubble': "Character is speaking,"
    };

    subsetFrames.forEach((f, index) => {
      // 构建结构化的单镜头指令
      let shotHeader = `SHOT ${index + 1} (Time: ${f.duration || 'Auto'})`;
      let contentDesc = isZh ? (f.descriptionZh || f.description) : f.description;
      
      // 转译符号为自然语言动作指令
      let symbolDirectives = f.symbols
        .map(s => symbolIconToTextMap[s.icon] || '')
        .filter(Boolean)
        .join(' ')
        .trim();

      // 移除最后一个逗号（如果存在）
      if (symbolDirectives.endsWith(',')) {
        symbolDirectives = symbolDirectives.slice(0, -1);
      }

      // 构建完整的PROMPT描述
      let fullDesc = contentDesc;
      if (symbolDirectives) {
        fullDesc += `. ${symbolDirectives}`;
      }

      prompt += `${shotHeader}\n`;
      prompt += `PROMPT: ${fullDesc}. Style: ${config.style.name}.\n`;
      prompt += `----------------------------------\n`;
    });

    return prompt;
  };

  const handleDownload = async (index: number) => {
    const element = sheetRefs.current[index];
    if (element) {
      try {
        // 确保元素在视口中可见
        const originalVisibility = element.style.visibility;
        const originalPosition = element.style.position;
        const originalLeft = element.style.left;
        
        element.style.visibility = 'visible';
        element.style.position = 'relative';
        element.style.left = '0';
        
        // 强制重绘
        element.offsetHeight;
        
        // 等待所有图片加载完成
        const images = element.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }));
        
        // 增加额外的等待时间，确保所有内容都已渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 优化html2canvas配置
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: true,
          allowTaint: true,
          foreignObjectRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          ignoreElements: (element) => {
            return element.tagName.toLowerCase() === 'script' || 
                   element.tagName.toLowerCase() === 'style';
          },
          // 改进的配置选项
          imageTimeout: 10000,
          removeContainer: false,
        });
        
        // 恢复原始样式
        element.style.visibility = originalVisibility;
        element.style.position = originalPosition;
        element.style.left = originalLeft;
        
        // 将canvas转换为Blob并下载
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = `storyboard-sheet-${index + 1}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            // 释放URL对象
            URL.revokeObjectURL(link.href);
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        }, 'image/png', 1.0);
      } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export image");
      }
    } else {
        console.error("Element not found for download");
        alert("Element not found for download");
      }
    };

  const itemsPerPage = 9; // 每页最多显示9张分镜图
  const totalPages = Math.ceil(frames.length / itemsPerPage);
  
  // 根据分镜数量动态确定网格列数
  const getGridColumns = (count: number): string => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-3'; // 7-9张分镜图使用3列布局
  };
  const pages = Array.from({ length: totalPages }, (_, i) => 
    frames.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
  );

  return (
    <div className="flex flex-col h-full w-full max-w-[1900px] mx-auto px-6 pb-8">
      <div className="flex items-center justify-between relative py-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><StepIndicator currentStep={WorkflowStep.EXPORT} lang={lang} onStepClick={setCurrentStep} /></div>
      </div>
      
      {/* 集中的按钮区域 */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200">
        <button onClick={onBack} className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-bold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {tr('back')}
        </button>
        
        <div className="flex flex-wrap gap-2">
          {/* 为每个分镜表创建操作按钮 */}
          {Array.from({ length: totalPages }, (_, pageIndex) => {
            const promptText = generatePrompt(frames.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage), promptLang);
            return (
              <React.Fragment key={pageIndex}>
                {/* 分镜表标题 */}
                <span className="px-3 py-2 text-gray-500 text-sm font-medium self-center">
                  {tr('sheet')} {pageIndex + 1}:
                </span>
                
                {/* 复制提示词按钮 */}
                <button 
                  onClick={() => navigator.clipboard.writeText(promptText)} 
                  className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors"
                >
                  {tr('copyPrompts')}
                </button>
                
                {/* 下载分镜图按钮 */}
                <button 
                  onClick={() => handleDownload(pageIndex)} 
                  className="flex items-center px-5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors"
                >
                  {tr('downloadImage')}
                </button>
                
                {/* 如果不是最后一个分镜表，添加分隔线 */}
                {pageIndex < totalPages - 1 && (
                  <div className="w-px h-8 bg-gray-200 mx-2"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-16 pb-12">
         {pages.map((pageFrames, pageIndex) => {
            const promptText = generatePrompt(pageFrames, promptLang);

            return (
                <div key={pageIndex} className="flex flex-col gap-6 animate-fade-in-up">
                    <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                             <span className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-full font-bold text-sm">{pageIndex + 1}</span>
                             <h3 className="font-bold text-gray-700">{tr('sheet')} {pageIndex + 1}</h3>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* Technical Prompt Sidebar */}
                        <div className="w-full lg:w-1/3 xl:w-1/4 glass-panel rounded-2xl p-6 shadow-lg self-stretch flex flex-col max-h-[800px]">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-gray-800">{tr('techPrompt')}</h2>
                                <div className="flex bg-gray-200 rounded-lg p-0.5">
                                    <button 
                                        onClick={() => setPromptLang('zh')}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${promptLang === 'zh' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        中文
                                    </button>
                                    <button 
                                        onClick={() => setPromptLang('en')}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${promptLang === 'en' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-y-auto custom-scrollbar">
                                <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-700 leading-relaxed">{promptText}</pre>
                            </div>
                        </div>

                        {/* Main Storyboard Sheet */}
                        <div className="flex-1 overflow-hidden rounded-xl shadow-2xl border border-gray-200 bg-white">
                             <div ref={(el) => { sheetRefs.current[pageIndex] = el; }} className="p-8 bg-white text-gray-900 min-h-[600px] relative">
                                
                                {/* AI Guide Legend - Compact */}
                                <div className="mb-4 p-2 border border-gray-300 bg-gray-50 rounded flex gap-6 text-[10px] font-bold text-gray-600 uppercase tracking-wider justify-between">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 border border-dashed border-red-500 bg-red-50/50"></div>
                                            <span>RED=REF</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 border border-blue-600 bg-white"></div>
                                            <span>BLUE=SHOT</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-400">ICONS = MOTION GUIDE</div>
                                </div>

                                <div className="flex gap-4 items-stretch">
                                    {/* Reference Image Column */}
                                    {config.referenceImage && (
                                        <div className="w-1/5 flex-shrink-0 flex flex-col">
                                            <div className="border-4 border-dashed border-red-500 bg-white relative mt-8 flex-1">
                                                 <div className="absolute -top-8 left-0 shadow-sm bg-red-500 text-white text-[12px] font-bold px-3 py-1 z-10 tracking-widest uppercase rounded-sm min-h-[28px] flex items-center">REF SUBJECT</div>
                                                <img src={config.referenceImage} className="w-full h-full object-contain block" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid - Tight Spacing */}
                                    <div className="flex-1">
                                        {/* 根据分镜数量动态调整网格布局 */}
                                        <div className={`grid gap-3 ${getGridColumns(pageFrames.length)}`} style={{ alignItems: 'stretch' }}>
                                            {pageFrames.map((frame) => {
                                                const allSymbols = frame.symbols; 
                                                const overlaySymbols = frame.symbols.filter(s => s.category !== SymbolCategory.CAMERA);

                                                return (
                                                    <div key={frame.id} className="flex flex-col break-inside-avoid h-full">
                                                        {/* Frame Box */}
                                                        <div className="border-4 border-blue-600 bg-white relative flex flex-col h-full">
                                                            {/* Top Labels */}
                                                            <div className="absolute -top-3 left-0 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 z-10 shadow-sm uppercase tracking-wider flex items-center justify-center">
                                                                SC-{frame.number.toString().padStart(2, '0')}
                                                            </div>

                                                            {/* Image Content Container - Fixed 16:9, but flex-grow allows pushing footer down if needed, though we want footer at bottom */}
                                                            <div className="relative bg-gray-100 overflow-hidden w-full aspect-video flex-shrink-0">
                                                                {frame.imageUrl ? (
                                                                    <img 
                                                                        src={frame.imageUrl} 
                                                                        className="w-full h-full object-cover block" 
                                                                        style={{ filter: 'grayscale(100%) contrast(120%)' }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">NO IMAGE</div>
                                                                )}

                                                                {/* OVERLAY SYMBOLS */}
                                                                {overlaySymbols.map(sym => (
                                                                    <div
                                                                        key={sym.id}
                                                                        className="absolute z-20 pointer-events-none"
                                                                        style={{
                                                                            left: `${sym.x}%`,
                                                                            top: `${sym.y}%`,
                                                                            width: `${sym.width}%`,
                                                                            height: `${sym.height}%`,
                                                                            transform: `rotate(${sym.rotation}deg)`,
                                                                        }}
                                                                    >
                                                                        <SymbolIcon category={sym.category} icon={sym.icon} text={sym.text} />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Bottom Bar: Render Icon + Name. Using flex-grow to ensure equal height alignment in grid if needed, or just min-h */}
                                                            <div className="bg-gray-50 border-t-2 border-blue-200 min-h-[28px] p-1 flex items-center justify-center flex-grow">
                                                                {allSymbols.length > 0 && (
                                                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                                                                        {allSymbols.map((sym, idx) => (
                                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                                <div className="w-4 h-4">
                                                                                    <SymbolIcon category={sym.category} icon={sym.icon} />
                                                                                </div>
                                                                                {/* Use 'tr' to translate symbol name on the sheet footer too if the app lang is Chinese */}
                                                                                <span className="text-[10px] font-black text-gray-800 uppercase leading-none">{tr(sym.name)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            );
         })}
      </div>
    </div>
  );
};

export default Export;
