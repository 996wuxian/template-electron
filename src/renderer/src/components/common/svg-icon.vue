<template>
  <svg
    aria-hidden="true"
    :width="width"
    :height="height"
    :class="['svg-icon', { hoverable: hoverable }]"
    :style="{
      '--icon-color': currentFill,
      '--icon-hover-color': hoverFill
    }"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <use :xlink:href="symbolId" />
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
const useTheme = useThemeStore()

/**
 * 输入属性             类型                默认值              是否必选                描述
 *  name              string             undefined              是                  svg图标名字
 *  width             number                19                  否                  svg图标宽度
 *  height            number                19                  否                  svg图标高度
 *  fill              string              #ffffff               否                  svg图标填充颜色
 *  hoverFill         string              undefined             否                  鼠标悬停时的填充颜色
 *  hoverable         boolean             false                 否                  是否启用悬停效果
 */
const props = withDefaults(
  defineProps<{
    name: string
    width?: string | number
    height?: string | number
    fill?: string
    hoverFill?: string
    hoverable?: boolean
  }>(),
  {
    width: 19,
    height: 19,
    fill: '#333333',
    hoverFill: '',
    hoverable: false
  }
)

// 获取svg图标名称，需要和vite.config.ts中的配置保持一致
const symbolId = computed(() => `#${props.name}`)

// currentFill 用于控制当前的 fill 颜色
const currentFill = ref(props.fill)
const themeType = computed(() => useTheme.themeType)
watch(
  () => themeType.value,
  (val) => {
    currentFill.value = val === 'dark' ? '#fff' : props.fill
  },
  {
    immediate: true
  }
)

// 处理鼠标移入事件
const handleMouseOver = () => {
  if (props.hoverable && props.hoverFill) {
    currentFill.value = props.hoverFill
  }
}

// 处理鼠标移出事件
const handleMouseOut = () => {
  currentFill.value = themeType.value === 'dark' ? '#fff' : props.fill
}
</script>

<style scoped>
.svg-icon {
  transition: fill 0.3s;
  cursor: pointer;
  fill: var(--icon-color);
}

.svg-icon.hoverable:hover {
  fill: var(--icon-hover-color);
}

.svg-icon :deep(path),
.svg-icon :deep(rect),
.svg-icon :deep(circle) {
  fill: var(--icon-color) !important;
}

/* 处理渐变色 */
.svg-icon :deep(stop) {
  stop-color: var(--icon-color) !important;
}

/* 处理描边 */
.svg-icon :deep([stroke]) {
  stroke: var(--icon-color) !important;
}
</style>
