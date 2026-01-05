<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import type { GifDTO } from '@/api/types'
import GifCard from './GifCard.vue'
import { useMasonryLayout } from '@/composables/useMasonryLayout'

interface Props {
  items: GifDTO[]
  gap?: number
  loading?: boolean
  loadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  gap: 16,
  loading: false,
  loadingMore: false,
})

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
  (e: 'loadMore'): void
}>()

// 容器引用 - 使用外层 wrapper 来获取宽度，避免 v-if 切换问题
const wrapperRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

// 滚动状态
const scrollTop = ref(0)
const viewportHeight = ref(0)
const overscan = 300 // 上下各多渲染 300px
const isActive = ref(true) // 组件是否处于激活状态

// 响应式 items ref
const itemsRef = computed(() => props.items)

// 使用瀑布流布局
const { positions, totalHeight, columnCount, columnWidth, recalculate } = useMasonryLayout({
  items: itemsRef,
  containerWidth,
  gap: props.gap,
})

// 计算可见项
const visibleItems = computed(() => {
  // 如果布局还没计算好，不渲染任何卡片
  if (positions.value.size === 0 || containerWidth.value <= 0) {
    return []
  }

  // 触发响应式依赖（确保滚动时重新计算）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = scrollTop.value

  // 获取容器相对于视口的位置
  const containerTop = wrapperRef.value?.getBoundingClientRect().top ?? 0

  // 计算相对于容器的可见范围
  // containerTop 是容器顶部相对于视口顶部的距离（可能为负）
  // 当 containerTop = 0 时，容器顶部刚好在视口顶部
  // 当 containerTop < 0 时，容器顶部已经滚出视口上方
  const visibleTop = -containerTop - overscan
  const visibleBottom = -containerTop + viewportHeight.value + overscan

  return props.items.filter((item) => {
    const itemId = item.id ?? item.giphyId
    if (!itemId) return false
    const pos = positions.value.get(itemId)
    if (!pos) return false
    // pos.y 是相对于容器的位置
    return pos.y + pos.height > visibleTop && pos.y < visibleBottom
  })
})

// 获取项的样式
const getItemStyle = (item: GifDTO) => {
  const itemId = item.id ?? item.giphyId
  if (!itemId) return {}
  const pos = positions.value.get(itemId)
  if (!pos) return {}

  return {
    position: 'absolute' as const,
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
  }
}

// 滚动处理
let ticking = false
const handleScroll = () => {
  // 组件未激活时不处理滚动
  if (!isActive.value) return

  if (!ticking) {
    requestAnimationFrame(() => {
      scrollTop.value = window.scrollY

      // 触底加载更多（只在激活状态下）
      if (
        isActive.value &&
        scrollTop.value + viewportHeight.value >= totalHeight.value - 500 &&
        !props.loading &&
        !props.loadingMore
      ) {
        emit('loadMore')
      }
      ticking = false
    })
    ticking = true
  }
}

// 更新容器宽度
const updateContainerWidth = () => {
  if (wrapperRef.value) {
    containerWidth.value = wrapperRef.value.clientWidth
  }
}

// ResizeObserver
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  viewportHeight.value = window.innerHeight
  updateContainerWidth()

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', () => {
    viewportHeight.value = window.innerHeight
    updateContainerWidth()
  })

  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  resizeObserver?.disconnect()
})

// KeepAlive 生命周期钩子
onActivated(() => {
  isActive.value = true
})

onDeactivated(() => {
  isActive.value = false
})

// 监听 loading 变化，确保切换后重新计算布局
watch(
  () => props.loading,
  (newLoading, oldLoading) => {
    if (oldLoading && !newLoading) {
      // loading 结束，重新获取宽度并计算布局
      nextTick(() => {
        updateContainerWidth()
        recalculate()
      })
    }
  },
)

// 监听 items 变化重新计算（深度监听第一个元素的 id 来检测数组替换）
watch(
  () => [props.items.length, props.items[0]?.id],
  () => {
    nextTick(recalculate)
  },
)

// 骨架屏随机宽高比
const skeletonAspectRatios = Array.from({ length: 20 }, () => {
  const ratios = [1, 0.75, 1.25, 0.8, 1.5, 0.6]
  return ratios[Math.floor(Math.random() * ratios.length)]
})

// 骨架屏布局计算
const skeletonPositions = computed(() => {
  if (containerWidth.value <= 0) return []

  const colCount = columnCount.value
  const colWidth = columnWidth.value
  const heights = new Array(colCount).fill(0)
  const result: { x: number; y: number; width: number; height: number }[] = []

  for (let i = 0; i < 20; i++) {
    const minHeight = Math.min(...heights)
    const colIndex = heights.indexOf(minHeight)
    const cardHeight = colWidth / skeletonAspectRatios[i]

    result.push({
      x: colIndex * (colWidth + props.gap),
      y: heights[colIndex],
      width: colWidth,
      height: cardHeight,
    })

    heights[colIndex] = heights[colIndex] + cardHeight + props.gap
  }

  return result
})

const skeletonTotalHeight = computed(() => {
  if (skeletonPositions.value.length === 0) return 400
  const heights = skeletonPositions.value.map((p) => p.y + p.height)
  return Math.max(...heights)
})
</script>

<template>
  <div ref="wrapperRef" class="virtual-masonry-wrapper">
    <!-- 骨架屏 -->
    <div
      v-if="loading"
      class="virtual-masonry skeleton-mode"
      :style="{ height: `${skeletonTotalHeight}px` }"
    >
      <div
        v-for="(pos, index) in skeletonPositions"
        :key="index"
        class="skeleton-card"
        :style="{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
        }"
      />
    </div>

    <!-- 实际内容 -->
    <div
      v-else
      class="virtual-masonry"
      :style="{ height: `${totalHeight}px` }"
    >
      <GifCard
        v-for="item in visibleItems"
        :key="item.id ?? item.giphyId"
        :gif="item"
        :style="getItemStyle(item)"
        @click="emit('click', item)"
      />
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="loadingMore" class="loading-more">
      <div class="spinner small"></div>
    </div>
  </div>
</template>

<style scoped>
.virtual-masonry-wrapper {
  width: 100%;
}

.virtual-masonry {
  position: relative;
  width: 100%;
  /* 不设置 overflow: hidden，让光晕可以溢出 */
}

/* 骨架屏样式 */
.skeleton-mode {
  position: relative;
}

.skeleton-card {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-hover) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 加载更多 */
.loading-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-surface-hover);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
}

.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
