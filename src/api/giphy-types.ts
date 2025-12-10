/**
 * Giphy API Response Types
 */
export interface GiphyResponseVO {
  data: GiphyGifVO[]
  pagination: GiphyPagination
  meta: GiphyMeta
}

export interface GiphyPagination {
  total_count: number
  count: number
  offset: number
}

export interface GiphyMeta {
  status: number
  msg: string
}

export interface GiphyGifVO {
  id: string
  username: string
  source: string
  title: string
  images: GiphyImages
}

export interface GiphyImages {
  original: GiphyOriginalImage
}

export interface GiphyOriginalImage {
  height: string
  width: string
}
