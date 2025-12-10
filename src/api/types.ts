/**
 * 通用响应结构
 */
export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data: T
}

/**
 * GIF DTO（从 gif.ts 导出以便统一管理）
 */
export interface GifDTO {
  id?: number | string
  url?: string
  width?: number
  height?: number
  title?: string
  fileUrl?: string
  nickname?: string
  giphyUsername?: string
  giphyId?: string
  userId?: string
  source?: string
  likeCount?: number
  downloadCount?: number
  viewCount?: number
  createdAt?: string
}

/**
 * 邮箱登录 DTO
 */
export interface EmailLoginDTO {
  /** 邮箱地址 */
  email: string
  /** 密码（密码登录时需要） */
  password?: string
  /** 验证码（验证码登录时需要） */
  verificationCode?: string
  /** 登录类型：1-密码登录，2-验证码登录 */
  loginType: number
}

/**
 * 登录结果 VO
 */
export interface LoginResultVO {
  /** 访问令牌 */
  token: string
}

/**
 * 用户信息 VO
 */
export interface UserInfoVO {
  userId: number
  email: string
  nickname: string
}

/**
 * 评论返回 VO
 */
export interface CommentVO {
  id: string
  gifId: number
  userId: number
  nickname: string
  avatar: string
  parentId: string
  rootCommentId: string
  parentUserId: number
  parentNickname: string
  content: string
  likeCount: number
  childCount: number
  createdAt: string
  isLiked: boolean
  children?: CommentVO[]
}

/**
 * GIF VO
 */
export interface GifVO {
  id: number
  giphyId: string
  height: string
  width: string
  title: string
  description: string
  source: string
  giphyUsername: string
  likeCount: number
  downloadCount: number
  viewCount: number
  userId: string
  createdAt: string
  // 扩展字段，用于前端展示
  fileUrl?: string
  url?: string
}

/**
 * GIF 标签 VO
 */
export interface GifTagVO {
  id: number
  name: string
}

/**
 * 邮箱注册 DTO
 */
export interface EmailRegisterDTO {
  email: string
  password: string
  verificationCode: string
}

/**
 * 上传 GIF DTO
 */
export interface UploadGifDTO {
  /** gif文件 */
  file: File | Blob
  /** gif标题（必填） */
  title: string
  /** gif描述（可选） */
  description?: string
  /** gif标签，逗号分隔，最多3个，每个最长10字符（必填） */
  tags: string
}

/**
 * 批量上传 GIF DTO
 */
export interface BatchUploadGifDTO {
  /** gif文件列表（必填） */
  files: (File | Blob)[]
  /** gif标题列表，数量必须与文件数量一致（必填） */
  titles: string[]
  /** gif描述列表（可选） */
  descriptions?: string[]
  /** gif标签列表，每个GIF的标签用逗号分隔，数量必须与文件数量一致（必填） */
  tags: string[]
}

/**
 * 点赞/取消点赞 DTO
 */
export interface LikeOrDislikeDTO {
  gifId: string | number
  isLike: boolean
}

/**
 * 检查是否点赞参数
 */
export interface IsLikeThisParams {
  gifId: string | number
}

/**
 * 获取用户 GIF 列表参数
 */
export interface GetUserGifsParams {
  pageNum?: number
  pageSize?: number
  categoryId?: string | number
}

/**
 * 获取用户点赞列表参数（按分类）
 */
export interface GetUserLikeListParams {
  /** 分类ID（必填） */
  categoryId: number
  /** 页码，默认1 */
  pageNum?: number
  /** 每页数量，默认10 */
  pageSize?: number
}

/**
 * 获取热门 GIF 参数
 */
export interface HotGifsParams {
  /** 每页数量，默认10 */
  pageSize?: number
  /** 上一页最后一条的浏览次数（用于游标分页） */
  lastViewCount?: number
  /** 上一页最后一条的ID（用于游标分页） */
  lastId?: number
}

/**
 * 获取最新 GIF 参数
 * pageSize 查询数量
 * lastId 上一页最后一条的ID（用于游标分页）第一次查询传null
 */
export interface LatestGifsParams {
  pageSize?: number
  lastId?: number
}

/**
 * 微信登录 DTO
 */
export interface WeixinLoginDTO {
  code: string
  encryptedData?: string
  iv?: string
}

/**
 * 添加分类参数
 */
export interface AddCategoryParams {
  categoryName: string
  description?: string
}

/**
 * 更新分类 DTO
 */
export interface UpdateCategoryDTO {
  name?: string
  description?: string
}

/**
 * 根据标签获取 GIF 列表参数
 */
export interface GetGifListByTagParams {
  tagId: string | number
  pageNum?: number
  pageSize?: number
}

export * from './giphy-types'
