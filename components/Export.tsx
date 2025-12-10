
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
}

const Export: React.FC<ExportProps> = ({ config, frames, onBack, lang }) => {
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
    let prompt = isZh ? `[全局参数]\n` : `[GLOBAL PARAMS]\n`;
    prompt += isZh 
      ? `比例: ${config.aspectRatio} | 风格: ${config.style.nameZh || config.style.name} | 总时长: ${config.duration}秒\n`
      : `Ratio: ${config.aspectRatio} | Style: ${config.style.name} | Total Duration: ${config.duration}s\n`;
    
    prompt += isZh ? `[图例说明]\n` : `[LEGEND]\n`;
    if (isZh) {
      prompt += `1. 蓝色框 (STORYBOARD FRAME) = 目标分镜画面。\n`;
      prompt += `2. 红色虚线框 (REF SUBJECT) = 角色/画风参考。\n`;
      prompt += `3. 画面内的彩色线条 = 动作或位置指令。\n`;
      prompt += `4. 画面下方的列表 = 该分镜包含的详细动作与运镜。\n`;
    } else {
      prompt += `1. BLUE Box (STORYBOARD FRAME) = Target Shot Content.\n`;
      prompt += `2. RED Dashed Box (REF SUBJECT) = Character/Style Reference.\n`;
      prompt += `3. Colored Lines ON Image = Action/Position instructions.\n`;
      prompt += `4. List BELOW Image = Detailed actions & camera moves.\n`;
    }

    prompt += isZh ? `\n[分镜详细指令]\n` : `\n[SHOT LIST]\n`;
    subsetFrames.forEach(f => {
      const camSyms = f.symbols.filter(s => s.category === SymbolCategory.CAMERA);
      const spatialSyms = f.symbols.filter(s => s.category !== SymbolCategory.CAMERA);
      const dialogueSyms = f.symbols.filter(s => s.category === SymbolCategory.DIALOGUE);
      
      let shotInstruction = `SC-${f.number.toString().padStart(2, '0')}`;
      
      // Describe Content
      shotInstruction += `\n   > ${isZh ? '内容' : 'Content'}: ${isZh ? f.descriptionZh || f.description : f.description}`;

      // Describe Spatial Actions (Precise Coordinates)
      if (spatialSyms.length > 0) {
          const actions = spatialSyms.map(s => {
              const pos = getPosLabel(s.x, s.y, targetLang);
              const name = getSymbolName(s.name, targetLang);
              return `"${name}" @ {${pos}}`;
          }).join(' | ');
          shotInstruction += `\n   > ${isZh ? '空间指令' : 'Spatial'}: ${actions}`;
      }

      // Describe Camera
      if (camSyms.length > 0) {
          const cams = camSyms.map(s => getSymbolName(s.name, targetLang)).join(' + ');
          shotInstruction += `\n   > ${isZh ? '运镜' : 'Camera'}: [${cams}]`;
      }
      
      // Describe Dialogue
      if (dialogueSyms.length > 0) {
          dialogueSyms.forEach(d => {
              if (d.text) {
                  shotInstruction += `\n   > ${isZh ? '对话' : 'Dialogue'}: (Character speaks: "${d.text}")`;
              }
          });
      }

      prompt += `${shotInstruction}\n----------------------------------\n`;
    });

    return prompt;
  };

  const handleDownload = async (index: number) => {
    const element = sheetRefs.current[index];
    if (element) {
      try {
        // 创建一个克隆元素，确保所有样式都被正确应用
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '-9999px';
        clone.style.width = element.offsetWidth + 'px';
        clone.style.height = element.offsetHeight + 'px';
        clone.style.pointerEvents = 'none';
        
        // 确保所有CSS类都被应用
        clone.classList.add('force-render');
        
        // 添加到DOM
        document.body.appendChild(clone);
        
        // 等待所有图片加载完成（包括克隆元素中的图片）
        const images = clone.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // 即使图片加载失败也继续
          });
        }));
        
        // 优化html2canvas配置
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
          foreignObjectRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: clone.offsetWidth,
          windowHeight: clone.offsetHeight,
          ignoreElements: (element) => {
            // 忽略可能导致问题的元素
            return element.tagName.toLowerCase() === 'script' || 
                   element.tagName.toLowerCase() === 'style';
          }
        });
        
        // 清理克隆元素
        document.body.removeChild(clone);
        
        const link = document.createElement('a');
        link.download = `storyboard-sheet-${index + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export image");
        // 确保即使出错也清理克隆元素
        const clones = document.querySelectorAll('.force-render');
        clones.forEach(clone => clone.remove());
      }
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
          <button onClick={onBack} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all z-10">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             {tr('edit')}
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><StepIndicator currentStep={WorkflowStep.EXPORT} lang={lang} /></div>
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
                        <div className="flex gap-3">
                            <button onClick={() => navigator.clipboard.writeText(promptText)} className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors">{tr('copyPrompts')}</button>
                            <div className="w-px h-8 bg-gray-200 mx-2"></div>
                            <button onClick={() => handleDownload(pageIndex)} className="flex items-center px-5 py-2 bg-gray-900 text-white hover:bg-black rounded-lg text-xs font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4v12" /></svg>
                                {tr('downloadImage')}
                            </button>
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
