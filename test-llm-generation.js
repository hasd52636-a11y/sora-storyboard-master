// 测试 LLM 脚本生成
const testLLMGeneration = async () => {
  console.log('=== 测试 LLM 脚本生成 ===\n');

  // 测试配置
  const apiKey = process.env.SILICONFLOW_API_KEY || 'test-key';
  const script = '2842年，人类通过"时空锚点"稳定星际航行的时空坐标，锚点核心由"量子纠缠晶体"驱动。某偏远锚点突然出现裂痕，导致周边时空紊乱，若24小时内未修复，将引发星系级时空坍塌。主角林夏是锚点修复工程师，带着AI助手"拾光"前往修复，却发现裂痕背后隐藏着人为破坏的痕迹。';
  
  const prompt = `You are an expert AI Film Director and Cinematographer.
Your mission is to convert a text script into a structured, cinematic storyboard sequence (JSON format) suitable for AI video generation.

[PROJECT SETTINGS]
- Core Script: "${script}"
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
}`;

  try {
    console.log('1. 发送请求到 /api/ai/chat...\n');
    
    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SF-Key': apiKey
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        frameCount: 4,
        apiConfig: {
          baseUrl: 'https://api.siliconflow.cn/v1',
          defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
          provider: 'siliconflow'
        }
      })
    });

    console.log(`响应状态: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 错误:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ 收到响应\n');
    
    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      console.log('2. 响应内容长度:', content.length, '字符\n');
      console.log('3. 响应内容预览 (前 500 字符):\n');
      console.log(content.substring(0, 500));
      console.log('\n...\n');
      
      // 尝试解析 JSON
      try {
        let jsonContent = content;
        
        // 尝试提取 JSON
        const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonBlockMatch) {
          jsonContent = jsonBlockMatch[1].trim();
        }
        
        if (!jsonContent.startsWith('[')) {
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonContent = arrayMatch[0];
          }
        }
        
        const frames = JSON.parse(jsonContent);
        console.log('✅ JSON 解析成功\n');
        console.log('4. 生成的分镜数量:', frames.length, '\n');
        
        frames.forEach((frame, i) => {
          console.log(`分镜 ${i + 1}:`);
          console.log(`  visualPrompt: ${frame.visualPrompt?.substring(0, 80)}...`);
          console.log(`  visualPromptZh: ${frame.visualPromptZh?.substring(0, 80)}...`);
          console.log(`  description: ${frame.description?.substring(0, 80)}...`);
          console.log(`  descriptionZh: ${frame.descriptionZh?.substring(0, 80)}...`);
          console.log();
        });
      } catch (e) {
        console.error('❌ JSON 解析失败:', e.message);
        console.log('原始内容:', content);
      }
    } else {
      console.error('❌ 响应中没有内容');
      console.log('响应数据:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
};

testLLMGeneration();
