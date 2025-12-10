import request from '@/utils/request'
import config from '@/config'

// Define interfaces roughly based on usage context
export interface GifDTO {
  id?: number | string
  url?: string
  width?: number
  height?: number
  title?: string
  [key: string]: any
}

/**
 * 第一次获取随机GIF列表
 */
export function getRandomGifListFirst() {
  return request<GifDTO[]>({
    baseUrl: config.gifUrl,
    url: '/gif/randomGifs',
    method: 'GET',
  })
}

/**
 * 获取随机GIF列表
 */
export function getRandomGifList(id: number | string) {
  return request<GifDTO[]>({
    baseUrl: config.gifUrl,
    url: '/gif/randomGifs/' + id,
    method: 'GET',
  })
}

/**
 * 获取一个（单张）随机GIF
 */
export function getOneRandomGif() {
  return request<GifDTO>({
    baseUrl: config.gifUrl,
    url: '/gif/randomGif',
    method: 'GET',
  })
}

/**
 * 获取GIF详情
 */
export function getGifDetail(id: string | number) {
  return request<GifDTO>({
    baseUrl: config.gifUrl,
    url: `/gif/${id}`,
    method: 'GET',
  })
}

/**
 * 点赞或取消点赞
 */
export function likeOrDislike(data: any) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/likeOrDislike`,
    method: 'POST',
    data,
  })
}

/**
 * 判断用户是否已经点赞过此GIF
 */
export function isLikeThis(params: any) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/isLikeThis`,
    method: 'GET',
    params,
  })
}

/**
 * 获取用户点赞列表
 */
export function getUserLikeList(params: any) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/likeByCategory`,
    method: 'GET',
    params,
  })
}

/**
 * 更新GIF浏览次数
 */
export function updateViewCount(id: string | number) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/view/${id}`,
    method: 'GET',
  })
}

/**
 * 更新GIF下载次数
 */
export function updateDownloadCount(id: string | number) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/download/${id}`,
    method: 'GET',
  })
}

/**
 * 喜欢 GIF - 将 GIF 添加到 What We Like
 */
export function likeGiphy(data: {
  giphyId: string
  username?: string
  source?: string
  description?: string
  title?: string
}) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/weLike',
    method: 'POST',
    data,
  })
}

/**
 * 查询热度最高gif
 */
export function hotGifs(params: any) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/hot',
    method: 'GET',
    params,
  })
}
