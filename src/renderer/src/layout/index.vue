<template>
  <div class="rd-10px">
    <div :style="{ height: headerHeight + 'px' }">
      <Header></Header>
    </div>
    <div class="flex" :style="{ height: `calc(100vh - ${headerHeight}px)` }">
      <Aside :style="{ width: sideWidth + 'px' }"></Aside>
      <div class="flex-1 theme-page rd-rb-10px">
        <router-view />
        <!-- 更新进度条 -->
        <div
          v-if="updateInfo.show"
          class="update-progress fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg z-50"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-700">{{ updateInfo.message }}</span>
            <span class="text-sm text-gray-500">{{ Math.round(updateInfo.percent) }}%</span>
          </div>
          <n-progress
            :percentage="updateInfo.percent"
            :processing="updateInfo.percent < 100"
            :height="6"
            :border-radius="4"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './header/index.vue'
import Aside from './aside/index.vue'
import useThemeStore from '@renderer/stores/modules/theme'
import { $msg } from '@renderer/config/interaction.config'

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

const updateInfo = reactive({
  show: false,
  percent: 0,
  message: '正在检查更新...',
  downloaded: false
})

// 监听更新进度
window.electron.ipcRenderer.on('update-progress', (event, data) => {
  updateInfo.show = true
  updateInfo.percent = data.percent
  updateInfo.message = `正在下载更新...${(data.transferred / 1024 / 1024).toFixed(2)}MB/${(
    data.total /
    1024 /
    1024
  ).toFixed(2)}MB`
})

// 监听更新完成
window.electron.ipcRenderer.on('update-downloaded', () => {
  updateInfo.downloaded = true
  updateInfo.message = '更新下载完成'
  updateInfo.percent = 100

  $msg({
    type: 'success',
    msg: '新版本已下载完成，点击确定立即安装'
  })
  window.electron.ipcRenderer.send('quit-and-install')
})

// 监听检测到新版本
window.electron.ipcRenderer.on('update-available', () => {
  updateInfo.show = true
  updateInfo.message = '检测到新版本，正在准备下载...'
})

// 监听没有新版本
window.electron.ipcRenderer.on('update-not-available', () => {
  updateInfo.show = false
})

// 监听更新错误
window.electron.ipcRenderer.on('update-error', (event, error) => {
  updateInfo.show = false
  $msg({
    type: 'error',
    msg: `更新出错：${error}`
  })
})
</script>

<style lang="scss" scoped></style>
