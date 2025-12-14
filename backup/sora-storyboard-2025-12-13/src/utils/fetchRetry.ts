/** 
 * 实现带指数退避和重试的 fetch 
 * @param url 请求 URL 
 * @param options fetch 选项 
 * @param maxRetries 最大重试次数 
 */ 
export async function fetchRetry(url: RequestInfo, options?: RequestInit, maxRetries = 2): Promise<Response> { 
    let lastError: Error | null = null; 
    for (let i = 0; i < maxRetries; i++) { 
        try { 
            const response = await fetch(url, options); 

            // 检查 400, 401, 403：这些是不可恢复的错误，立即抛出 
            if (response.status >= 400 && response.status < 500 && response.status !== 429) { 
                 // 400 错误可能是 Payload 错误，不重试 
                const errorDetails = await response.json().catch(() => ({})); 
                throw new Error(`Client Error ${response.status}: ${JSON.stringify(errorDetails)}`); 
            } 

            // 检查 429 和 5xx：这些是可恢复的错误，将进入重试逻辑 
            if (response.status === 429 || response.status >= 500) { 
                throw new Error(`Recoverable Error ${response.status}`); 
            } 

            // 成功，返回响应 
            return response; 

        } catch (error) { 
            lastError = error as Error; 

            // 如果是不可恢复的 Client Error (非 429, 非 5xx)，则立即退出重试 
            if (lastError.message.includes('Client Error')) { 
                throw lastError; 
            } 

            // 指数退避等待 (1s, 2s, 4s, ...) 
            const delay = Math.pow(2, i) * 1000; 
            console.warn(`Request failed (${lastError.message}). Retrying in ${delay / 1000}s... (Attempt ${i + 1})`); 
            await new Promise(resolve => setTimeout(resolve, delay)); 
        } 
    } 

    // 达到最大重试次数，抛出最后一次错误，由上层函数处理优雅降级 
    throw new Error(`Fetch failed after ${maxRetries} attempts. Last error: ${lastError?.message}`); 
}