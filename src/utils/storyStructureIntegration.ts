/**
 * Story Structure Integration
 * Integrates story structure calculation and prompt enhancement into the script generation pipeline
 */

import { StoryboardFrame } from '../../types';
import {
  calculateStoryStructure,
  calculateFrameTimeInfo,
  getAllFrameTimeInfo,
  StoryStructureConfig
} from './storyStructureCalculator';
import {
  enhanceDescription,
  enhanceVisualPrompt,
  generateCompleteStoryGuidelines
} from './promptEnhancer';

/**
 * Enhance generated frames with story structure information
 * This function takes raw generated frames and adds story structure metadata
 */
export function enhanceFramesWithStoryStructure(
  frames: Partial<StoryboardFrame>[],
  totalDuration: number,
  language: 'en' | 'zh' = 'en'
): Partial<StoryboardFrame>[] {
  if (!frames || frames.length === 0) {
    return frames;
  }

  // Calculate story structure for the frame count
  const config = calculateStoryStructure(frames.length, totalDuration);
  const frameTimeInfos = getAllFrameTimeInfo(config);

  // Enhance each frame with story structure information
  return frames.map((frame, index) => {
    if (!frameTimeInfos[index]) {
      return frame;
    }

    const timeInfo = frameTimeInfos[index];

    return {
      ...frame,
      storyStage: timeInfo.storyStage,
      timeStart: timeInfo.timeStart,
      timeEnd: timeInfo.timeEnd,
      progressionIndicator: timeInfo.progressionIndicator,
      // Enhance descriptions with temporal and progression information
      description: frame.description
        ? enhanceDescription(frame.description, timeInfo, 'en')
        : frame.description,
      descriptionZh: frame.descriptionZh
        ? enhanceDescription(frame.descriptionZh, timeInfo, 'zh')
        : frame.descriptionZh,
      // Enhance visual prompts with temporal information
      visualPrompt: frame.visualPrompt
        ? enhanceVisualPrompt(frame.visualPrompt, timeInfo, 'en')
        : frame.visualPrompt,
      visualPromptZh: frame.visualPromptZh
        ? enhanceVisualPrompt(frame.visualPromptZh, timeInfo, 'zh')
        : frame.visualPromptZh
    };
  });
}

/**
 * Generate story structure guidelines to prepend to prompts
 * This ensures AI understands the story structure requirements
 */
export function generateStoryStructurePromptPrefix(language: 'en' | 'zh' = 'en'): string {
  return generateCompleteStoryGuidelines(language);
}

/**
 * Get story structure configuration for a given frame count and duration
 */
export function getStoryStructureConfig(
  frameCount: number,
  totalDuration: number
): StoryStructureConfig {
  return calculateStoryStructure(frameCount, totalDuration);
}

/**
 * Format story structure information for display
 */
export function formatStoryStructureInfo(
  frameCount: number,
  totalDuration: number,
  language: 'en' | 'zh' = 'en'
): string {
  const config = calculateStoryStructure(frameCount, totalDuration);
  const isZh = language === 'zh';

  if (isZh) {
    return `故事结构分配：
- 铺垫 (Setup): ${config.setupFrames} 分镜
- 发展 (Build): ${config.buildFrames} 分镜
- 高潮 (Climax): ${config.climaxFrames} 分镜
- 结局 (Resolution): ${config.resolutionFrames} 分镜
总时长: ${totalDuration} 秒`;
  } else {
    return `Story Structure Allocation:
- Setup: ${config.setupFrames} frames
- Build: ${config.buildFrames} frames
- Climax: ${config.climaxFrames} frames
- Resolution: ${config.resolutionFrames} frames
Total Duration: ${totalDuration} seconds`;
  }
}

/**
 * Validate that frames have proper story structure information
 */
export function validateFramesHaveStoryStructure(frames: Partial<StoryboardFrame>[]): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  frames.forEach((frame, index) => {
    if (!frame.storyStage) {
      missingFields.push(`Frame ${index}: missing storyStage`);
    }
    if (frame.timeStart === undefined) {
      missingFields.push(`Frame ${index}: missing timeStart`);
    }
    if (frame.timeEnd === undefined) {
      missingFields.push(`Frame ${index}: missing timeEnd`);
    }
    if (!frame.progressionIndicator) {
      missingFields.push(`Frame ${index}: missing progressionIndicator`);
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}
