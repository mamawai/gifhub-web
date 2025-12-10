/**
 * 通用响应结构
 */
export interface ApiResponse<T = any> {
  status: number
  message: string
  data: T
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
