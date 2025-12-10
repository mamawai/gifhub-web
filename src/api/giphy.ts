import request from '@/utils/request'
import config from '@/config'
import type { GiphyResponseVO } from './types'

/**
 * 获取热门 GIF
 * @param {number} limit - 返回数量，默认10
 * @param {number} offset - 偏移量，默认0
 * @returns {Promise<GiphyResponseVO>} 请求结果
 */
export function getTrending(limit = 10, offset = 0) {
  return request<GiphyResponseVO>({
    baseUrl: config.gifUrl,
    url: '/api/giphy/trending',
    method: 'GET',
    params: {
      limit,
      offset,
    },
  })
}

/**
 * 搜索 GIF
 * @param {string} query - 搜索关键词
 * @param {number} limit - 返回数量，默认10
 * @param {number} offset - 偏移量，默认0
 * @returns {Promise<GiphyResponseVO>} 请求结果
 */
export function search(query: string, limit = 10, offset = 0) {
  return request<GiphyResponseVO>({
    baseUrl: config.gifUrl,
    url: '/api/giphy/search',
    method: 'GET',
    params: {
      query,
      limit,
      offset,
    },
  })
}

/**
 * 获取随机 GIF
 */
export function getRandom(tag?: string) {
  return request({
    baseUrl: config.gifUrl,
    url: '/api/giphy/random',
    method: 'GET',
    params: tag ? { tag } : undefined,
  })
}
