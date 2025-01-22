<template>
  <header
    class="header"
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
          <i i-solar-maximize-square-3-broken @click="handlePinToDesktop"></i>
          <i v-if="!size" i-solar-maximize-square-broken @click="handleMaximize"></i>
          <i v-else i-solar-minimize-square-minimalistic-broken @click="handleMaximize"></i>
          <i i-solar-minimize-square-3-broken class="rotate-270" @click="handleMinimize"></i>
          <i v-if="theme" i-solar-sun-bold @click="toggleTheme('light')"></i>
          <i v-else i-solar-moon-fog-bold @click="toggleTheme('dark')"></i>
          <i i-solar-close-circle-bold @click="handleClose"></i>
        </div>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isDragging = ref(false)

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

const handlePinToDesktop = async () => {
  // 获取当前窗口所在的显示器信息
  const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
  if (!currentDisplay) return

  const { width: screenWidth } = currentDisplay.workAreaSize

  // 设置窗口大小为 300px 宽，400px 高
  await window.electron.ipcRenderer.invoke('set-window-size', { width: 300, height: 400 })

  // 将窗口移动到当前显示器的右上角
  const x = currentDisplay.bounds.x + screenWidth - 300 // 当前显示器的左上角 x 坐标 + 屏幕宽度 - 窗口宽度
  const y = currentDisplay.bounds.y // 当前显示器的左上角 y 坐标
  await window.electron.ipcRenderer.invoke('set-window-position', { x, y })
}

const size = ref(false)
const theme = ref(false)

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
  window.document.documentElement.setAttribute('data-theme', type)
}

// 关闭
const handleClose = () => {
  window.electron.ipcRenderer.invoke('close-window')
}
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
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
