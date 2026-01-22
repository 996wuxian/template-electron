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
          <template v-if="!isShow && !isFixed">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i i-solar-minimize-square-3-broken @click="handleDeskCenter"></i>
              </template>
              恢复窗口
            </n-tooltip>
          </template>

          <!-- 锁定按钮 -->
          <template v-if="!isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i
                  :class="
                    isLocked ? 'i-solar-lock-keyhole-bold' : 'i-solar-lock-keyhole-unlocked-broken'
                  "
                  :style="{ color: isLocked ? '#f0a020' : '' }"
                  @click="toggleLock"
                ></i>
              </template>
              {{ isLocked ? '解除锁定' : '锁定窗口' }}
            </n-tooltip>
          </template>

          <!-- 置顶按钮 -->
          <template v-if="!isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i
                  :class="isAlwaysOnTop ? 'i-solar-pin-bold' : 'i-solar-pin-broken'"
                  :style="{ color: isAlwaysOnTop ? '#20a0f0' : '' }"
                  @click="toggleAlwaysOnTop"
                ></i>
              </template>
              {{ isAlwaysOnTop ? '取消置顶' : '窗口置顶' }}
            </n-tooltip>
          </template>

          <!-- 限制按钮 -->
          <template v-if="!isShow">
            <n-tooltip trigger="hover">
              <template #trigger>
                <i
                  ref="restrictionButton"
                  :class="isRestricted ? 'i-solar-shield-check-bold' : 'i-solar-shield-broken'"
                  :style="{ color: isRestricted ? '#f02020' : '' }"
                  @click="toggleRestriction"
                ></i>
              </template>
              {{ isRestricted ? '解除限制' : '限制操作' }}
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
import { useDialog } from 'naive-ui'

const dialog = useDialog()
const useTheme = useThemeStore()
const useUser = useUserStore()
const drawerVisible = ref(false)
const isShow = ref(true)
const isFixed = ref(false)

const isLocked = ref(false)
const isAlwaysOnTop = ref(false)
const isRestricted = ref(false)

const header = ref<HTMLElement | null>(null)
const allowedButton = ref()

const restrictionButton = ref()

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
  const targetWidth = 360
  const targetHeight = 400
  const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
  const targetY = currentDisplay.bounds.y - 390

  window.electron.ipcRenderer.invoke('set-window-draggable', false)
  toggleDragState(false)

  setTimeout(() => {
    animateWindow(targetX, targetY, targetWidth, targetHeight, 15)
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
  targetHeight: number,
  step: number
) => {
  // 通过 IPC 命令触发主进程窗口动画
  await window.electron.ipcRenderer.invoke('animate-window', {
    targetX,
    targetY,
    targetWidth,
    targetHeight,
    step
  })
}

// 处理窗口缩小到右上角
const handlePinToDesktop = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: true })
  useTheme.setSize({ type: 'sideWidth', size: 90 })
  useUser.setStatus({ type: 'isRightTop', value: true })
  useUser.setStatus({ type: 'isHideMenu', value: true })
  isShow.value = false

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth } = currentDisplay.workAreaSize

  // 设置窗口目标位置和大小
  const targetWidth = 360
  const targetHeight = 400
  const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
  const targetY = currentDisplay.bounds.y + 50

  // 调用公共动画方法
  await window.electron.ipcRenderer.invoke('set-window-min-size', {
    width: targetWidth,
    height: targetHeight
  })
  await animateWindow(targetX, targetY, targetWidth, targetHeight, 15)
}

// 处理窗口恢复到居中
const handleDeskCenter = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: false })
  useTheme.setSize({ type: 'sideWidth', size: 200 })
  useUser.setStatus({ type: 'isRightTop', value: false })
  useUser.setStatus({ type: 'isHideMenu', value: false })
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
  await window.electron.ipcRenderer.invoke('set-window-min-size', {
    width: targetWidth,
    height: targetHeight
  })
  await animateWindow(targetX, targetY, targetWidth, targetHeight, 10)

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
  await animateWindow(targetX, targetY, targetWidth, targetHeight, 5)
}

const toggleLock = async () => {
  isLocked.value = !isLocked.value

  if (isLocked.value) {
    // 启用锁定：禁用窗口拖拽和调整大小
    await window.electron.ipcRenderer.invoke('set-window-draggable', false)
    toggleDragState(false)
  } else {
    // 解除锁定：恢复窗口拖拽和调整大小
    await window.electron.ipcRenderer.invoke('set-window-draggable', true)
    toggleDragState(true)
  }

  updateFixedState()
}

const toggleAlwaysOnTop = async () => {
  isAlwaysOnTop.value = !isAlwaysOnTop.value

  if (isAlwaysOnTop.value) {
    await window.electron.ipcRenderer.invoke('fix-window')
  } else {
    await window.electron.ipcRenderer.invoke('unfix-window')
  }

  updateFixedState()
}

const toggleRestriction = async () => {
  isRestricted.value = !isRestricted.value

  if (isRestricted.value) {
    // 启用限制：拦截点击事件
    document.addEventListener('click', interceptClicks, true)
  } else {
    // 解除限制：移除事件拦截
    document.removeEventListener('click', interceptClicks, true)
  }

  updateFixedState()
}

// 更新整体固定状态
const updateFixedState = () => {
  isFixed.value = isLocked.value || isAlwaysOnTop.value || isRestricted.value
}

// 取消所有固定状态
const handleUnfixAll = async () => {
  // 重置所有状态
  isLocked.value = false
  isAlwaysOnTop.value = false
  isRestricted.value = false
  isFixed.value = false

  // 恢复所有设置
  await window.electron.ipcRenderer.invoke('set-window-draggable', true)
  await window.electron.ipcRenderer.invoke('set-window-resizable', true)
  await window.electron.ipcRenderer.invoke('set-always-on-top', false)
  await window.electron.ipcRenderer.invoke('set-window-opacity', 1.0)
  toggleDragState(true)
  document.removeEventListener('click', interceptClicks, true)
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
  const d = dialog.warning({
    title: '关闭确认',
    content: '是否要完全退出应用？',
    positiveText: '退出应用',
    negativeText: '最小化到托盘',
    onPositiveClick: () => {
      localStorage.removeItem('theme')
      window.electron.ipcRenderer.invoke('close-window')
      d.destroy() // 关闭弹窗
    },
    onNegativeClick: async () => {
      await window.electron.ipcRenderer.invoke('hide-to-tray')
      d.destroy() // 关闭弹窗
    }
  })
}

// 全局事件拦截
const interceptClicks = (event: any) => {
  if (isRestricted.value) {
    // 允许点击解除限制按钮和取消所有固定按钮
    if (event.target !== allowedButton.value && event.target !== restrictionButton.value) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
}

onUnmounted(() => {
  document.removeEventListener('click', interceptClicks, true)
})

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
