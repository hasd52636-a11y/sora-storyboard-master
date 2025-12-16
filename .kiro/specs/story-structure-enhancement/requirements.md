# Requirements Document - Story Structure Enhancement

## Introduction

本文档定义了Storyboard Master故事结构和叙事进展改进的需求。当前系统生成的脚本缺乏清晰的叙事弧线和场景进展，导致生成的视频缺乏连贯性和戏剧张力。本需求旨在通过实现标准的故事结构（Setup → Build → Climax → Resolution）来改进脚本生成质量。

## Glossary

- **System**: Storyboard Master应用系统
- **Story Structure**: 故事结构，包括Setup（铺垫）、Build（发展）、Climax（高潮）、Resolution（结局）四个阶段
- **Narrative Arc**: 叙事弧线，指故事从开始到结束的情感和戏剧张力变化
- **Scene Progression**: 场景进展，指相邻场景之间的逻辑连接和时间推进
- **Script**: 分镜脚本，包括视觉提示词（Visual Prompt）和视频描述（Description）
- **Frame**: 单个分镜画面，对应视频中的一个镜头
- **Temporal Detail**: 时间细节，指脚本中明确的时间间隔和进展信息

## Requirements

### Requirement 1: 实现标准故事结构

**User Story:** 作为内容创作者，我希望生成的脚本遵循标准的故事结构，这样生成的视频能够具有清晰的叙事弧线和戏剧张力。

#### Acceptance Criteria

1. WHEN 用户生成分镜脚本 THEN System SHALL 将脚本分为Setup、Build、Climax、Resolution四个阶段
2. WHEN 脚本生成 THEN System SHALL 确保每个阶段都有明确的目的和内容
3. WHEN 用户指定分镜数量 THEN System SHALL 根据分镜数量合理分配四个阶段
4. WHEN 脚本包含故事结构信息 THEN System SHALL 在生成的提示词中明确标注每个分镜所属的故事阶段

### Requirement 2: 确保场景进展的连贯性

**User Story:** 作为内容创作者，我希望相邻的分镜场景能够逻辑连接，没有重复或倒退，这样生成的视频能够流畅进展。

#### Acceptance Criteria

1. WHEN 生成相邻分镜 THEN System SHALL 确保场景之间有清晰的逻辑连接
2. WHEN 分镜序列生成 THEN System SHALL 防止重复的场景或动作
3. WHEN 场景进展 THEN System SHALL 确保时间和空间的连续性
4. WHEN 用户查看脚本 THEN System SHALL 显示每个分镜之间的进展关系

### Requirement 3: 添加时间细节和进展信息

**User Story:** 作为内容创作者，我希望脚本中包含明确的时间细节，这样我能够更好地理解每个分镜的时长和进展。

#### Acceptance Criteria

1. WHEN 脚本生成 THEN System SHALL 为每个分镜添加时间信息（如"0-5秒"、"5-10秒"等）
2. WHEN 用户指定总时长 THEN System SHALL 根据总时长均匀分配各分镜的时间
3. WHEN 分镜脚本生成 THEN System SHALL 在描述中包含进展指示（如"继续"、"加速"、"转折"等）
4. WHEN 用户查看提示词 THEN System SHALL 清晰显示每个分镜的时间段和进展阶段

### Requirement 4: 优化提示词生成

**User Story:** 作为内容创作者，我希望生成的提示词能够明确指导AI生成符合故事结构的视频内容。

#### Acceptance Criteria

1. WHEN 生成提示词 THEN System SHALL 包含明确的故事结构指导（Guideline #7）
2. WHEN 生成提示词 THEN System SHALL 包含场景进展要求（Guideline #8）
3. WHEN 提示词生成 THEN System SHALL 避免模糊或重复的描述
4. WHEN 用户导出提示词 THEN System SHALL 提供清晰的、可直接用于AI视频生成的指令

### Requirement 5: 支持用户自定义故事结构

**User Story:** 作为内容创作者，我希望能够自定义故事结构的分配，这样我可以根据具体需求调整各阶段的长度。

#### Acceptance Criteria

1. WHEN 用户创建项目 THEN System SHALL 允许用户指定总分镜数量
2. WHEN 用户指定分镜数量 THEN System SHALL 自动计算默认的故事结构分配（3帧 × 5秒）
3. WHEN 用户有特定要求 THEN System SHALL 优先遵循用户的要求而不是默认值
4. WHEN 用户修改分镜数量 THEN System SHALL 动态调整故事结构分配

