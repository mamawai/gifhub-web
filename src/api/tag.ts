import request from '@/utils/request'
import config from '@/config'

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
 * 根据 Tag ID 获取 GIF 列表
 */
export function getGifsByTagId(
  tagId: string | number,
  pageSize = 10,
  lastId?: string | number,
  lastValue?: string,
) {
  return request({
    baseUrl: config.gifUrl,
    url: `/tag/gifs/${tagId}`,
    method: 'GET',
    params: {
      pageSize,
      lastId,
      lastValue,
    },
  })
}
