// 请求队列管理器
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests: number = 0;
  private maxConcurrentRequests: number = 2; // 限制最大并发请求数

  constructor(maxConcurrentRequests: number = 2) {
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  // 添加请求到队列
  addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 创建一个包装函数，包含原始请求和resolve/reject回调
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          // 请求完成后，减少活跃请求计数并处理下一个请求
          this.activeRequests--;
          this.processNext();
        }
      };

      // 将请求添加到队列
      this.queue.push(wrappedRequest);

      // 尝试处理请求
      this.processNext();
    });
  }

  // 处理队列中的下一个请求
  private processNext() {
    if (this.activeRequests < this.maxConcurrentRequests && this.queue.length > 0) {
      // 取出队列中的第一个请求
      const request = this.queue.shift();
      if (request) {
        // 增加活跃请求计数并执行请求
        this.activeRequests++;
        request();
      }
    }
  }

  // 清空队列
  clear() {
    this.queue = [];
  }

  // 获取当前队列长度
  getQueueLength(): number {
    return this.queue.length;
  }

  // 获取当前活跃请求数
  getActiveRequests(): number {
    return this.activeRequests;
  }
}

// 创建全局请求队列实例
export const requestQueue = new RequestQueue(2);
