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
          class="update-progress fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur p-6 shadow-lg z-50 border-t border-gray-100"
        >
          <div class="max-w-2xl mx-auto">
            <!-- 更新确认对话框 -->
            <div v-if="updateInfo.needConfirm" class="text-center">
              <i i-solar-download-square-line-duotone class="text-40px text-primary mb-2" />
              <h3 class="text-18px font-medium mb-2">发现新版本</h3>
              <p class="text-gray-500 mb-4">
                {{ updateInfo.version ? `v${updateInfo.version}` : '' }}
              </p>
              <div class="flex justify-center gap-3">
                <n-button @click="cancelUpdate">暂不更新</n-button>
                <n-button type="primary" @click="confirmUpdate">立即更新</n-button>
              </div>
            </div>

            <!-- 更新进度 -->
            <div v-else-if="!updateInfo.downloaded">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="text-16px font-medium mb-1">正在更新应用</h3>
                  <p class="text-gray-500 text-14px">{{ updateInfo.message }}</p>
                </div>
                <span class="text-16px font-medium text-primary"
                  >{{ Math.round(updateInfo.percent) }}%</span
                >
              </div>
              <n-progress
                :percentage="updateInfo.percent"
                :processing="updateInfo.percent < 100"
                type="line"
                :height="10"
                :border-radius="5"
                :indicator-placement="'inside'"
              >
                <span class="text-white text-12px">{{ Math.round(updateInfo.percent) }}%</span>
              </n-progress>
            </div>

            <!-- 更新完成确认 -->
            <div v-else class="text-center">
              <i i-solar-check-circle-line-duotone class="text-40px text-success mb-2" />
              <h3 class="text-18px font-medium mb-2">更新完成</h3>
              <p class="text-gray-500 mb-4">需要重启应用以应用更新</p>
              <div class="flex justify-center gap-3">
                <n-button @click="postponeRestart">稍后重启</n-button>
                <n-button type="primary" @click="restartNow">立即重启</n-button>
              </div>
            </div>
          </div>
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
  needConfirm: false,
  percent: 0,
  message: '正在检查更新...',
  downloaded: false,
  version: ''
})

// 取消更新
const cancelUpdate = () => {
  updateInfo.show = false
  updateInfo.needConfirm = false
}

// 确认更新
const confirmUpdate = () => {
  updateInfo.needConfirm = false
  window.electron.ipcRenderer.send('start-download')
}

// 稍后重启
const postponeRestart = () => {
  updateInfo.show = false
  updateInfo.downloaded = false
}

// 立即重启
const restartNow = () => {
  window.electron.ipcRenderer.send('quit-and-install')
}

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
})

// 监听检测到新版本
window.electron.ipcRenderer.on('update-available', (event, info) => {
  updateInfo.show = true
  updateInfo.needConfirm = true
  updateInfo.version = info.version
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

<style lang="scss" scoped>
.update-progress {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
