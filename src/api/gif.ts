import request from '@/utils/request'
import axios from 'axios'
import config from '@/config'
import { getToken } from '@/utils/auth'
import type {
  UploadGifDTO,
  BatchUploadGifDTO,
  LikeOrDislikeDTO,
  IsLikeThisParams,
  GetUserLikeListParams,
  HotGifsParams,
  GifDTO,
  LatestGifsParams,
} from '@/api/types'

/**
 * 第一次获取随机GIF列表（返回完整响应以获取 message）
 */
export function getRandomGifListFirst(pageSize: number = 10) {
  return axios
    .get<{
      status: number
      message: string
      data: GifDTO[]
    }>(`${config.gifUrl}/gif/randomGifs`, {
      headers: { satoken: getToken() || '' },
      params: { pageSize }
    })
    .then((res) => res.data)
}

/**
 * 获取随机GIF列表（返回完整响应以获取 message）
 */
export function getRandomGifList(id: number | string, pageSize: number = 10) {
  return axios
    .get<{
      status: number
      message: string
      data: GifDTO[]
    }>(`${config.gifUrl}/gif/randomGifs/${id}`, {
      headers: { satoken: getToken() || '' },
      params: { pageSize }
    })
    .then((res) => res.data)
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
 * 上传GIF
 */
export function uploadGif(data: UploadGifDTO) {
  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('title', data.title)
  formData.append('tags', data.tags)
  if (data.description) {
    formData.append('description', data.description)
  }

  return request({
    baseUrl: config.gifUrl,
    url: '/gif/r2upload',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 批量上传GIF
 */
export function batchUploadGif(data: BatchUploadGifDTO) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/r2BatchUpload',
    method: 'POST',
    data,
  })
}

/**
 * 点赞或取消点赞
 */
export function likeOrDislike(data: LikeOrDislikeDTO) {
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
export function isLikeThis(params: IsLikeThisParams) {
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
export function getUserLikeList(params: GetUserLikeListParams) {
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
export function hotGifs(params: HotGifsParams) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/hot',
    method: 'GET',
    params,
  })
}

/**
 * 查询最新gif
 */
export function latestGifs(params: LatestGifsParams) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/latest',
    method: 'GET',
    params,
  })
}
