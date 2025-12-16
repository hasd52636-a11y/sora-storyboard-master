# 测试 LLM 脚本生成
Write-Host "=== 测试 LLM 脚本生成 ===" -ForegroundColor Green
Write-Host ""

$apiKey = $env:SILICONFLOW_API_KEY
if (-not $apiKey) {
    Write-Host "⚠️  未设置 SILICONFLOW_API_KEY 环境变量" -ForegroundColor Yellow
    Write-Host "请设置: `$env:SILICONFLOW_API_KEY = 'your-key'" -ForegroundColor Yellow
    exit 1
}

$script = '2842年，人类通过"时空锚点"稳定星际航行的时空坐标，锚点核心由"量子纠缠晶体"驱动。某偏远锚点突然出现裂痕，导致周边时空紊乱，若24小时内未修复，将引发星系级时空坍塌。主角林夏是锚点修复工程师，带着AI助手"拾光"前往修复，却发现裂痕背后隐藏着人为破坏的痕迹。'

$prompt = @"
You are an expert AI Film Director and Cinematographer.
Your mission is to convert a text script into a structured, cinematic storyboard sequence (JSON format) suitable for AI video generation.

[PROJECT SETTINGS]
- Core Script: "$script"
- Visual Style: Minimal Sketch (Simple line art, thin pencil sketch, very fine outlines only, pure white background, no fill, no shading, no solid areas, minimal strokes, sparse lines)
- Duration: 15 seconds
- Target Shot Count: 4 keyframes

[DIRECTORIAL GUIDELINES]
1. **Narrative Flow**: Break the script into a logical sequence. Ensure visual continuity between shots.
2. **Visual Translation**: Convert abstract ideas into concrete visual descriptions.
3. **Style Enforcement**: Strictly adhere to the Minimal Sketch style in all visual descriptions.
4. **Camera Work**: Assign professional camera movements (Pan, Tilt, Dolly, Zoom) suitable for the mood.

[OUTPUT CONSTRAINTS]
- Return ONLY a raw JSON Array. No Markdown blocks, no introductory text.
- The array must contain exactly 4 objects.
- **LANGUAGE REQUIREMENT**: visualPrompt and description MUST be in ENGLISH. visualPromptZh and descriptionZh MUST be in CHINESE.
- **Visual Consistency**: Ensure the main character's features remain identical across all visualPrompt fields.

[JSON SCHEMA]
Strictly follow this structure for each frame:
{
  "visualPrompt": "String (ENGLISH ONLY). Detailed image generation prompt for AI image generation. Must be in English. Start with: Minimal Sketch style storyboard sketch...",
  "visualPromptZh": "String (CHINESE ONLY). 对应英文的中文视觉描述。必须是中文。",
  "description": "String (ENGLISH ONLY). Concise technical instruction for motion. Must be in English.",
  "descriptionZh": "String (CHINESE ONLY). 简练的导演指令。必须是中文。"
}
"@

$body = @{
    messages = @(
        @{
            role = "user"
            content = $prompt
        }
    )
    frameCount = 4
    apiConfig = @{
        baseUrl = "https://api.siliconflow.cn/v1"
        defaultModel = "Qwen/Qwen2.5-7B-Instruct"
        provider = "siliconflow"
    }
} | ConvertTo-Json -Depth 10

Write-Host "1. 发送请求到 http://localhost:3000/api/ai/chat..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ai/chat" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-SF-Key" = $apiKey
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ 响应状态: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""

    $data = $response.Content | ConvertFrom-Json
    
    if ($data.choices -and $data.choices[0].message.content) {
        $content = $data.choices[0].message.content
        Write-Host "2. 响应内容长度: $($content.Length) 字符" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. 响应内容预览 (前 500 字符):" -ForegroundColor Cyan
        Write-Host ""
        Write-Host $content.Substring(0, [Math]::Min(500, $content.Length))
        Write-Host ""
        Write-Host "..."
        Write-Host ""
        
        # 尝试解析 JSON
        try {
            $jsonContent = $content
            
            # 尝试提取 JSON
            if ($content -match '```(?:json)?\s*([\s\S]*?)```') {
                $jsonContent = $matches[1].Trim()
            }
            
            if (-not $jsonContent.StartsWith('[')) {
                if ($content -match '\[[\s\S]*\]') {
                    $jsonContent = $matches[0]
                }
            }
            
            $frames = $jsonContent | ConvertFrom-Json
            Write-Host "✅ JSON 解析成功" -ForegroundColor Green
            Write-Host ""
            Write-Host "4. 生成的分镜数量: $($frames.Count)" -ForegroundColor Cyan
            Write-Host ""
            
            for ($i = 0; $i -lt $frames.Count; $i++) {
                $frame = $frames[$i]
                Write-Host "分镜 $($i + 1):" -ForegroundColor Yellow
                Write-Host "  visualPrompt: $($frame.visualPrompt.Substring(0, [Math]::Min(80, $frame.visualPrompt.Length)))..."
                Write-Host "  visualPromptZh: $($frame.visualPromptZh.Substring(0, [Math]::Min(80, $frame.visualPromptZh.Length)))..."
                Write-Host "  description: $($frame.description.Substring(0, [Math]::Min(80, $frame.description.Length)))..."
                Write-Host "  descriptionZh: $($frame.descriptionZh.Substring(0, [Math]::Min(80, $frame.descriptionZh.Length)))..."
                Write-Host ""
            }
        } catch {
            Write-Host "❌ JSON 解析失败: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "原始内容: $content" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 响应中没有内容" -ForegroundColor Red
        Write-Host "响应数据: $($data | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "详细信息: $($_.Exception)" -ForegroundColor Red
}
