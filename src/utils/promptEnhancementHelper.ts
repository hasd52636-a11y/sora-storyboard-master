/**
 * Prompt Enhancement Helper
 * Provides utilities to enhance LLM prompts with story structure guidelines
 */

import { generateCompleteStoryGuidelines } from './promptEnhancer';

/**
 * Enhance a base prompt with story structure guidelines
 * This ensures the LLM understands the story structure requirements
 */
export function enhancePromptWithStoryGuidelines(
  basePrompt: string,
  language: 'en' | 'zh' = 'en'
): string {
  const guidelines = generateCompleteStoryGuidelines(language);
  
  // Insert guidelines after the initial role description but before project settings
  const lines = basePrompt.split('\n');
  
  // Find the line with [PROJECT SETTINGS] or [DIRECTORIAL GUIDELINES]
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('[PROJECT SETTINGS]') || lines[i].includes('[DIRECTORIAL GUIDELINES]')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    // If no section found, append at the end before [OUTPUT CONSTRAINTS]
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('[OUTPUT CONSTRAINTS]')) {
        insertIndex = i;
        break;
      }
    }
  }
  
  if (insertIndex === -1) {
    // If still not found, just prepend after the first few lines
    insertIndex = Math.min(5, lines.length);
  }
  
  // Insert the guidelines
  lines.splice(insertIndex, 0, '', guidelines, '');
  
  return lines.join('\n');
}

/**
 * Add temporal information requirement to prompt
 */
export function addTemporalRequirement(
  prompt: string,
  frameCount: number,
  totalDuration: number,
  language: 'en' | 'zh' = 'en'
): string {
  const timePerFrame = totalDuration / frameCount;
  const isZh = language === 'zh';
  
  const temporalRequirement = isZh
    ? `\n[时间信息要求]\n每个分镜必须包含时间段信息（例如"0-${timePerFrame.toFixed(1)}秒"），确保时间连续性和进展清晰。`
    : `\n[TEMPORAL INFORMATION REQUIREMENT]\nEach frame MUST include time interval information (e.g., "0-${timePerFrame.toFixed(1)}s"), ensuring temporal continuity and clear progression.`;
  
  // Find a good place to insert this requirement
  const lines = prompt.split('\n');
  let insertIndex = -1;
  
  // Look for [OUTPUT CONSTRAINTS] or [JSON SCHEMA]
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('[OUTPUT CONSTRAINTS]') || lines[i].includes('[JSON SCHEMA]')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    insertIndex = lines.length;
  }
  
  lines.splice(insertIndex, 0, temporalRequirement);
  
  return lines.join('\n');
}

/**
 * Add progression indicator requirement to prompt
 */
export function addProgressionRequirement(
  prompt: string,
  language: 'en' | 'zh' = 'en'
): string {
  const isZh = language === 'zh';
  
  const progressionRequirement = isZh
    ? `\n[进展指示要求]\n每个分镜的描述中必须包含进展指示词（如"介绍"、"发展"、"加强"、"高潮"、"结束"），明确表示该分镜在故事中的位置和作用。`
    : `\n[PROGRESSION INDICATOR REQUIREMENT]\nEach frame's description MUST include a progression indicator (e.g., "introduce", "develop", "intensify", "climax", "conclude"), clearly indicating the frame's position and role in the story.`;
  
  // Find a good place to insert this requirement
  const lines = prompt.split('\n');
  let insertIndex = -1;
  
  // Look for [OUTPUT CONSTRAINTS] or [JSON SCHEMA]
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('[OUTPUT CONSTRAINTS]') || lines[i].includes('[JSON SCHEMA]')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    insertIndex = lines.length;
  }
  
  lines.splice(insertIndex, 0, progressionRequirement);
  
  return lines.join('\n');
}

/**
 * Enhance prompt with all story structure requirements
 */
export function enhancePromptCompletely(
  basePrompt: string,
  frameCount: number,
  totalDuration: number,
  language: 'en' | 'zh' = 'en'
): string {
  let enhancedPrompt = basePrompt;
  
  // Add story structure guidelines
  enhancedPrompt = enhancePromptWithStoryGuidelines(enhancedPrompt, language);
  
  // Add temporal information requirement
  enhancedPrompt = addTemporalRequirement(enhancedPrompt, frameCount, totalDuration, language);
  
  // Add progression indicator requirement
  enhancedPrompt = addProgressionRequirement(enhancedPrompt, language);
  
  return enhancedPrompt;
}

/**
 * Verify that a prompt contains all required story structure elements
 */
export function verifyPromptHasStoryStructureElements(prompt: string): {
  hasGuideline7: boolean;
  hasGuideline8: boolean;
  hasTemporalInfo: boolean;
  hasProgressionInfo: boolean;
  isComplete: boolean;
} {
  const hasGuideline7 = prompt.includes('Story Structure') || prompt.includes('故事结构');
  const hasGuideline8 = prompt.includes('Scene Progression') || prompt.includes('场景进展');
  const hasTemporalInfo = prompt.includes('time interval') || prompt.includes('时间段') || prompt.includes('seconds') || prompt.includes('秒');
  const hasProgressionInfo = prompt.includes('progression indicator') || prompt.includes('进展指示') || prompt.includes('introduce') || prompt.includes('介绍');
  
  return {
    hasGuideline7,
    hasGuideline8,
    hasTemporalInfo,
    hasProgressionInfo,
    isComplete: hasGuideline7 && hasGuideline8 && hasTemporalInfo && hasProgressionInfo
  };
}
