import { ref, computed, watch, nextTick, type Ref } from 'vue'
import type { GifDTO } from '@/api/types'

export interface LayoutItem {
  x: number
  y: number
  width: number
  height: number
}

interface UseMasonryLayoutOptions {
  items: Ref<GifDTO[]>
  containerWidth: Ref<number>
  gap?: number
}

// 响应式断点（与原 CSS 保持一致）
const getColumnCount = (width: number): number => {
  if (width >= 1280) return 5
  if (width >= 1024) return 4
  if (width >= 640) return 3
  return 2
}

export function useMasonryLayout(options: UseMasonryLayoutOptions) {
  const { items, containerWidth, gap = 16 } = options

  const positions = ref<Map<string | number, LayoutItem>>(new Map())
  const columnHeights = ref<number[]>([])

  const columnCount = computed(() => {
    if (containerWidth.value <= 0) return 2
    return getColumnCount(containerWidth.value)
  })

  const columnWidth = computed(() => {
    if (containerWidth.value <= 0) return 280
    return (containerWidth.value - (columnCount.value - 1) * gap) / columnCount.value
  })

  const totalHeight = computed(() => {
    if (columnHeights.value.length === 0) return 0
    return Math.max(...columnHeights.value)
  })

  const calculate = () => {
    if (containerWidth.value <= 0 || items.value.length === 0) {
      positions.value = new Map()
      columnHeights.value = []
      return
    }

    const heights = new Array(columnCount.value).fill(0)
    const newPositions = new Map<string | number, LayoutItem>()
    const colWidth = columnWidth.value

    for (const item of items.value) {
      // 找最短列
      const minHeight = Math.min(...heights)
      const colIndex = heights.indexOf(minHeight)

      // 基于 aspect-ratio 计算高度
      const aspectRatio = item.width && item.height ? item.width / item.height : 1
      const cardHeight = colWidth / aspectRatio

      const x = colIndex * (colWidth + gap)
      const y = heights[colIndex]

      const itemId = item.id ?? item.giphyId ?? Math.random()
      newPositions.set(itemId, { x, y, width: colWidth, height: cardHeight })

      // 更新列高度
      heights[colIndex] = y + cardHeight + gap
    }

    positions.value = newPositions
    columnHeights.value = heights
  }

  // 监听数据和列数变化
  watch(
    [() => items.value.length, columnCount, containerWidth],
    () => {
      nextTick(calculate)
    },
    { immediate: true },
  )

  return {
    positions,
    columnCount,
    columnWidth,
    totalHeight,
    recalculate: calculate,
  }
}
