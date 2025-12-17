
import React, { useRef, useState } from 'react';
import { ProjectConfig, StoryboardFrame, SymbolCategory, Language, WorkflowStep } from '../types';
import SymbolIcon from './SymbolIcon';
import StepIndicator from './StepIndicator';
import { t } from '../locales';
import { downloadStoryboardSheet } from './ExportDownload';

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
  // State to control symbol visibility in preview
  const [showSymbols, setShowSymbols] = useState<boolean>(false);

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
    
    // Header: 明确简洁的Sora 2视频生成指令
    let prompt = isZh ? `=Sora 2视频生成指令=\n` : `=SORA 2 VIDEO GENERATION INSTRUCTIONS=\n`;
    prompt += isZh ? `[核心要求]\n` : `[CORE REQUIREMENTS]\n`;
    prompt += isZh ? `1. 严格按分镜编号顺序生成，分镜与脚本一一对应\n` : `1. Follow exact shot sequence, each storyboard matches one script\n`;
    prompt += isZh ? `2. 结合分镜图(构图)和文字(剧情)生成视频\n` : `2. Combine storyboard (composition) and text (plot)\n`;
    
    // Global Context - 精确的全局参数
    prompt += isZh ? `\n[全局参数]\n` : `\n[GLOBAL PARAMETERS]\n`;
    prompt += isZh ? `风格: ${config.style.name}\n` : `Style: ${config.style.name}\n`;
    prompt += isZh ? `分辨率: 16:9\n` : `Resolution: 16:9\n`;
    prompt += isZh ? `总时长: ${config.duration}秒\n` : `Total Duration: ${config.duration}s\n`;
    
    // 参考主体 - 精准说明使用要求
    if (config.referenceImage) {
      prompt += isZh ? `参考主体: 严格使用提供的参考图片，保持主体外观100%一致\n` : `Reference Subject: Strictly use provided reference image, maintain 100% consistent appearance\n`;
    }
    
    // 执行规则 - 简单明了的限制条件
    prompt += isZh ? `\n[执行规则]\n` : `\n[EXECUTION RULES]\n`;
    prompt += isZh ? `1. 不修改参考主体核心特征\n` : `1. Do not modify reference subject core features\n`;
    prompt += isZh ? `2. 不添加无关元素或角色\n` : `2. Do not add irrelevant elements/characters\n`;
    prompt += isZh ? `3. 精确执行指定的镜头运动\n` : `3. Precisely execute specified camera movements\n`;
    prompt += isZh ? `4. 保持镜头间视觉连续性\n` : `4. Maintain visual continuity between shots\n`;
    
    // Shot Sequence - 直接进入镜头序列
    prompt += isZh ? `\n[镜头序列]\n` : `\n[SHOT SEQUENCE]\n`;
    
    // 辅助函数：检测箭头方向
    const detectArrowDirection = (rotation: number): string => {
      // 标准化旋转角度到0-360范围
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      
      // 定义8个方向的角度范围
      const directions = [
        { name: isZh ? "上" : "Up", angle: 0, range: 22.5 },
        { name: isZh ? "右上" : "Up-Right", angle: 45, range: 22.5 },
        { name: isZh ? "右" : "Right", angle: 90, range: 22.5 },
        { name: isZh ? "右下" : "Down-Right", angle: 135, range: 22.5 },
        { name: isZh ? "下" : "Down", angle: 180, range: 22.5 },
        { name: isZh ? "左下" : "Down-Left", angle: 225, range: 22.5 },
        { name: isZh ? "左" : "Left", angle: 270, range: 22.5 },
        { name: isZh ? "左上" : "Up-Left", angle: 315, range: 22.5 }
      ];
      
      // 找到最接近的方向
      for (const dir of directions) {
        const diff = Math.abs(normalizedRotation - dir.angle);
        if (diff <= dir.range || diff >= 360 - dir.range) {
          return dir.name;
        }
      }
      
      return "Unknown";
    };
    
    // 辅助函数：根据位置获取语义化描述
    const getPositionDescription = (x: number, y: number): string => {
      let vertical = isZh ? "中" : "Center";
      let horizontal = isZh ? "中" : "Center";
      
      // 垂直方向
      if (y < 30) vertical = isZh ? "上" : "Top";
      else if (y > 70) vertical = isZh ? "下" : "Bottom";
      
      // 水平方向
      if (x < 30) horizontal = isZh ? "左" : "Left";
      else if (x > 70) horizontal = isZh ? "右" : "Right";
      
      if (vertical === (isZh ? "中" : "Center") && horizontal === (isZh ? "中" : "Center")) {
        return isZh ? "中心" : "Center";
      }
      
      return isZh ? `${vertical}${horizontal}` : `${vertical}-${horizontal}`;
    };
    
    // 辅助函数：根据符号大小获取速度等级
    const getSpeedLevel = (width: number, height: number): string => {
      // 计算符号面积占分镜的比例（假设分镜是正方形，面积为100x100=10000）
      const symbolArea = width * height;
      const areaPercentage = (symbolArea / 10000) * 100;
      
      if (isZh) {
        if (areaPercentage < 10) return "极慢";
        if (areaPercentage < 25) return "缓慢";
        if (areaPercentage < 50) return "中等";
        if (areaPercentage < 75) return "快速";
        return "极快（带运动模糊）";
      } else {
        if (areaPercentage < 10) return "Extremely Slow";
        if (areaPercentage < 25) return "Slow";
        if (areaPercentage < 50) return "Moderate";
        if (areaPercentage < 75) return "Fast";
        return "Extremely Fast (with motion blur)";
      }
    };
    
    // 辅助函数：根据表情符号获取情绪描述
    const getEmotionDescription = (icon: string, width: number, height: number): string => {
      const symbolArea = width * height;
      const areaPercentage = (symbolArea / 10000) * 100;
      
      let intensity = isZh ? "" : "";
      if (areaPercentage < 20) intensity = isZh ? "稍微 " : "slightly ";
      else if (areaPercentage > 50) intensity = isZh ? "强烈 " : "intensely ";
      
      const emotionMap: Record<string, string> = isZh ? {
        'happy': `${intensity}开心`,
        'angry': `${intensity}生气`,
        'sad': `${intensity}悲伤`,
        'laughing': `${intensity}愉悦`,
        'surprised': `${intensity}惊讶`,
        'confused': `${intensity}困惑`,
        'fearful': `${intensity}恐惧`
      } : {
        'happy': `${intensity}happy`,
        'angry': `${intensity}angry`,
        'sad': `${intensity}sad`,
        'laughing': `${intensity}joyful`,
        'surprised': `${intensity}surprised`,
        'confused': `${intensity}confused`,
        'fearful': `${intensity}fearful`
      };
      
      return emotionMap[icon] || (isZh ? "中性" : "neutral");
    };

    subsetFrames.forEach((f, index) => {
      // 构建结构化的单镜头指令，明确分镜编号与脚本编号的对应关系
      const shotNumber = index + 1;
      const scNumber = `SC-${(f.number?.toString() || '00').padStart(2, '0')}`;
      let shotHeader = isZh ? 
        `== ${scNumber} / 脚本${shotNumber} ==\n` + 
        `[镜头${shotNumber}: 时长${'自动'}]` : 
        `== ${scNumber} / SCRIPT ${shotNumber} ==\n` + 
        `[SHOT ${shotNumber}: Duration ${'Auto'}]`;
      
      let contentDesc = isZh ? (f.descriptionZh || f.description) : f.description;
      
      // 初始化结构化指令组件
      let actionDirective = "";
      let speedDirective = "";
      let directionDirective = "";
      let emotionDirective = "";
      let cameraDirective = "";
      let dialogueDirective = "";
      let referenceDirective = "";
      
      // 分析每个符号并构建相应的指令
      f.symbols.forEach(symbol => {
        const icon = symbol.icon;
        const rotation = symbol.rotation;
        const x = symbol.x;
        const y = symbol.y;
        const width = symbol.width;
        const height = symbol.height;
        
        // 根据符号类别和图标处理
        switch (symbol.category) {
          case SymbolCategory.CAMERA:
            // 相机符号处理 - 明确告知Sora 2如何响应分镜图中的摄像机符号
            const cameraMap: Record<string, string> = {
              'zoom-in': isZh ? "放大" : "Zoom In",
              'zoom-out': isZh ? "缩小" : "Zoom Out",
              'pan-left': isZh ? "向左平移" : "Pan Left",
              'pan-right': isZh ? "向右平移" : "Pan Right",
              'tilt-up': isZh ? "向上倾斜" : "Tilt Up",
              'tilt-down': isZh ? "向下倾斜" : "Tilt Down",
              'tracking': isZh ? "跟拍" : "Tracking shot",
              'hitchcock': isZh ? "希区柯克变焦效果" : "Dolly zoom effect"
            };
            if (cameraMap[icon]) {
              cameraDirective = isZh ? 
                `[摄像机操作 - 严格按照分镜图执行]: ${cameraMap[icon]}` : 
                `[CAMERA OPERATION - Follow storyboard strictly]: ${cameraMap[icon]}`;
              // 添加符号描述
              if (symbol.description) {
                cameraDirective += ` (${symbol.description})`;
              }
            }
            break;
            
          case SymbolCategory.ACTION:
            // 动作符号处理 - 明确告知Sora 2如何响应分镜图中的动作符号
            const arrowPosition = getPositionDescription(x, y);
            
            if (icon.endsWith("-arrow")) {
              // 箭头符号处理
              const direction = detectArrowDirection(rotation);
              directionDirective = isZh ? 
                `[动作方向 - 严格按照分镜图箭头执行]: ${direction}` : 
                `[ACTION DIRECTION - Follow storyboard arrow strictly]: ${direction}`;
              
              // 根据箭头类型生成动作指令
              let actionType = isZh ? "移动" : "moves";
              if (icon === "jump-arrow") {
                actionType = isZh ? "以抛物线轨迹跳跃" : "jumps in a parabolic trajectory";
              } else if (icon === "rotate-arrow") {
                actionType = isZh ? "做圆周运动旋转" : "rotates in a circular motion";
              } else if (icon === "continuous-jump-arrow") {
                actionType = isZh ? "以波浪模式持续弹跳" : "bounces continuously in a wave pattern";
              }
              
              // 生成主体（这里简单使用"角色"，实际应用中可以根据分镜描述提取）
              const subject = isZh ? "角色" : "The character";
              actionDirective = isZh ? 
                `[动作指令 - 严格按照分镜图位置执行]: ${subject} 从 ${arrowPosition} 向 ${direction} ${actionType}` : 
                `[ACTION INSTRUCTION - Follow storyboard position strictly]: ${subject} ${actionType} from ${arrowPosition} towards ${direction} direction`;
              
              // 添加速度信息
              const speed = getSpeedLevel(width, height);
              speedDirective = isZh ? 
                `[动作速度 - 严格按照分镜图符号大小执行]: ${speed}` : 
                `[ACTION SPEED - Follow storyboard symbol size strictly]: ${speed}`;
            } else {
              // 其他动作符号
              const actionMap: Record<string, string> = {
                'move-fwd': isZh ? "向前移动" : "moves forward",
                'jump': isZh ? "跳跃" : "jumps",
                'turn': isZh ? "转身" : "turns",
                'fight': isZh ? "战斗" : "fights",
                'fall': isZh ? "跌倒" : "falls"
              };
              if (actionMap[icon]) {
                const subject = isZh ? "角色" : "The character";
                actionDirective = isZh ? 
                  `[动作指令 - 严格按照分镜图位置执行]: ${subject} ${actionMap[icon]}` : 
                  `[ACTION INSTRUCTION - Follow storyboard position strictly]: ${subject} ${actionMap[icon]}`;
                
                // 添加速度信息
                const speed = getSpeedLevel(width, height);
                speedDirective = isZh ? 
                  `[动作速度 - 严格按照分镜图符号大小执行]: ${speed}` : 
                  `[ACTION SPEED - Follow storyboard symbol size strictly]: ${speed}`;
              }
            }
            // 添加符号描述
            if (actionDirective && symbol.description) {
              actionDirective += ` (${symbol.description})`;
            }
            break;
            
          case SymbolCategory.DIALOGUE:
            // 对话符号处理 - 明确告知Sora 2如何处理分镜图中的对话
            if (icon === "speech-bubble" && symbol.text) {
              dialogueDirective = isZh ? 
                `[对话内容 - 严格按照分镜图文字执行]: "${symbol.text}"` : 
                `[DIALOGUE CONTENT - Follow storyboard text strictly]: "${symbol.text}"`;
              // 添加符号描述
              if (symbol.description) {
                dialogueDirective += ` (${symbol.description})`;
              }
            }
            break;
            
          case SymbolCategory.REFERENCE:
              // 参考符号处理 - 明确告知Sora 2如何使用参考图片
              if (config.referenceImage) {
                referenceDirective = isZh ? 
                  `[参考图片使用 - 严格保持外观一致性]: 使用提供的参考图片在 ${getPositionDescription(x, y)} 处生成主体，
                     确保在整个视频中保持一致的外观和特征` : 
                  `[REFERENCE IMAGE USAGE - Maintain consistent appearance strictly]: Use the provided reference image 
                     to generate the subject at ${getPositionDescription(x, y)}, ensuring consistent appearance 
                     and features throughout the video`;
              } else {
                referenceDirective = isZh ? 
                  `[参考元素 - 按照分镜图位置放置]: ${getPositionDescription(x, y)} 处的参考元素` : 
                  `[REFERENCE ELEMENT - Place according to storyboard position]: Reference element at ${getPositionDescription(x, y)}`;
              }
              // 添加符号描述
              if (symbol.description) {
                referenceDirective += ` (${symbol.description})`;
              }
              break;
              
            case SymbolCategory.EMOTION:
              // 表情符号处理 - 明确告知Sora 2如何表现情绪
              const emotion = getEmotionDescription(icon, width, height);
              emotionDirective = isZh ? 
                `[情绪表现 - 按照分镜图强度执行]: ${emotion}` : 
                `[EMOTION EXPRESSION - Follow storyboard intensity strictly]: ${emotion}`;
              // 添加符号描述
              if (symbol.description) {
                emotionDirective += ` (${symbol.description})`;
              }
              break;
        }
      });

      // 构建完整的镜头提示词，清晰区分图片信息和文字信息
      prompt += `${shotHeader}\n`;
      
      // 移除每个分镜中重复的分镜图信息说明，已在全局指令中统一说明
      
      // 视频提示词信息
      prompt += isZh ? 
        `[视频提示词]: ${contentDesc}\n` : 
        `[VIDEO PROMPT]: ${contentDesc}\n`;
      
      // 添加结构化指令，明确告知Sora 2如何执行 - 只有存在指令时才输出标题
      const hasDirectives = actionDirective || speedDirective || directionDirective || cameraDirective || 
                            dialogueDirective || emotionDirective || referenceDirective;
      if (hasDirectives) {
        const directives = [];
        if (actionDirective) directives.push(actionDirective);
        if (speedDirective) directives.push(speedDirective);
        if (directionDirective) directives.push(directionDirective);
        if (cameraDirective) directives.push(cameraDirective);
        if (dialogueDirective) directives.push(dialogueDirective);
        if (emotionDirective) directives.push(emotionDirective);
        if (referenceDirective) directives.push(referenceDirective);
        
        prompt += isZh ? `[执行指令]: ${directives.join('; ')}\n` : `[EXECUTION]: ${directives.join('; ')}\n`;
      }
      
      // 如果没有具体指令，添加默认执行要求
      if (!actionDirective && !speedDirective && !directionDirective && !cameraDirective && 
          !dialogueDirective && !emotionDirective && !referenceDirective) {
        prompt += isZh ? 
          `[默认执行]: 按分镜图和文字描述生成\n` : 
          `[DEFAULT]: Follow storyboard and text description\n`;
      }
      
      prompt += (isZh ? `\n---\n` : `\n---\n`);
    });

    return prompt;
  };

  const handleDownload = async (index: number) => {
    const mainContentElement = sheetRefs.current[index];
    if (!mainContentElement) return;
    
    try {
      // 临时移除最小高度限制
      const originalClassName = mainContentElement.className;
      mainContentElement.className = originalClassName.replace('min-h-[600px]', 'h-auto');
      
      // 等待DOM渲染
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 使用新的下载函数
      await downloadStoryboardSheet(
        mainContentElement as HTMLElement,
        `storyboard-sheet-${index + 1}.png`
      );
      
      // 恢复原始类名
      mainContentElement.className = originalClassName;
    } catch (err) {
      console.error("Export failed:", err);
      alert(err instanceof Error ? err.message : "下载失败，请重试");
      
      // 确保恢复类名
      const mainContentElement = sheetRefs.current[index];
      if (mainContentElement) {
        mainContentElement.className = mainContentElement.className.replace('h-auto', 'min-h-[600px]');
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
          <div className="absolute inset-0 flex items-center justify-center"><StepIndicator currentStep={WorkflowStep.EXPORT} lang={lang} onStepClick={setCurrentStep} /></div>
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{tr('previewSymbols')}:</span>
                            <button 
                                onClick={() => setShowSymbols(!showSymbols)} 
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${showSymbols ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {showSymbols ? tr('on') : tr('off')}
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
                                <div className="mb-2 p-1 border border-gray-300 bg-gray-50 rounded flex gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider items-center">
                                    {/* RED=REF Symbol - Horizontal Layout */}
                                    <div className="flex items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-dashed border-red-500 bg-red-50/50 rounded"></div>
                                        <span>RED=REF</span>
                                        <span className="text-xs font-normal text-gray-500">[AI: Visual ref]</span>
                                    </div>
                                    
                                    {/* BLUE=SHOT Symbol - Horizontal Layout */}
                                    <div className="flex items-center gap-1">
                                        <div className="w-5 h-5 border-2 border-blue-600 bg-white rounded"></div>
                                        <span>BLUE=SHOT</span>
                                        <span className="text-xs font-normal text-gray-500">[AI: Video shot]</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-stretch">
                                    {/* Reference Image Column */}
                                    {config.referenceImage && (
                                        <div className="w-1/5 flex-shrink-0 flex flex-col">
                                            <div className="border-4 border-dashed border-red-500 bg-white relative flex-1 flex items-center justify-center p-2">
                                                 <div className="absolute top-0 left-0 shadow-sm bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 z-10 tracking-widest uppercase rounded-br-sm flex items-center">REF SUBJECT</div>
                                                <img src={config.referenceImage} className="max-w-full max-h-full object-contain block" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid - Tight Spacing */}
                                    <div className="flex-1">
                                        {/* 根据分镜数量动态调整网格布局 */}
                                        <div className={`grid gap-3 ${getGridColumns(pageFrames.length)}`} style={{ alignItems: 'stretch' }}>
                                            {pageFrames.map((frame, frameIndex) => {
                                                const allSymbols = frame.symbols; 
                                                const overlaySymbols = frame.symbols.filter(s => s.category !== SymbolCategory.CAMERA);

                                                return (
                                                    <div key={frame.id} className="flex flex-col break-inside-avoid h-full">
                                                        {/* Frame Box */}
                                                        <div className="border-4 border-blue-600 bg-white relative flex flex-col h-full">
                                                            {/* Top Labels */}
                                                            <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 z-10 shadow-sm uppercase tracking-wider flex items-center justify-center rounded-br-sm">
                                                                SC-{frame.number.toString().padStart(2, '0')}
                                                            </div>

                                                            {/* Image Content Container - Fixed 16:9, complete display without cropping */}
                                                            <div className="relative bg-gray-100 overflow-hidden w-full aspect-video flex-shrink-0 flex items-center justify-center">
                                                                {frame.imageUrl ? (
                                                                    <img 
                                                                        src={frame.imageUrl} 
                                                                        className="w-full h-full object-contain block" 
                                                                        style={{ filter: 'grayscale(100%) contrast(120%)' }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">NO IMAGE</div>
                                                                )}

                                                                {/* OVERLAY SYMBOLS - REF符号始终显示，其他符号跟随showSymbols状态 */}
                                                                {overlaySymbols.map(sym => {
                                                                    // REF符号始终显示，其他符号跟随showSymbols状态
                                                                    const isRefSymbol = sym.category === SymbolCategory.REFERENCE;
                                                                    if (!isRefSymbol && !showSymbols) return null;
                                                                    
                                                                    return (
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
                                                                    );
                                                                })}
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
