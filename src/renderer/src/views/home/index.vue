<template>
  <div class="flex flex-col h-full shadow-lg">
    <!-- 修改这部分 -->
    <div class="window-list p-10px">
      <div class="text-14px mb-10px">采集到的窗口</div>
      <div class="scroll-container">
        <div class="flex gap-15px">
          <div
            v-for="window in windows"
            :key="window.id"
            class="window-item shrink-0"
            :class="{ active: selectedWindow?.id === window.id }"
            @click="selectWindow(window)"
          >
            <img
              :src="window.thumbnail"
              :alt="window.name"
              class="w-200px h-120px object-cover rounded-8px"
            />
            <div class="window-name mt-8px text-14px truncate max-w-200px">{{ window?.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览和控制区域 -->
    <div v-if="selectedWindow" class="preview-area flex-1 relative">
      <div v-if="isRecording" class="recording-status">
        <div class="flex items-center gap-2">
          <div class="recording-dot" :class="{ paused: isPaused }"></div>
          <span>{{ isPaused ? '已暂停' : '正在录制中' }}</span>
          <span>已录制: {{ recordingTime }}</span>
        </div>
      </div>

      <div class="preview-window bg-gray-100 rounded-8px p-15px relative">
        <video ref="videoRef" class="w-full max-h-[calc(100vh-380px)] object-contain"></video>
        <!-- 修改选区层 -->
        <div
          v-if="isSelectingArea || (selectedArea.width > 0 && isRecording)"
          class="select-area-overlay absolute inset-0"
          @mousedown="startSelection"
          @mousemove="updateSelection"
          @mouseup="endSelection"
        >
          <div
            v-if="selectionBox.isDrawing || selectedArea.width > 0"
            class="selection-box absolute"
            :style="{
              left: `${selectionBox.isDrawing ? selectionBox.x : selectedArea.x}px`,
              top: `${selectionBox.isDrawing ? selectionBox.y : selectedArea.y}px`,
              width: `${selectionBox.isDrawing ? selectionBox.width : selectedArea.width}px`,
              height: `${selectionBox.isDrawing ? selectionBox.height : selectedArea.height}px`
            }"
          ></div>
        </div>
      </div>

      <div class="control-panel mt-15px flex justify-center gap-15px items-center">
        <n-tooltip v-if="!isRecording && !isSelectingArea" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="toggleRecording"
            >
              <img class="w-30px h-30px cursor-pointer" src="@renderer/assets/img/start.png" />
            </button>
          </template>
          开始录制
        </n-tooltip>

        <n-tooltip v-else-if="isRecording && !isSelectingArea" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="toggleRecording"
            >
              <svg-icon name="stop" class="cursor-pointer" :width="30" :height="30" />
            </button>
          </template>
          结束录制
        </n-tooltip>

        <n-tooltip v-if="isRecording && !isPaused" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="togglePause"
            >
              <svg-icon name="zhanting" class="cursor-pointer" :width="25" :height="25" />
            </button>
          </template>
          暂停录制
        </n-tooltip>

        <n-tooltip v-else-if="isRecording && isPaused" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="togglePause"
            >
              <svg-icon name="jixu" class="cursor-pointer" :width="30" :height="30" />
            </button>
          </template>
          继续录制
        </n-tooltip>

        <n-tooltip v-if="!isSelectingArea && !isRecording" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="toggleAreaSelection"
            >
              <svg-icon name="kuang" class="cursor-pointer" :width="30" :height="30" />
            </button>
          </template>
          框选录制
        </n-tooltip>

        <n-tooltip v-else-if="isSelectingArea && !isRecording" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="toggleAreaSelection"
            >
              <svg-icon name="no-kuang" class="cursor-pointer" :width="30" :height="30" />
            </button>
          </template>
          取消框选
        </n-tooltip>

        <div v-if="!isRecording && !isSelectingArea">
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="flex items-center justify-center focus:outline-none bg-transparent"
                @click="changeRecordingAudio"
              >
                <svg-icon
                  :name="isRecordingAudio ? 'sound' : 'mute'"
                  class="cursor-pointer"
                  :width="30"
                  :height="30"
                  role="img"
                />
              </button>
            </template>
            {{ isRecordingAudio ? '录制时包含声音' : '录制时不包含声音' }}
          </n-tooltip>
        </div>

        <n-tooltip v-if="!isSelectingArea && !isRecording" trigger="hover">
          <template #trigger>
            <button
              class="flex items-center justify-center focus:outline-none bg-transparent"
              @click="refreshWindows"
            >
              <svg-icon name="shuaxin" class="cursor-pointer" :width="30" :height="30" />
            </button>
          </template>
          刷新窗口列表
        </n-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RecordRTC from 'recordrtc'

interface Window {
  id: string
  name: string
  thumbnail: string
}

const windows = ref<Window[]>([])
const selectedWindow = ref<Window | null>(null)
const isRecording = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordingTime = ref('00:00')
let recordingInterval: NodeJS.Timer | null = null
const isRecordingAudio = ref(false)
// 添加暂停状态
const isPaused = ref(false)
// 添加已选择区域的状态
const selectedArea = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

// 获取窗口列表
const refreshWindows = async () => {
  try {
    const sources = await window.electron.ipcRenderer.invoke('get-sources')
    windows.value = sources.filter((source: any) => source.thumbnail.length > 100)
    selectWindow(windows.value[0])
  } catch (error) {
    console.error('获取窗口列表失败:', error)
  }
}

// 初始化加载窗口列表
refreshWindows()

// 添加暂停功能
const togglePause = () => {
  if (!mediaRecorder.value) return

  isPaused.value = !isPaused.value
  if (isPaused.value) {
    mediaRecorder.value.pauseRecording()
    // 暂停计时器
    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
  } else {
    mediaRecorder.value.resumeRecording()
    // 恢复计时器
    const startTime =
      Date.now() -
      parseInt(recordingTime.value.split(':')[0]) * 60000 -
      parseInt(recordingTime.value.split(':')[1]) * 1000
    recordingInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
        .toString()
        .padStart(2, '0')
      const seconds = (elapsed % 60).toString().padStart(2, '0')
      recordingTime.value = `${minutes}:${seconds}`
    }, 1000)
  }
}

// 选择窗口
const selectWindow = async (window: Window) => {
  selectedWindow.value = window
  try {
    // 获取原始窗口流
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: window.id
        }
      }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.play()
    }
  } catch (error) {
    console.error('Error accessing media devices:', error)
  }
}

// 添加计时器启动函数
const startRecordingTimer = () => {
  const startTime = Date.now()
  recordingInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0')
    const seconds = (elapsed % 60).toString().padStart(2, '0')
    recordingTime.value = `${minutes}:${seconds}`
  }, 1000)
}

// 提取 RecordRTC 配置
const getRecordRTCConfig = (width: number, height: number) => ({
  type: 'video',
  mimeType: 'video/webm;codecs=vp9',
  frameRate: 60,
  quality: 100,
  width,
  height,
  videoBitsPerSecond: 50000000,
  bitsPerSecond: 50000000,
  videoRecorderType: 'MediaRecorder',
  disableLogs: true,
  timeSlice: 1000
})

// 直接录制方法
const startDirectRecording = async () => {
  if (!videoRef.value?.srcObject) return
  const videoElement = videoRef.value

  try {
    // 直接使用视频流进行录制
    mediaRecorder.value = new RecordRTC(
      videoElement.srcObject,
      getRecordRTCConfig(videoElement.videoWidth, videoElement.videoHeight)
    )

    mediaRecorder.value.startRecording()
    isRecording.value = true
    startRecordingTimer()
  } catch (error) {
    console.error('录制失败:', error)
  }
}

// 框选录制方法
const startAreaRecording = async () => {
  if (!videoRef.value?.srcObject) return

  try {
    // 原有的 canvas 录制逻辑
    const videoElement = videoRef.value
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    })
    if (!ctx || !videoElement) return

    // 计算视频实际显示区域
    const videoRect = videoElement.getBoundingClientRect()
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight
    const containerAspectRatio = videoRect.width / videoRect.height

    // 根据比例计算实际渲染尺寸和位置
    let renderWidth = videoRect.width
    let renderHeight = videoRect.height
    let renderX = 0
    let renderY = 0

    // 保持宽高比例计算
    if (containerAspectRatio > videoAspectRatio) {
      renderWidth = videoRect.height * videoAspectRatio
      renderX = (videoRect.width - renderWidth) / 2
    } else {
      renderHeight = videoRect.width / videoAspectRatio
      renderY = (videoRect.height - renderHeight) / 2
    }

    // 根据是否有选区来设置画布尺寸
    if (selectedArea.value.width && selectedArea.value.height) {
      // 选区模式：计算实际选区大小
      const scaleX = videoElement.videoWidth / renderWidth
      const scaleY = videoElement.videoHeight / renderHeight
      const adjustedWidth = selectedArea.value.width * scaleX
      const adjustedHeight = selectedArea.value.height * scaleY
      canvas.width = adjustedWidth
      canvas.height = adjustedHeight
    } else {
      // 如果没有选区，使用原始视频尺寸
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const drawFrame = () => {
      if (!ctx || !videoElement) return
      try {
        if (selectedArea.value.width && selectedArea.value.height) {
          // 有选区时的绘制逻辑
          const scaleX = videoElement.videoWidth / renderWidth
          const scaleY = videoElement.videoHeight / renderHeight
          const adjustedX = (selectedArea.value.x - renderX - 10) * scaleX
          const adjustedY = (selectedArea.value.y - renderY - 12) * scaleY
          const adjustedWidth = selectedArea.value.width * scaleX
          const adjustedHeight = selectedArea.value.height * scaleY

          ctx.drawImage(
            videoElement,
            adjustedX,
            adjustedY,
            adjustedWidth,
            adjustedHeight,
            0,
            0,
            canvas.width,
            canvas.height
          )
        } else {
          // 无选区时直接绘制整个视频
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        }
        if (isRecording.value) {
          requestAnimationFrame(drawFrame)
        }
      } catch (err) {
        console.error('绘制帧时出错:', err)
      }
    }

    const stream = canvas.captureStream(60)
    mediaRecorder.value = new RecordRTC(stream, getRecordRTCConfig(canvas.width, canvas.height))
    // 开始录制
    mediaRecorder.value.startRecording()
    isRecording.value = true
    drawFrame()
    startRecordingTimer()
  } catch (error) {
    console.error('录制失败:', error)
  }
}

// 修改 toggleRecording 方法
const toggleRecording = async () => {
  if (!videoRef.value?.srcObject) return

  if (!isRecording.value) {
    // 根据是否有选区决定使用哪种录制方式
    if (selectedArea.value.width && selectedArea.value.height) {
      await startAreaRecording()
    } else {
      await startDirectRecording()
    }
  } else {
    // 停止录制逻辑保持不变
    if (mediaRecorder.value) {
      mediaRecorder.value.stopRecording(() => {
        const blob = mediaRecorder.value.getBlob()
        console.log('🚀 ~ mediaRecorder.value.stopRecording ~ blob:', blob)
        if (blob.size === 0) {
          console.error('录制的视频大小为0')
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `recording-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()

        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 100)

        // 清空选区
        selectedArea.value = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      })
    }
    isRecording.value = false
    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
    recordingTime.value = '00:00'
  }
}

const changeRecordingAudio = async () => {
  isRecordingAudio.value = !isRecordingAudio.value
  const source = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
  console.log('🚀 ~ changeRecordingAudio ~ source:', source)
}

// 添加新的状态
const isSelectingArea = ref(false)
const selectionBox = ref({
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  isDrawing: false
})

// 切换区域选择模式
const toggleAreaSelection = () => {
  isSelectingArea.value = !isSelectingArea.value
  if (!isSelectingArea.value) {
    // 清除选区
    selectedArea.value = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  }
  selectionBox.value.isDrawing = false
}

// 开始选择
const startSelection = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const videoElement = videoRef.value

  if (!videoElement) return

  const videoRect = videoElement.getBoundingClientRect()
  const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight
  const containerAspectRatio = videoRect.width / videoRect.height

  let renderX = 0
  let renderY = 0

  if (containerAspectRatio > videoAspectRatio) {
    const renderWidth = videoRect.height * videoAspectRatio
    renderX = (videoRect.width - renderWidth) / 2
  } else {
    const renderHeight = videoRect.width / videoAspectRatio
    renderY = (videoRect.height - renderHeight) / 2
  }

  const x = Math.max(renderX, Math.min(e.clientX - rect.left, videoRect.width - renderX))
  const y = Math.max(renderY, Math.min(e.clientY - rect.top, videoRect.height - renderY))

  selectionBox.value = {
    startX: x,
    startY: y,
    x,
    y,
    width: 0,
    height: 0,
    isDrawing: true
  }
}

// 更新选择框
const updateSelection = (e: MouseEvent) => {
  if (!selectionBox.value.isDrawing) return

  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const videoElement = videoRef.value

  if (!videoElement) return

  // 获取视频实际显示尺寸和位置
  const videoRect = videoElement.getBoundingClientRect()

  // 计算视频在容器中的实际显示区域
  const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight
  const containerAspectRatio = videoRect.width / videoRect.height

  let renderWidth = videoRect.width
  let renderHeight = videoRect.height
  let renderX = 0
  let renderY = 0

  // 根据 object-contain 的规则计算实际显示区域
  if (containerAspectRatio > videoAspectRatio) {
    renderWidth = renderHeight * videoAspectRatio
    renderX = (videoRect.width - renderWidth) / 2
  } else {
    renderHeight = renderWidth / videoAspectRatio
    renderY = (videoRect.height - renderHeight) / 2
  }

  // 计算鼠标位置相对于实际视频显示区域的坐标
  const currentX = Math.max(renderX, Math.min(renderX + renderWidth, e.clientX - rect.left))
  const currentY = Math.max(renderY, Math.min(renderY + renderHeight, e.clientY - rect.top))

  const width = currentX - selectionBox.value.startX
  const height = currentY - selectionBox.value.startY

  // 更新选框位置和大小
  selectionBox.value.x = width < 0 ? currentX : selectionBox.value.startX
  selectionBox.value.y = height < 0 ? currentY : selectionBox.value.startY
  selectionBox.value.width = Math.abs(width)
  selectionBox.value.height = Math.abs(height)
}

// 结束选择
const endSelection = () => {
  if (selectionBox.value.width < 10 || selectionBox.value.height < 10) {
    selectionBox.value.isDrawing = false
    return
  }

  // 保存选择的区域
  selectedArea.value = {
    x: selectionBox.value.x,
    y: selectionBox.value.y,
    width: selectionBox.value.width,
    height: selectionBox.value.height
  }

  selectionBox.value.isDrawing = false
  isSelectingArea.value = false
  // 开始录制
  toggleRecording()
}
</script>

<style scoped>
/* 修改和添加以下样式 */
.window-list {
  @apply w-full;
}

.scroll-container {
  @apply w-full overflow-x-auto;
  padding-bottom: 10px; /* 为滚动条预留空间 */
}

.window-item {
  @apply cursor-pointer transition-all duration-300 p-10px rounded-8px border-2;
  min-width: 220px; /* 确保每个项目有最小宽度 */

  &.active {
    @apply border-blue;
  }
}

/* 修改滚动条样式 */
.scroll-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

.scroll-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* 其他样式保持不变 */
.select-area-overlay {
  cursor: crosshair;
  background: rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.selection-box {
  border: 2px solid #2080f0;
  background: rgba(32, 128, 240, 0.2);
  pointer-events: none;
  z-index: 11;
}

.preview-window {
  overflow: hidden;
}

.recording-status {
  @apply fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full z-50 flex items-center;
}

.recording-dot {
  @apply w-3 h-3 rounded-full bg-white animate-pulse mr-2;
}
</style>
