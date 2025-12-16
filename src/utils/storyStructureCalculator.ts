/**
 * Story Structure Calculator
 * Calculates frame allocation across story stages (Setup, Build, Climax, Resolution)
 * and generates temporal information for each frame.
 */

export enum StoryStage {
  SETUP = 'setup',
  BUILD = 'build',
  CLIMAX = 'climax',
  RESOLUTION = 'resolution'
}

export interface StoryStructureConfig {
  totalFrames: number;
  totalDuration: number; // in seconds
  setupFrames: number;
  buildFrames: number;
  climaxFrames: number;
  resolutionFrames: number;
}

export interface FrameTimeInfo {
  frameIndex: number;
  storyStage: StoryStage;
  timeStart: number; // in seconds
  timeEnd: number; // in seconds
  progressionIndicator: string;
}

/**
 * Calculate story structure configuration based on frame count and duration
 * Default: 3 frames × 5 seconds = 15 seconds total
 * Stages: Setup (25%), Build (25%), Climax (25%), Resolution (25%)
 */
export function calculateStoryStructure(
  frameCount: number,
  duration?: number
): StoryStructureConfig {
  // Default to 15 seconds if not specified
  const totalDuration = duration || 15;

  // For less than 4 frames, allocate 1 to each stage as much as possible
  if (frameCount < 4) {
    const setupFrames = frameCount >= 1 ? 1 : 0;
    const buildFrames = frameCount >= 2 ? 1 : 0;
    const climaxFrames = frameCount >= 3 ? 1 : 0;
    const resolutionFrames = frameCount >= 4 ? 1 : 0;
    
    return {
      totalFrames: frameCount,
      totalDuration,
      setupFrames,
      buildFrames,
      climaxFrames,
      resolutionFrames
    };
  }

  // For 4 or more frames, distribute evenly
  const framesPerStage = Math.floor(frameCount / 4);
  const remainder = frameCount % 4;

  return {
    totalFrames: frameCount,
    totalDuration,
    setupFrames: framesPerStage + (remainder > 0 ? 1 : 0),
    buildFrames: framesPerStage + (remainder > 1 ? 1 : 0),
    climaxFrames: framesPerStage + (remainder > 2 ? 1 : 0),
    resolutionFrames: framesPerStage + (remainder > 3 ? 1 : 0)
  };
}

/**
 * Get story stage for a specific frame index
 */
export function getStoryStageForFrame(
  frameIndex: number,
  config: StoryStructureConfig
): StoryStage {
  const setupEnd = config.setupFrames;
  const buildEnd = setupEnd + config.buildFrames;
  const climaxEnd = buildEnd + config.climaxFrames;

  if (frameIndex < setupEnd) return StoryStage.SETUP;
  if (frameIndex < buildEnd) return StoryStage.BUILD;
  if (frameIndex < climaxEnd) return StoryStage.CLIMAX;
  return StoryStage.RESOLUTION;
}

/**
 * Calculate time information for each frame
 */
export function calculateFrameTimeInfo(
  frameIndex: number,
  config: StoryStructureConfig
): FrameTimeInfo {
  const storyStage = getStoryStageForFrame(frameIndex, config);
  const timePerFrame = config.totalDuration / config.totalFrames;
  const timeStart = frameIndex * timePerFrame;
  const timeEnd = (frameIndex + 1) * timePerFrame;

  // Generate progression indicator based on story stage
  const progressionIndicators: Record<StoryStage, string[]> = {
    [StoryStage.SETUP]: ['introduce', 'establish', 'begin', 'start'],
    [StoryStage.BUILD]: ['develop', 'escalate', 'intensify', 'continue'],
    [StoryStage.CLIMAX]: ['peak', 'accelerate', 'climax', 'turn'],
    [StoryStage.RESOLUTION]: ['conclude', 'resolve', 'end', 'finish']
  };

  // Select progression indicator based on frame position within stage
  const stageIndicators = progressionIndicators[storyStage];
  const stageFrameIndex = getFrameIndexWithinStage(frameIndex, config);
  const stageFrameCount = getFrameCountForStage(storyStage, config);
  const indicatorIndex = Math.floor((stageFrameIndex / stageFrameCount) * stageIndicators.length);
  const progressionIndicator = stageIndicators[Math.min(indicatorIndex, stageIndicators.length - 1)];

  return {
    frameIndex,
    storyStage,
    timeStart: Math.round(timeStart * 100) / 100,
    timeEnd: Math.round(timeEnd * 100) / 100,
    progressionIndicator
  };
}

/**
 * Get frame index within its story stage
 */
function getFrameIndexWithinStage(frameIndex: number, config: StoryStructureConfig): number {
  const setupEnd = config.setupFrames;
  const buildEnd = setupEnd + config.buildFrames;
  const climaxEnd = buildEnd + config.climaxFrames;

  if (frameIndex < setupEnd) return frameIndex;
  if (frameIndex < buildEnd) return frameIndex - setupEnd;
  if (frameIndex < climaxEnd) return frameIndex - buildEnd;
  return frameIndex - climaxEnd;
}

/**
 * Get frame count for a specific story stage
 */
function getFrameCountForStage(stage: StoryStage, config: StoryStructureConfig): number {
  switch (stage) {
    case StoryStage.SETUP:
      return config.setupFrames;
    case StoryStage.BUILD:
      return config.buildFrames;
    case StoryStage.CLIMAX:
      return config.climaxFrames;
    case StoryStage.RESOLUTION:
      return config.resolutionFrames;
  }
}

/**
 * Get all frame time info for a complete story
 */
export function getAllFrameTimeInfo(config: StoryStructureConfig): FrameTimeInfo[] {
  const frameTimeInfos: FrameTimeInfo[] = [];
  for (let i = 0; i < config.totalFrames; i++) {
    frameTimeInfos.push(calculateFrameTimeInfo(i, config));
  }
  return frameTimeInfos;
}

/**
 * Validate story structure configuration
 */
export function validateStoryStructure(config: StoryStructureConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.totalFrames < 1) {
    errors.push('Total frames must be at least 1');
  }

  if (config.totalDuration <= 0) {
    errors.push('Total duration must be greater than 0');
  }

  const totalAllocated = config.setupFrames + config.buildFrames + config.climaxFrames + config.resolutionFrames;
  if (totalAllocated !== config.totalFrames) {
    errors.push(`Frame allocation mismatch: allocated ${totalAllocated}, expected ${config.totalFrames}`);
  }

  // For frameCount >= 4, each stage must have at least 1 frame
  if (config.totalFrames >= 4) {
    if (config.setupFrames < 1 || config.buildFrames < 1 || config.climaxFrames < 1 || config.resolutionFrames < 1) {
      errors.push('Each story stage must have at least 1 frame');
    }
  }

  // All stages must be >= 0
  if (config.setupFrames < 0 || config.buildFrames < 0 || config.climaxFrames < 0 || config.resolutionFrames < 0) {
    errors.push('All story stages must have >= 0 frames');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
