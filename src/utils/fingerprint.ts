/**
 * 浏览器指纹生成工具
 * 使用FingerprintJS v3开源版生成唯一指纹
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<any> | null = null

/**
 * 初始化FingerprintJS
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

/**
 * 生成浏览器指纹
 * @returns 指纹字符串
 */
export async function generateFingerprint(): Promise<string> {
  try {
    const fp = await initFingerprint()
    const result = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('指纹生成失败:', error)
    return ''
  }
}
