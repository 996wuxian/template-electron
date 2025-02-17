<template>
  <div class="rd-10px">
    <div :style="{ height: headerHeight + 'px' }">
      <Header></Header>
    </div>
    <div class="flex" :style="{ height: `calc(100vh - ${headerHeight}px)` }">
      <Aside :style="{ width: sideWidth + 'px' }"></Aside>
      <div class="flex-1 theme-page rd-rb-10px">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './header/index.vue'
import Aside from './aside/index.vue'
import useThemeStore from '@renderer/stores/modules/theme'

const themeStore = useThemeStore()
const sideWidth = computed(() => {
  return themeStore.sideWidth
})

const headerHeight = computed(() => {
  return themeStore.headerHeight
})

// 监听主进程发送的 "resize-detected" 消息
window.electron.ipcRenderer.on('resize-detected', (event, data) => {
  const { width, height } = data

  // 当宽高大于 300x400 时，触发渲染进程的某个方法
  if (width > 303 && height > 403) {
    themeStore.setStatus({ type: 'collapsed', bool: false })
    themeStore.setSize({ type: 'sideWidth', size: 200 })
  } else {
    themeStore.setStatus({ type: 'collapsed', bool: true })
    themeStore.setSize({ type: 'sideWidth', size: 90 })
  }
})
</script>

<style lang="scss" scoped></style>
