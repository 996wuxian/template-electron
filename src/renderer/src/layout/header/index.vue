<template>
  <header ref="header" class="header theme-page rd-t-10px">
    <!-- 左侧插槽 -->
    <div class="left">
      <slot name="left"></slot>
    </div>

    <!-- 中间插槽 -->
    <div class="center">
      <slot name="center"></slot>
    </div>

    <!-- 右侧插槽，如果没有插槽内容则显示默认按钮 -->
    <div class="right">
      <slot name="right">
        <div class="flex gap-15px text-18px cursor-pointer icons">
          <template v-if="!isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-minimize-square-3-broken @click="handleDeskCenter"></i>
              </template>
              恢复窗口
            </n-tooltip>
          </template>

          <template v-if="!isShow && isFixed">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-pin-bold @click="handleFixedDesktop('unfix-window')"></i>
              </template>
              取消固定
            </n-tooltip>
          </template>

          <template v-if="!isShow && !isFixed">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-pin-broken @click="handleFixedDesktop('fix-window')"></i>
              </template>
              固定
            </n-tooltip>
          </template>

          <template v-if="isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-minimize-square-3-broken class="rotate-270" @click="toggleFloating"></i>
              </template>
              悬浮窗
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-upload-square-broken @click="handleWindowResizeAndAnimate"></i>
              </template>
              收缩至顶部
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-maximize-square-3-broken @click="handlePinToDesktop"></i>
              </template>
              固定至右上角
            </n-tooltip>

            <template v-if="!size">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <i i-solar-maximize-square-broken @click="handleFullScreen"></i>
                </template>
                全屏
              </n-tooltip>
            </template>

            <template v-else>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <i i-solar-minimize-square-minimalistic-broken @click="handleDeskCenter"></i>
                </template>
                缩小
              </n-tooltip>
            </template>

            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-minimize-square-3-broken @click="handleMinimize"></i>
              </template>
              最小化
            </n-tooltip>
          </template>

          <template v-if="isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-widget-4-broken @click="handleDrawer"></i>
              </template>
              主题
            </n-tooltip>
          </template>

          <template v-if="theme">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-sun-bold @click="toggleTheme('light')"></i>
              </template>
              亮色模式
            </n-tooltip>
          </template>
          <template v-else>
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-moon-fog-bold @click="toggleTheme('dark')"></i>
              </template>
              暗色模式
            </n-tooltip>
          </template>
          <i i-solar-close-circle-bold @click="handleClose"></i>
        </div>
      </slot>
    </div>
  </header>
  <Drawer :drawer-show="drawerVisible" :width="300" @close="handleDrawer"></Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Drawer from './components/Drawer.vue'
import useThemeStore from '@renderer/stores/modules/theme'
import useUserStore from '@renderer/stores/modules/user'

const useTheme = useThemeStore()
const useUser = useUserStore()
const drawerVisible = ref(false)
const isShow = ref(true)
const isFixed = ref(false)

const header = ref<HTMLElement | null>(null)

const handleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

// 定义鼠标进入和离开的事件处理函数
const handleMouseEnter = async () => {
  useUser.setTop({ type: 'winTop', value: '0' })
}

const handleMouseLeave = async () => {
  useUser.setTop({ type: 'winTop', value: '1' })
}

// 贴边隐藏
const handleWindowResizeAndAnimate = async () => {
  handlePinToDesktop()

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return
  const { width: screenWidth } = currentDisplay.workAreaSize
  // 设置窗口目标位置和大小
  const targetWidth = 300
  const targetHeight = 400
  const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
  const targetY = currentDisplay.bounds.y - 390

  window.electron.ipcRenderer.invoke('set-window-draggable', false)
  toggleDragState(false)

  setTimeout(() => {
    animateWindow(targetX, targetY, targetWidth, targetHeight)
    useUser.setTop({ type: 'isTop', value: '1' })
    useUser.setTop({ type: 'winTop', value: '1' })

    window.document.addEventListener('mouseenter', handleMouseEnter)

    window.document.addEventListener('mouseleave', handleMouseLeave)
  }, 1000)
}

const toggleDragState = (isDraggable: boolean) => {
  if (header.value) {
    ;(header.value.style as any).webkitAppRegion = isDraggable ? 'drag' : 'no-drag'
  }
}

// 通用的 animateWindow 方法，用于触发窗口的动画
const animateWindow = async (
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number
) => {
  // 通过 IPC 命令触发主进程窗口动画
  await window.electron.ipcRenderer.invoke('animate-window', {
    targetX,
    targetY,
    targetWidth,
    targetHeight
  })
}

// 处理窗口缩小到右上角
const handlePinToDesktop = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: true })
  useTheme.setSize({ type: 'sideWidth', size: 90 })
  isShow.value = false

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth } = currentDisplay.workAreaSize

  // 设置窗口目标位置和大小
  const targetWidth = 300
  const targetHeight = 400
  const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
  const targetY = currentDisplay.bounds.y + 50

  // 调用公共动画方法
  await animateWindow(targetX, targetY, targetWidth, targetHeight)
}

// 处理窗口恢复到居中
const handleDeskCenter = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: false })
  useTheme.setSize({ type: 'sideWidth', size: 200 })
  isShow.value = true
  size.value = !size.value

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
  const { x: screenX, y: screenY } = currentDisplay.bounds

  // 设置窗口目标位置和大小
  const targetWidth = 900
  const targetHeight = 670
  const targetX = screenX + (screenWidth - 900) / 2
  const targetY = screenY + (screenHeight - 670) / 2

  // 调用公共动画方法
  await animateWindow(targetX, targetY, targetWidth, targetHeight)

  // 移除鼠标进入事件
  window.document.removeEventListener('mouseenter', handleMouseEnter)

  // 移除鼠标离开事件
  window.document.removeEventListener('mouseleave', handleMouseLeave)

  await useUser.setTop({ type: 'isTop', value: '0' })
  useUser.setTop({ type: 'winTop', value: '0' })

  toggleDragState(true)
  window.electron.ipcRenderer.invoke('set-window-draggable', true)
}

// 处理窗口全屏
const handleFullScreen = async () => {
  size.value = !size.value

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
  const { x: screenX, y: screenY } = currentDisplay.bounds

  // 设置窗口目标位置和大小为全屏
  const targetWidth = screenWidth
  const targetHeight = screenHeight
  const targetX = screenX
  const targetY = screenY

  // 调用公共动画方法
  await animateWindow(targetX, targetY, targetWidth, targetHeight)
}

const handleFixedDesktop = async (type: string) => {
  isFixed.value = !isFixed.value
  await window.electron.ipcRenderer.invoke(type)
}

const size = ref(false)
const theme = ref(false)

// 添加切换悬浮窗的方法
const toggleFloating = async () => {
  await window.electron.ipcRenderer.invoke('toggle-floating-window')

  // 隐藏主窗口
  await window.electron.ipcRenderer.invoke('hide-main-window')
}

// 最小化
const handleMinimize = async () => {
  await window.electron.ipcRenderer.invoke('toggle-minimize-animation')
}
// 主题
const toggleTheme = (type: string) => {
  theme.value = !theme.value
  useTheme.setThemeType({ themeType: type })
  window.document.documentElement.setAttribute('data-theme', type)
}

// 关闭
const handleClose = () => {
  localStorage.removeItem('theme')
  window.electron.ipcRenderer.invoke('close-window')
}

onMounted(() => {
  if (header.value) {
    ;(header.value.style as any).webkitAppRegion = 'drag' // 设置为可拖拽
  }
})
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  -webkit-app-region: drag; /* 使整个header可拖拽 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.left,
.center,
.right {
  display: flex;
  align-items: center;
}

.right button {
  margin-left: 10px;
}

.icons {
  i {
    -webkit-app-region: no-drag;
  }
  i:hover {
    color: #5e5e5e;
    transition: all 0.3s;
  }
}
</style>
