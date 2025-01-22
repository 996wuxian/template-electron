<template>
  <header
    class="header theme-page"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
  >
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
          <i v-if="!isShow" i-solar-minimize-square-3-broken @click="handleDeskCenter"></i>
          <i
            v-if="!isShow && isFixed"
            i-solar-pin-bold
            @click="handleFixedDesktop('unfix-window')"
          ></i>
          <i
            v-if="!isShow && !isFixed"
            i-solar-pin-broken
            @click="handleFixedDesktop('fix-window')"
          ></i>
          <template v-if="isShow">
            <i i-solar-widget-bold @click="toggleFloating"></i>
            <i i-solar-maximize-square-3-broken @click="handlePinToDesktop"></i>
            <i v-if="!size" i-solar-maximize-square-broken @click="handleMaximize"></i>
            <i v-else i-solar-minimize-square-minimalistic-broken @click="handleMaximize"></i>
            <i i-solar-minimize-square-3-broken class="rotate-270" @click="handleMinimize"></i>
          </template>
          <i v-if="isShow" i-solar-widget-4-broken @click="handleDrawer"></i>
          <i v-if="theme" i-solar-sun-bold @click="toggleTheme('light')"></i>
          <i v-else i-solar-moon-fog-bold @click="toggleTheme('dark')"></i>
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

const useTheme = useThemeStore()
const isDragging = ref(false)
const drawerVisible = ref(false)
const isShow = ref(true)
const isFixed = ref(false)

const handleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const startDrag = async (e: MouseEvent) => {
  if (e.target !== e.currentTarget) return // 如果点击的是子元素则不处理
  isDragging.value = true
  await window.electron.ipcRenderer.invoke('start-drag', {
    x: e.screenX,
    y: e.screenY
  })
}

const onDrag = async (e: MouseEvent) => {
  if (!isDragging.value) return
  await window.electron.ipcRenderer.invoke('window-drag', {
    x: e.screenX,
    y: e.screenY
  })
}

const endDrag = async () => {
  if (!isDragging.value) return
  isDragging.value = false
  await window.electron.ipcRenderer.invoke('end-drag')
}

const handleDeskCenter = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: false })
  useTheme.setSize({ type: 'sideWidth', size: 200 })
  isShow.value = true

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  await window.electron.ipcRenderer.invoke('set-window-size', {
    width: 900,
    height: 670,
    center: true
  })

  // 将窗口居中到当前显示器
  const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
  const { x: screenX, y: screenY } = currentDisplay.bounds
  const x = screenX + (screenWidth - 900) / 2 // 居中 x 坐标
  const y = screenY + (screenHeight - 670) / 2 // 居中 y 坐标
  await window.electron.ipcRenderer.invoke('restore-window-position', { x, y })
}

const handleFixedDesktop = async (type: string) => {
  isFixed.value = !isFixed.value
  await window.electron.ipcRenderer.invoke(type)
}

const handlePinToDesktop = async () => {
  useTheme.setStatus({ type: 'collapsed', bool: true })
  useTheme.setSize({ type: 'sideWidth', size: 90 })
  isShow.value = false

  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth } = currentDisplay.workAreaSize

  // 设置窗口大小为 300px 宽，400px 高
  await window.electron.ipcRenderer.invoke('set-window-size', {
    width: 300,
    height: 400,
    center: false
  })

  // 将窗口移动到当前显示器的右上角
  const x = currentDisplay.bounds.x + screenWidth - 300 // 当前显示器的左上角 x 坐标 + 屏幕宽度 - 窗口宽度
  const y = currentDisplay.bounds.y // 当前显示器的左上角 y 坐标
  await window.electron.ipcRenderer.invoke('set-window-position', { x, y })
}

const size = ref(false)
const theme = ref(false)

// 添加切换悬浮窗的方法
const toggleFloating = async () => {
  await window.electron.ipcRenderer.invoke('toggle-floating-window')

  // 隐藏主窗口
  await window.electron.ipcRenderer.invoke('hide-main-window')
}

// 放大
const handleMaximize = () => {
  size.value = !size.value
  window.electron.ipcRenderer.invoke('maximize-window')
}

// 缩小
const handleMinimize = () => {
  window.electron.ipcRenderer.invoke('minimize-window')
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
