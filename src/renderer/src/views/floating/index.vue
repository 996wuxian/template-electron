<template>
  <div class="floating-window" :class="{ expanded: isExpanded }">
    <!-- 主图标 -->
    <div class="inner-circle theme-page" @mousedown.stop="handleMouseDown">
      <div class="click-area">
        <i i-solar-widget-bold></i>
      </div>
    </div>

    <div v-show="isMenuOpen" class="menu-icons">
      <div
        v-for="(icon, index) in icons"
        :key="index"
        :style="getIconStyle(index)"
        class="menu-icon theme-page"
        @click.stop="handleIconClick(icon)"
      >
        <i :class="icon"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
onMounted(() => {
  const type = JSON.parse(localStorage.getItem('theme') as string) || { themeType: 'light' }
  window.document.documentElement.setAttribute('data-theme', type.themeType)
})

const isExpanded = ref(false)
let isDragging = false
let initialMouseX = 0
let initialMouseY = 0
let mouseDownTime = 0
let windowInitialX = 0
let windowInitialY = 0

// 处理鼠标按下事件
const handleMouseDown = (e: MouseEvent) => {
  if (isExpanded.value) return // 展开状态不允许拖动

  isDragging = false
  initialMouseX = e.screenX // 使用screenX/screenY获取相对于屏幕的坐标
  initialMouseY = e.screenY
  mouseDownTime = Date.now()
  // 获取窗口初始位置
  window.electron.ipcRenderer.invoke('get-position').then(([x, y]: [number, number]) => {
    windowInitialX = x
    windowInitialY = y

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })
}

// 处理鼠标移动事件
const handleMouseMove = (e: MouseEvent) => {
  if (e.target !== e.currentTarget) return // 如果点击的是子元素则不处理
  const deltaX = e.screenX - initialMouseX
  const deltaY = e.screenY - initialMouseY

  // 判断是否达到拖动阈值
  if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
    isDragging = true
  }

  if (isDragging) {
    // 计算新位置
    const newX = windowInitialX + deltaX
    const newY = windowInitialY + deltaY

    // 发送新位置到主进程
    window.electron.ipcRenderer.invoke('set-position', { x: newX, y: newY })
  }
}

const handleMouseUp = () => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 如果不是拖拽且点击时间小于200ms，则触发展开/收起
  if (!isDragging && Date.now() - mouseDownTime < 200) {
    toggleMenu()
  }
}

// 控制菜单是否打开
const isMenuOpen = ref(false)

// 图标列表
const icons = ref([
  'i-solar-home-bold' // 首页
  // 'i-solar-settings-bold', // 设置
  // 'i-solar-chat-round-bold', // 聊天
  // 'i-solar-star-bold' // 收藏
])

// 切换菜单状态
const toggleMenu = () => {
  console.log('点击了主图标') // 调试日志
  isMenuOpen.value = !isMenuOpen.value
}

// 处理图标点击事件
const handleIconClick = (icon: string) => {
  isMenuOpen.value = !isMenuOpen.value

  if (icon === 'i-solar-home-bold') {
    // 打开主窗口
    window.electron.ipcRenderer.invoke('show-main-window')
    // 关闭悬浮窗
    window.electron.ipcRenderer.invoke('destroy-floating-window')
  }
}

// 计算每个图标的位置
const getIconStyle = (index: number) => {
  const angle = 35 * index - 180 // 扇形分布的角度
  const radius = 100 // 半径
  const x = radius * Math.cos((angle * Math.PI) / 180)
  const y = radius * Math.sin((angle * Math.PI) / 180)
  return {
    transform: `translate(${x}px, ${y}px)`,
    transitionDelay: `${index * 0.1}s` // 依次延迟显示
  }
}
</script>

<style scoped lang="scss">
.floating-window {
  width: 300px;
  height: 300px;
  background: transparent;
  /* background-color: red; */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.inner-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  // background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  -webkit-app-region: drag; /* 使整个header可拖拽 */
}

/* 中心点击区域 */
.click-area {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 确保点击区域在拖拽层上方 */
  -webkit-app-region: no-drag; /* 使整个header可拖拽 */
}

.inner-circle:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 1);
}

/* 扇形分布的图标容器 */
.menu-icons {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}

/* 每个图标 */
.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  // background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

/* 图标显示时的动画 */
.menu-icons .menu-icon {
  opacity: 1;
  transform: translate(var(--x), var(--y));
}

// /* 暗色主题支持 */
// :root[data-theme='dark'] .inner-circle {
//   background: rgba(40, 40, 40, 0.9);
// }

// :root[data-theme='dark'] .inner-circle:hover {
//   background: rgba(40, 40, 40, 1);
// }

// :root[data-theme='dark'] .menu-icon {
//   background: rgba(40, 40, 40, 0.9);
// }

// :root[data-theme='dark'] .menu-icon:hover {
//   background: rgba(40, 40, 40, 1);
// }
</style>
