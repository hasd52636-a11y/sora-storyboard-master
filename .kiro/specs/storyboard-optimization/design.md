# Design Document - Storyboard Display Fix

## Overview

This document describes the design for fixing storyboard display issues in the Storyboard Master application. The main issues are:
1. Storyboard images are not displayed completely in the Editor and Export pages
2. Visual Prompt (EN) field contains unwanted user input that needs to be cleared

## Architecture

### Current Issues

**Editor Page:**
- Canvas container uses `width: 75%` and `maxHeight: 45vh`, causing images to be compressed
- Image uses `object-cover` which crops the image instead of displaying it completely
- Aspect ratio is maintained but content is lost

**Export Page:**
- Image container uses `aspect-video` with `object-cover`, which crops images
- Grid layout doesn't properly center images
- Complete storyboard content is not visible

**Visual Prompt Field:**
- PromptCard component displays all content including whitespace
- handleSavePrompt function doesn't clean empty/whitespace-only content
- User input may include unnecessary default values

## Components and Interfaces

### Editor.tsx Changes
- Canvas container: Update width and height constraints
- Image element: Change from `object-cover` to `object-contain`
- Container: Add flex centering for proper alignment

### Export.tsx Changes
- Image container: Change from `object-cover` to `object-contain`
- Add flex centering to grid items
- Maintain 16:9 aspect ratio while showing complete content

### PromptCard Component Changes
- Display logic: Trim whitespace before showing content
- Show "No content..." only when value is empty or whitespace-only

### handleSavePrompt Function Changes
- Clean input: Trim whitespace from user input
- Only translate non-empty content
- Save cleaned values to frame data

## Data Models

No changes to data models required. The fixes are purely UI/display related.

## Correctness Properties

Property 1: Complete image display
*For any* storyboard frame with an image, the image SHALL be displayed completely without cropping or compression in both Editor and Export pages.

Property 2: Aspect ratio preservation
*For any* storyboard frame, the 16:9 aspect ratio SHALL be maintained while displaying the complete image content.

Property 3: Empty content handling
*For any* Visual Prompt field, empty or whitespace-only content SHALL be displayed as "No content..." without showing the actual whitespace.

Property 4: Content cleaning
*For any* user input to Visual Prompt field, only non-whitespace content SHALL be saved to the frame data.

## Error Handling

- If image fails to load, display "NO IMAGE" placeholder
- If content is empty, display "No content..." placeholder
- No error messages needed for this fix as it's purely display-related

## Testing Strategy

### Unit Tests
- Test PromptCard component with various input values (empty, whitespace, normal text)
- Test handleSavePrompt function with different input scenarios
- Test image display in Editor and Export pages

### Property-Based Tests
- Property 1: Complete image display - verify images are not cropped
- Property 2: Aspect ratio preservation - verify 16:9 ratio is maintained
- Property 3: Empty content handling - verify whitespace is handled correctly
- Property 4: Content cleaning - verify only clean content is saved

## Implementation Notes

1. Change `object-cover` to `object-contain` in both Editor and Export pages
2. Update canvas container dimensions in Editor page
3. Add flex centering to image containers
4. Modify PromptCard display logic to trim whitespace
5. Update handleSavePrompt to clean input before saving
6. Test all changes to ensure no regressions
