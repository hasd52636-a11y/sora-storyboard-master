# Implementation Plan - Story Structure Enhancement

## Overview
This plan outlines the tasks to implement story structure enhancement, including story stage calculation, prompt generation with guidelines, and temporal information management.

## Tasks

- [x] 1. Create StoryStructureCalculator utility


  - Implement frame allocation logic based on frame count and duration
  - Support default allocation: 3 frames × 5 seconds = 15 seconds
  - Calculate time intervals for each frame
  - Support user customization of story structure allocation
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_


- [ ] 2. Enhance StoryboardFrame data model
  - Add storyStage field to track which stage each frame belongs to
  - Add timeStart and timeEnd fields for temporal information
  - Add progressionIndicator field for scene progression info
  - Update frame initialization to include story structure data


  - _Requirements: 1.4, 3.1, 3.2, 3.3_

- [ ] 3. Create PromptEnhancer utility
  - Implement Guideline #7: Story Structure with explicit Setup/Build/Climax/Resolution beats
  - Implement Guideline #8: Scene Progression requiring clear progression with NO REPETITION
  - Add temporal details to visual prompts (time intervals, progression indicators)





  - Add temporal details to descriptions (time intervals, progression indicators)

  - Ensure prompts are clear and avoid repetition

  - _Requirements: 4.1, 4.2, 4.3, 4.4_



- [ ]* 4. Write property tests for story structure
  - **Property 1: Story structure completeness** - verify all four stages are present
  - **Validates: Requirements 1.1, 1.2**



- [x]* 5. Write property tests for scene progression


  - **Property 2: Scene progression coherence** - verify no repetition and logical connections

  - **Validates: Requirements 2.1, 2.2, 2.3**



- [x]* 6. Write property tests for temporal consistency

  - **Property 3: Temporal consistency** - verify time intervals are consistent and non-overlapping
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**




- [ ]* 7. Write property tests for prompt guidelines
  - **Property 4: Prompt guideline inclusion** - verify Guidelines #7 and #8 are in prompts

  - **Validates: Requirements 4.1, 4.2**



- [ ]* 8. Write property tests for frame allocation
  - **Property 5: Frame allocation correctness** - verify frame counts sum correctly
  - **Validates: Requirements 5.1, 5.2, 5.3**


- [x] 9. Integrate story structure into script generation

  - Modify script generation logic to use StoryStructureCalculator

  - Update generated frames with story stage and temporal information
  - Ensure all generated frames include progression indicators
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_


- [ ] 10. Integrate PromptEnhancer into prompt generation
  - Modify prompt generation to use PromptEnhancer
  - Ensure all prompts include Guideline #7 and #8
  - Add temporal details to all visual prompts and descriptions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 12. Write integration tests
  - Test end-to-end script generation with story structure
  - Test prompt generation with temporal details
  - Test story structure calculation with various frame counts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

