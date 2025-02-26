<script setup lang="ts">
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useOsTheme, darkTheme, zhCN, dateZhCN } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'
import { getThemeOverrides } from '@renderer/config/theme.config'
import useThemeStore from '@renderer/stores/modules/theme'
import useUserStore from '@renderer/stores/modules/user'

const useTheme = useThemeStore()
const useUser = useUserStore()
const osThemeRef = useOsTheme() // 跟随系统
const theme = ref<GlobalTheme | null>(null)
const themeType = computed(() => useTheme.themeType)
const osThemeType = computed(() => osThemeRef.value)
const themeOverrides = getThemeOverrides()
const winTop = computed(() => useUser.winTop)
const isTop = computed(() => useUser.isTop)
watch(
  () => [themeType.value, osThemeType.value],
  ([newType, newOsTheme]) => {
    if (newType === 'dark') {
      theme.value = darkTheme
    } else if (newType === 'default' && newOsTheme === 'dark') {
      theme.value = darkTheme
    } else {
      theme.value = null
    }
  },
  {
    immediate: true
  }
)

watch(
  () => winTop.value,
  async (val) => {
    if (isTop.value === '1' && val === '0') {
      // 显示应用窗口，调用 IPC 恢复窗口位置
      const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
      if (!currentDisplay) return

      const { width: screenWidth } = currentDisplay.workAreaSize

      // 设置窗口目标位置和大小
      const targetWidth = 300
      const targetHeight = 400
      const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
      const targetY = currentDisplay.bounds.y

      await window.electron.ipcRenderer.invoke('animate-window', {
        targetX,
        targetY,
        targetWidth,
        targetHeight,
        step: 15
      })
    } else if (isTop.value === '1' && val === '1') {
      // 显示应用窗口，调用 IPC 恢复窗口位置
      const currentDisplay = await window.electron.ipcRenderer.invoke('get-current-display')
      if (!currentDisplay) return

      const { width: screenWidth } = currentDisplay.workAreaSize

      // 设置窗口目标位置和大小
      const targetWidth = 300
      const targetHeight = 400
      const targetX = currentDisplay.bounds.x + screenWidth - targetWidth - 100
      const targetY = currentDisplay.bounds.y - 390

      await window.electron.ipcRenderer.invoke('animate-window', {
        targetX,
        targetY,
        targetWidth,
        targetHeight,
        step: 15
      })
    }
  }
)

onMounted(async () => {
  window.document.documentElement.setAttribute('data-theme', useTheme.$state.themeType)
  useUser.setTop({ type: 'isTop', value: '0' })
})
</script>

<template>
  <n-config-provider
    :theme-overrides="themeOverrides"
    :theme="theme"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-dialog-provider>
      <n-message-provider>
        <RouterView />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped lang="scss">
body {
  user-select: none;
}
</style>
