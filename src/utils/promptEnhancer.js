/**
 * Prompt Enhancer
 * Enhances visual prompts and descriptions with story structure guidelines
 * and temporal information for better AI video generation.
 */
import { StoryStage } from './storyStructureCalculator';
/**
 * Story stage descriptions for guidelines
 */
const STORY_STAGE_DESCRIPTIONS = {
    [StoryStage.SETUP]: {
        en: 'SETUP: Introduce characters, setting, and establish the initial situation',
        zh: '铺垫：介绍角色、场景，建立初始情境'
    },
    [StoryStage.BUILD]: {
        en: 'BUILD: Develop conflict, escalate tension, and advance the plot',
        zh: '发展：发展冲突、升级紧张感、推进情节'
    },
    [StoryStage.CLIMAX]: {
        en: 'CLIMAX: Reach the peak of action/emotion, deliver the turning point',
        zh: '高潮：达到动作/情感的高峰，呈现转折点'
    },
    [StoryStage.RESOLUTION]: {
        en: 'RESOLUTION: Conclude the story, resolve conflicts, and provide closure',
        zh: '结局：结束故事、解决冲突、提供结局'
    }
};
/**
 * Progression indicators for each story stage
 */
const PROGRESSION_INDICATORS = {
    [StoryStage.SETUP]: {
        en: ['introduce', 'establish', 'begin', 'start', 'open'],
        zh: ['介绍', '建立', '开始', '启动', '打开']
    },
    [StoryStage.BUILD]: {
        en: ['develop', 'escalate', 'intensify', 'continue', 'advance'],
        zh: ['发展', '升级', '加强', '继续', '推进']
    },
    [StoryStage.CLIMAX]: {
        en: ['peak', 'accelerate', 'climax', 'turn', 'surge'],
        zh: ['高峰', '加速', '高潮', '转折', '激增']
    },
    [StoryStage.RESOLUTION]: {
        en: ['conclude', 'resolve', 'end', 'finish', 'close'],
        zh: ['结束', '解决', '完成', '收尾', '关闭']
    }
};
/**
 * Enhance visual prompt with story structure and temporal information
 */
export function enhanceVisualPrompt(originalPrompt, frameTimeInfo, language = 'en') {
    if (!originalPrompt || originalPrompt.trim().length === 0) {
        return originalPrompt;
    }
    const isZh = language === 'zh';
    const stageDesc = STORY_STAGE_DESCRIPTIONS[frameTimeInfo.storyStage];
    const timeStr = isZh
        ? `${frameTimeInfo.timeStart.toFixed(1)}-${frameTimeInfo.timeEnd.toFixed(1)}秒`
        : `${frameTimeInfo.timeStart.toFixed(1)}-${frameTimeInfo.timeEnd.toFixed(1)}s`;
    // Build enhanced prompt with temporal and story structure information
    let enhancedPrompt = originalPrompt;
    // Add temporal information
    const temporalPrefix = isZh
        ? `[时间段: ${timeStr}] `
        : `[Time: ${timeStr}] `;
    enhancedPrompt = temporalPrefix + enhancedPrompt;
    // Add story stage context
    const stagePrefix = isZh
        ? `[${stageDesc.zh}] `
        : `[${stageDesc.en}] `;
    enhancedPrompt = stagePrefix + enhancedPrompt;
    return enhancedPrompt;
}
/**
 * Enhance description with story structure and temporal information
 */
export function enhanceDescription(originalDescription, frameTimeInfo, language = 'en') {
    if (!originalDescription || originalDescription.trim().length === 0) {
        return originalDescription;
    }
    const isZh = language === 'zh';
    const stageDesc = STORY_STAGE_DESCRIPTIONS[frameTimeInfo.storyStage];
    const timeStr = isZh
        ? `${frameTimeInfo.timeStart.toFixed(1)}-${frameTimeInfo.timeEnd.toFixed(1)}秒`
        : `${frameTimeInfo.timeStart.toFixed(1)}-${frameTimeInfo.timeEnd.toFixed(1)}s`;
    const progressionIndicator = isZh
        ? PROGRESSION_INDICATORS[frameTimeInfo.storyStage].zh[0]
        : PROGRESSION_INDICATORS[frameTimeInfo.storyStage].en[0];
    // Build enhanced description with temporal and progression information
    let enhancedDescription = originalDescription;
    // Add temporal information
    const temporalPrefix = isZh
        ? `[时间段: ${timeStr}] `
        : `[Time: ${timeStr}] `;
    enhancedDescription = temporalPrefix + enhancedDescription;
    // Add progression indicator
    const progressionPrefix = isZh
        ? `[进展: ${progressionIndicator}] `
        : `[Progression: ${progressionIndicator}] `;
    enhancedDescription = progressionPrefix + enhancedDescription;
    return enhancedDescription;
}
/**
 * Generate Guideline #7: Story Structure
 */
export function generateStoryStructureGuideline(language = 'en') {
    const isZh = language === 'zh';
    if (isZh) {
        return `[指导原则 #7: 故事结构 (必须)]
故事必须遵循以下四个阶段的结构：
1. 铺垫 (Setup): 介绍角色、场景，建立初始情境
2. 发展 (Build): 发展冲突、升级紧张感、推进情节
3. 高潮 (Climax): 达到动作/情感的高峰，呈现转折点
4. 结局 (Resolution): 结束故事、解决冲突、提供结局
每个分镜必须清晰属于其中一个阶段，并按照该阶段的目的生成内容。`;
    }
    else {
        return `[Guideline #7: Story Structure (MANDATORY)]
The story MUST follow a four-stage structure:
1. SETUP: Introduce characters, setting, and establish the initial situation
2. BUILD: Develop conflict, escalate tension, and advance the plot
3. CLIMAX: Reach the peak of action/emotion, deliver the turning point
4. RESOLUTION: Conclude the story, resolve conflicts, and provide closure
Each frame MUST clearly belong to one stage and generate content according to that stage's purpose.`;
    }
}
/**
 * Generate Guideline #8: Scene Progression
 */
export function generateSceneProgressionGuideline(language = 'en') {
    const isZh = language === 'zh';
    if (isZh) {
        return `[指导原则 #8: 场景进展 (必须)]
场景进展必须满足以下要求：
1. 相邻分镜之间必须有清晰的逻辑连接
2. 严格禁止重复相同的场景或动作
3. 必须确保时间和空间的连续性
4. 每个分镜必须推进故事向前发展
5. 不允许倒退或循环的场景
场景必须按照时间顺序线性进展，每个新分镜都应该是故事的自然延续。`;
    }
    else {
        return `[Guideline #8: Scene Progression (MANDATORY)]
Scene progression MUST satisfy the following requirements:
1. Adjacent frames MUST have clear logical connections
2. STRICTLY FORBID repetition of the same scenes or actions
3. MUST ensure temporal and spatial continuity
4. Each frame MUST advance the story forward
5. NO backward or circular scenes allowed
Scenes MUST progress linearly in time, with each new frame being a natural continuation of the story.`;
    }
}
/**
 * Generate complete story structure guidelines for a prompt
 */
export function generateCompleteStoryGuidelines(language = 'en') {
    const guideline7 = generateStoryStructureGuideline(language);
    const guideline8 = generateSceneProgressionGuideline(language);
    return `${guideline7}\n\n${guideline8}`;
}
/**
 * Enhance a complete prompt with story structure guidelines
 */
export function enhanceCompletePrompt(originalPrompt, frameTimeInfo, includeGuidelines = true, language = 'en') {
    let enhancedPrompt = originalPrompt;
    // Add story structure guidelines if requested
    if (includeGuidelines) {
        const guidelines = generateCompleteStoryGuidelines(language);
        enhancedPrompt = `${guidelines}\n\n${enhancedPrompt}`;
    }
    // Add temporal and story stage information
    enhancedPrompt = enhanceDescription(enhancedPrompt, frameTimeInfo, language);
    return enhancedPrompt;
}
/**
 * Validate that a prompt doesn't contain repetitive language
 */
export function validateNoRepetition(prompt) {
    const warnings = [];
    // Split prompt into sentences
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    // Check for repeated phrases
    const phrases = new Map();
    sentences.forEach(sentence => {
        const normalized = sentence.trim().toLowerCase();
        phrases.set(normalized, (phrases.get(normalized) || 0) + 1);
    });
    // Warn about repeated sentences
    phrases.forEach((count, phrase) => {
        if (count > 1) {
            warnings.push(`Repeated phrase detected ${count} times: "${phrase.substring(0, 50)}..."`);
        }
    });
    // Check for common repetitive patterns
    const repetitivePatterns = [
        /\b(\w+)\s+\1\b/gi, // word word
        /\b(the|a|an)\s+\1\b/gi, // article repetition
    ];
    repetitivePatterns.forEach(pattern => {
        const matches = prompt.match(pattern);
        if (matches) {
            warnings.push(`Potential repetition detected: ${matches[0]}`);
        }
    });
    return {
        valid: warnings.length === 0,
        warnings
    };
}
