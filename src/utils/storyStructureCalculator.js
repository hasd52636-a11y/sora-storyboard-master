/**
 * Story Structure Calculator
 * Calculates frame allocation across story stages (Setup, Build, Climax, Resolution)
 * and generates temporal information for each frame.
 */
export var StoryStage;
(function (StoryStage) {
    StoryStage["SETUP"] = "setup";
    StoryStage["BUILD"] = "build";
    StoryStage["CLIMAX"] = "climax";
    StoryStage["RESOLUTION"] = "resolution";
})(StoryStage || (StoryStage = {}));
/**
 * Calculate story structure configuration based on frame count and duration
 * Default: 3 frames × 5 seconds = 15 seconds total
 * Stages: Setup (25%), Build (25%), Climax (25%), Resolution (25%)
 */
export function calculateStoryStructure(frameCount, duration) {
    // Default to 15 seconds if not specified
    const totalDuration = duration || 15;
    // Ensure at least 1 frame per stage
    const framesPerStage = Math.max(1, Math.floor(frameCount / 4));
    const remainder = frameCount % 4;
    // Distribute frames: Setup, Build, Climax, Resolution
    const setupFrames = framesPerStage + (remainder > 0 ? 1 : 0);
    const buildFrames = framesPerStage + (remainder > 1 ? 1 : 0);
    const climaxFrames = framesPerStage + (remainder > 2 ? 1 : 0);
    const resolutionFrames = framesPerStage;
    return {
        totalFrames: frameCount,
        totalDuration,
        setupFrames,
        buildFrames,
        climaxFrames,
        resolutionFrames
    };
}
/**
 * Get story stage for a specific frame index
 */
export function getStoryStageForFrame(frameIndex, config) {
    const setupEnd = config.setupFrames;
    const buildEnd = setupEnd + config.buildFrames;
    const climaxEnd = buildEnd + config.climaxFrames;
    if (frameIndex < setupEnd)
        return StoryStage.SETUP;
    if (frameIndex < buildEnd)
        return StoryStage.BUILD;
    if (frameIndex < climaxEnd)
        return StoryStage.CLIMAX;
    return StoryStage.RESOLUTION;
}
/**
 * Calculate time information for each frame
 */
export function calculateFrameTimeInfo(frameIndex, config) {
    const storyStage = getStoryStageForFrame(frameIndex, config);
    const timePerFrame = config.totalDuration / config.totalFrames;
    const timeStart = frameIndex * timePerFrame;
    const timeEnd = (frameIndex + 1) * timePerFrame;
    // Generate progression indicator based on story stage
    const progressionIndicators = {
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
function getFrameIndexWithinStage(frameIndex, config) {
    const setupEnd = config.setupFrames;
    const buildEnd = setupEnd + config.buildFrames;
    const climaxEnd = buildEnd + config.climaxFrames;
    if (frameIndex < setupEnd)
        return frameIndex;
    if (frameIndex < buildEnd)
        return frameIndex - setupEnd;
    if (frameIndex < climaxEnd)
        return frameIndex - buildEnd;
    return frameIndex - climaxEnd;
}
/**
 * Get frame count for a specific story stage
 */
function getFrameCountForStage(stage, config) {
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
export function getAllFrameTimeInfo(config) {
    const frameTimeInfos = [];
    for (let i = 0; i < config.totalFrames; i++) {
        frameTimeInfos.push(calculateFrameTimeInfo(i, config));
    }
    return frameTimeInfos;
}
/**
 * Validate story structure configuration
 */
export function validateStoryStructure(config) {
    const errors = [];
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
    if (config.setupFrames < 1 || config.buildFrames < 1 || config.climaxFrames < 1 || config.resolutionFrames < 1) {
        errors.push('Each story stage must have at least 1 frame');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
