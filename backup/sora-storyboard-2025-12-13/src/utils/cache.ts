import { openDB, DBSchema } from 'idb'

interface MyDB extends DBSchema {
  frames: {
    key: string;
    value: { url: string; ts: number }
  }
}

const db = openDB<MyDB>('sora', 1, {
  upgrade(d) {
    d.createObjectStore('frames', { keyPath: 'key' })
  }
})

export async function getCache(key: string) {
  const m = await (await db).get('frames', key)
  // 缓存有效期 5 分钟 (300000 ms)
  return m && Date.now() - m.ts < 300000 ? m.url : null
}

export async function setCache(key: string, url: string) {
  return (await db).put('frames', { key, url, ts: Date.now() })
}