import request from '@/utils/request'
import config from '@/config'
import type { AddCategoryParams, UpdateCategoryDTO } from '@/api/types'

/**
 * 获取分类列表
 */
export function getCategoryList() {
  return request({
    baseUrl: config.gifUrl,
    url: '/userCategory/list',
    method: 'GET',
  })
}

/**
 * 新增分类
 */
export function addCategory(params: AddCategoryParams) {
  return request({
    baseUrl: config.gifUrl,
    url: `/userCategory/add`,
    method: 'POST',
    params,
  })
}

/**
 * 删除分类
 */
export function deleteCategory(id: string | number) {
  return request({
    baseUrl: config.gifUrl,
    url: '/userCategory/delete/' + id,
    method: 'DELETE',
  })
}

/**
 * 修改分类
 */
export function updateCategory(id: string | number, data: UpdateCategoryDTO) {
  return request({
    baseUrl: config.gifUrl,
    url: '/userCategory/update/' + id,
    method: 'PUT',
    data,
  })
}
