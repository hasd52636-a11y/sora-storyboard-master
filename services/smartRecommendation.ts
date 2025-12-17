import { STYLES } from '../types';

/**
 * 智能推荐系统
 * 根据用户输入的脚本内容，自动推荐最合适的视觉风格和参数
 */

// 关键词映射表
const STYLE_KEYWORDS = {
  scifi: ['科幻', '未来', '太空', '机器人', '赛博', '科技', '星际', 'AI', '人工智能'],
  cyberpunk: ['赛博朋克', '霓虹', '黑客', '反乌托邦', '电子', '数字'],
  ink: ['水墨', '国风', '古风', '山水', '诗意', '禅意', '中国风', '传统'],
  anime: ['动漫', '二次元', '日系', '漫画', '卡通', '萌'],
  noir: ['黑白', '悬疑', '侦探', '犯罪', '黑色电影', '阴影'],
  sketch: ['简约', '素描', '线条', '极简', '草图'],
  clay: ['粘土', '定格', '手工', '可爱', '儿童'],
  lego: ['乐高', '积木', '像素', '方块'],
  steampunk: ['蒸汽朋克', '维多利亚', '齿轮', '机械', '复古'],
  vangogh: ['梵高', '油画', '印象派', '艺术', '抽象']
};

/**
 * 根据脚本内容推荐视觉风格
 */
export const recommendStyle = (script: string): string => {
  if (!script || script.trim().length === 0) {
    return 'sketch'; // 默认极简素描
  }

  const lowerScript = script.toLowerCase();
  let maxScore = 0;
  let recommendedStyle = 'sketch';

  // 计算每种风格的匹配分数
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerScript.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      recommendedStyle = style;
    }
  }

  return recommendedStyle;
};

/**
 * 根据脚本长度推荐分镜数量
 */
export const recommendFrameCount = (script: string): number => {
  if (!script || script.trim().length === 0) {
    return 4; // 默认4个分镜
  }

  const length = script.trim().length;
  
  // 根据字数推荐分镜数量
  if (length < 50) return 2;
  if (length < 100) return 3;
  if (length < 200) return 4;
  if (length < 400) return 6;
  if (length < 600) return 8;
  return 10;
};

/**
 * 分析脚本复杂度
 */
export const analyzeScriptComplexity = (script: string): 'simple' | 'medium' | 'complex' => {
  if (!script || script.trim().length === 0) {
    return 'simple';
  }

  const length = script.trim().length;
  const sentences = script.split(/[。！？.!?]/).filter(s => s.trim().length > 0).length;
  const avgSentenceLength = length / Math.max(sentences, 1);

  if (length < 100 || avgSentenceLength < 20) {
    return 'simple';
  } else if (length < 300 || avgSentenceLength < 40) {
    return 'medium';
  } else {
    return 'complex';
  }
};

/**
 * 生成智能推荐摘要
 */
export const generateRecommendationSummary = (script: string) => {
  const style = recommendStyle(script);
  const frameCount = recommendFrameCount(script);
  const complexity = analyzeScriptComplexity(script);
  
  // 找到对应的风格对象
  const styleObj = STYLES.find(s => s.name.toLowerCase() === style.toLowerCase()) || STYLES[0];
  
  return {
    style: styleObj,
    frameCount,
    complexity,
    reasoning: {
      style: getStyleReasoning(script, style),
      frameCount: getFrameCountReasoning(script, frameCount),
      complexity: getComplexityReasoning(complexity)
    }
  };
};

/**
 * 获取风格推荐理由
 */
const getStyleReasoning = (script: string, style: string): string => {
  const keywords = STYLE_KEYWORDS[style as keyof typeof STYLE_KEYWORDS] || [];
  const matchedKeywords = keywords.filter(k => 
    script.toLowerCase().includes(k.toLowerCase())
  );

  if (matchedKeywords.length > 0) {
    return `检测到关键词：${matchedKeywords.slice(0, 3).join('、')}`;
  }
  
  return '基于内容分析推荐';
};

/**
 * 获取分镜数量推荐理由
 */
const getFrameCountReasoning = (script: string, frameCount: number): string => {
  const length = script.trim().length;
  return `根据脚本长度（${length}字）推荐${frameCount}个分镜`;
};

/**
 * 获取复杂度分析理由
 */
const getComplexityReasoning = (complexity: string): string => {
  const reasons = {
    simple: '脚本简洁明了，适合快速生成',
    medium: '脚本内容适中，建议使用标准配置',
    complex: '脚本内容丰富，建议增加分镜数量以充分展现'
  };
  return reasons[complexity as keyof typeof reasons] || '';
};

/**
 * 根据历史使用记录优化推荐
 */
export const optimizeWithHistory = (
  recommendation: ReturnType<typeof generateRecommendationSummary>,
  userHistory?: {
    preferredStyle?: string;
    avgFrameCount?: number;
  }
) => {
  if (!userHistory) return recommendation;

  // 如果用户有明显的风格偏好，适当调整推荐
  if (userHistory.preferredStyle) {
    const preferredStyleObj = STYLES.find(
      s => s.name.toLowerCase() === userHistory.preferredStyle?.toLowerCase()
    );
    if (preferredStyleObj) {
      recommendation.reasoning.style += ` (根据你的使用习惯调整)`;
    }
  }

  // 如果用户习惯使用特定的分镜数量，适当调整
  if (userHistory.avgFrameCount) {
    const diff = Math.abs(recommendation.frameCount - userHistory.avgFrameCount);
    if (diff > 2) {
      recommendation.reasoning.frameCount += ` (你通常使用${userHistory.avgFrameCount}个分镜)`;
    }
  }

  return recommendation;
};

/**
 * 保存用户偏好到本地存储
 */
export const saveUserPreference = (style: string, frameCount: number) => {
  try {
    const history = getUserHistory();
    history.usageCount = (history.usageCount || 0) + 1;
    history.styles = history.styles || {};
    history.styles[style] = (history.styles[style] || 0) + 1;
    history.frameCounts = history.frameCounts || [];
    history.frameCounts.push(frameCount);
    
    // 只保留最近20次记录
    if (history.frameCounts.length > 20) {
      history.frameCounts = history.frameCounts.slice(-20);
    }
    
    localStorage.setItem('userPreferences', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save user preference:', error);
  }
};

/**
 * 获取用户历史偏好
 */
export const getUserHistory = () => {
  try {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      const history = JSON.parse(stored);
      
      // 计算最常用的风格
      if (history.styles) {
        const sortedStyles = Object.entries(history.styles)
          .sort(([, a], [, b]) => (b as number) - (a as number));
        history.preferredStyle = sortedStyles[0]?.[0];
      }
      
      // 计算平均分镜数量
      if (history.frameCounts && history.frameCounts.length > 0) {
        const sum = history.frameCounts.reduce((a: number, b: number) => a + b, 0);
        history.avgFrameCount = Math.round(sum / history.frameCounts.length);
      }
      
      return history;
    }
  } catch (error) {
    console.error('Failed to load user history:', error);
  }
  
  return {
    usageCount: 0,
    styles: {},
    frameCounts: []
  };
};
