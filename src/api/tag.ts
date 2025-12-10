import request from '@/utils/request'
import config from '@/config'
import type { GetGifListByTagParams } from '@/api/types'

/**
 * Tag 前缀搜索
 */
export function tagPrefixSearch(params: { content: string; pageNum?: number; pageSize?: number }) {
  return request({
    baseUrl: config.gifUrl,
    url: '/tag/prefix',
    method: 'GET',
    params,
  })
}

/**
 * 返回前20个最热门的标签
 */
export function hotTags() {
  return request({
    baseUrl: config.gifUrl,
    url: '/tag/hot',
    method: 'GET',
  })
}

/**
 * 根据标签获取GIF列表
 */
export function getGifListByTag(params: GetGifListByTagParams) {
  return request({
    baseUrl: config.gifUrl,
    url: '/tag/tagGifs',
    method: 'GET',
    params,
  })
}

/**
 * 根据 GIF ID 查询标签列表
 */
export function getTagsByGifId(gifId: string | number) {
  return request({
    baseUrl: config.gifUrl,
    url: `/tag/gif/${gifId}`,
    method: 'GET',
  })
}

/**
 * 根据 Tag ID 获取 GIF 列表（游标分页）
 */
export function getGifsByTagId(
  tagId: string | number,
  pageSize = 10,
  lastId?: string | number,
  lastValue?: string,
) {
  return request({
    baseUrl: config.gifUrl,
    url: `/tag/getGifBy/${tagId}`,
    method: 'GET',
    params: {
      pageSize,
      lastId,
      lastValue,
    },
  })
}
