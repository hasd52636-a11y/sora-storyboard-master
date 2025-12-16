# Design Document - Story Structure Enhancement

## Overview

This document describes the design for enhancing story structure and narrative progression in the Storyboard Master application. The main improvements are:
1. Implementing standard story structure (Setup → Build → Climax → Resolution)
2. Ensuring scene progression coherence without repetition
3. Adding temporal details and progression information
4. Optimizing prompt generation with explicit story structure guidelines
5. Supporting user customization of story structure allocation

## Architecture

### Current Issues

**Script Generation:**
- Generated scripts lack clear narrative arc
- No explicit story structure guidance in prompts
- Scenes may repeat or lack logical progression
- No temporal details or time intervals specified
- Prompts are generic without story structure context

**Prompt Generation:**
- Missing Guideline #7 (Story Structure) with Setup/Build/Climax/Resolution beats
- Missing Guideline #8 (Scene Progression) requiring clear progression with NO REPETITION
- No temporal information in visual and description fields
- No indication of which story stage each frame belongs to

### Solution Architecture

**Story Structure Module:**
- Analyze user input for frame count and duration
- Calculate default allocation: 3 frames × 5 seconds each = 15 seconds total
- Distribute frames across four story stages:
  - Setup: 25% of frames (introduce characters/setting)
  - Build: 25% of frames (develop conflict/tension)
  - Climax: 25% of frames (peak action/emotion)
  - Resolution: 25% of frames (conclude/resolve)
- Allow user override of default allocation

**Prompt Enhancement:**
- Add Guideline #7: Story Structure (MANDATORY)
  - Explicitly state Setup/Build/Climax/Resolution beats
  - Specify which stage each frame belongs to
  - Define the purpose of each stage
- Add Guideline #8: Scene Progression
  - Require clear progression between scenes
  - Explicitly forbid repetition
  - Specify temporal progression (e.g., "0-5 seconds", "5-10 seconds")
  - Include progression indicators (e.g., "continue", "accelerate", "turn")

**Temporal Information:**
- Calculate time allocation per frame based on total duration
- Add time intervals to each frame (e.g., "Frame 1: 0-5 seconds")
- Include progression indicators in descriptions
- Show temporal context in visual prompts

## Components and Interfaces

### StoryStructureCalculator
- Input: frame count, total duration, user preferences
- Output: story stage allocation, time intervals per frame
- Logic:
  - If user specifies requirements → use user requirements
  - Else → default to 15 seconds (3 frames × 5 seconds each)
  - Distribute frames across Setup/Build/Climax/Resolution

### PromptEnhancer
- Input: frame data, story stage, time interval, progression info
- Output: enhanced visual prompt and description with story structure guidelines
- Enhancements:
  - Add Guideline #7 with explicit story structure
  - Add Guideline #8 with scene progression requirements
  - Include temporal details (time intervals, progression indicators)
  - Ensure no repetition or vague descriptions

### UI Components
- Display story stage for each frame
- Show time allocation and intervals
- Indicate progression relationship between frames
- Allow user to customize story structure allocation

## Data Models

### StoryStage Enum
```
enum StoryStage {
  SETUP = 'setup',
  BUILD = 'build',
  CLIMAX = 'climax',
  RESOLUTION = 'resolution'
}
```

### Enhanced StoryboardFrame
```
interface StoryboardFrame {
  // ... existing fields ...
  storyStage?: StoryStage;
  timeStart?: number; // in seconds
  timeEnd?: number; // in seconds
  progressionIndicator?: string; // e.g., "continue", "accelerate", "turn"
}
```

### StoryStructureConfig
```
interface StoryStructureConfig {
  totalFrames: number;
  totalDuration: number; // in seconds
  setupFrames: number;
  buildFrames: number;
  climaxFrames: number;
  resolutionFrames: number;
}
```

## Correctness Properties

Property 1: Story structure completeness
*For any* generated script, all four story stages (Setup, Build, Climax, Resolution) SHALL be present and clearly identified in the prompts.

Property 2: Scene progression coherence
*For any* sequence of adjacent frames, there SHALL be a clear logical connection and no repetition of scenes or actions.

Property 3: Temporal consistency
*For any* frame sequence, the time intervals SHALL be consistent and non-overlapping, with clear progression from start to end.

Property 4: Prompt guideline inclusion
*For any* generated prompt, Guideline #7 (Story Structure) and Guideline #8 (Scene Progression) SHALL be explicitly included.

Property 5: Frame allocation correctness
*For any* story structure configuration, the sum of frames in all stages SHALL equal the total frame count, and each stage SHALL have at least one frame.

## Error Handling

- If frame count is less than 4, allocate 1 frame per stage
- If total duration is not specified, default to 15 seconds
- If user provides invalid allocation, validate and adjust
- If scene progression cannot be determined, add explicit transition descriptions

## Testing Strategy

### Unit Tests
- Test StoryStructureCalculator with various frame counts and durations
- Test PromptEnhancer with different story stages and temporal info
- Test frame allocation logic for edge cases (1-3 frames, very long/short durations)
- Test temporal interval calculations

### Property-Based Tests
- Property 1: Story structure completeness - verify all four stages are present
- Property 2: Scene progression coherence - verify no repetition and logical connections
- Property 3: Temporal consistency - verify time intervals are consistent and non-overlapping
- Property 4: Prompt guideline inclusion - verify Guidelines #7 and #8 are in prompts
- Property 5: Frame allocation correctness - verify frame counts sum correctly

### Integration Tests
- Test end-to-end script generation with story structure
- Test prompt generation with temporal details
- Test UI display of story stages and time intervals
- Test user customization of story structure allocation

