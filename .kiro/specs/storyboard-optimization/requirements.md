# Requirements Document - Storyboard Display Fix

## Introduction

本文档定义了Storyboard Master分镜显示优化的需求，旨在修复编辑页面和合成导出页面中分镜图无法完整呈现的问题，以及清除Visual Prompt (EN)框中的用户输入内容。

## Glossary

- **System**: Storyboard Master应用系统
- **Editor Page**: 分镜编辑页面
- **Export Page**: 分镜合成导出页面
- **Storyboard Frame**: 单个分镜画面
- **Visual Prompt**: 图像生成提示词
- **Aspect Ratio**: 宽高比（16:9）

## Requirements

### Requirement 1: 修复编辑页面分镜显示

**User Story:** 作为用户，我希望在编辑页面能看到完整的分镜图，这样我可以准确地进行编辑和调整。

#### Acceptance Criteria

1. WHEN 用户在编辑页面查看分镜 THEN System SHALL 完整显示分镜图片，不被截断或压缩
2. WHEN 分镜图片加载 THEN System SHALL 保持16:9的宽高比并完整显示内容
3. WHEN 用户调整窗口大小 THEN System SHALL 自适应调整分镜显示大小但保持完整性
4. WHEN 分镜图片很大 THEN System SHALL 使用缩放而不是裁剪来适应容器

### Requirement 2: 修复导出页面分镜显示

**User Story:** 作为用户，我希望在导出页面能看到完整的分镜图，这样我可以确认导出内容的正确性。

#### Acceptance Criteria

1. WHEN 用户在导出页面查看分镜 THEN System SHALL 完整显示所有分镜图片，不被截断或压缩
2. WHEN 分镜网格显示 THEN System SHALL 保持16:9的宽高比并完整显示每个分镜
3. WHEN 用户下载分镜表 THEN System SHALL 导出完整的分镜图片，不丢失任何内容
4. WHEN 分镜数量不同 THEN System SHALL 动态调整网格布局但保持每个分镜的完整性

### Requirement 3: 清除Visual Prompt (EN)框中的用户输入

**User Story:** 作为用户，我希望Visual Prompt (EN)框在新建分镜时为空，这样我可以从头开始输入。

#### Acceptance Criteria

1. WHEN 创建新分镜 THEN System SHALL Visual Prompt (EN)框为空，不包含任何预填充内容
2. WHEN 用户切换分镜 THEN System SHALL 正确显示当前分镜的Visual Prompt内容
3. WHEN 用户编辑Visual Prompt THEN System SHALL 只保存用户输入的内容，不包含默认值
4. WHEN 分镜数据保存 THEN System SHALL 清除任何不必要的默认文本或占位符

### Requirement 4: 保持其他功能不变

**User Story:** 作为用户，我希望修复不会影响其他功能，这样我可以继续正常使用应用。

#### Acceptance Criteria

1. WHEN 修复完成 THEN System SHALL 保持所有其他功能正常运行
2. WHEN 用户使用符号编辑 THEN System SHALL 符号功能不受影响
3. WHEN 用户生成分镜 THEN System SHALL 生成功能不受影响
4. WHEN 用户导出分镜 THEN System SHALL 导出功能正常工作
