<template>
  <div class="container">
    <n-modal v-model:show="modalShow" @mask-click="closeModal">
      <n-card style="width: 500px" title="设置" :bordered="false" size="small" role="dialog">
        <template #header-extra>
          <i
            i-solar-close-circle-bold
            class="w-20px h-20px text-gray cursor-pointer"
            @click="closeModal"
          ></i>
        </template>
        <div class="w-100% h-1px bg-gray opacity-20 mb-10px"></div>
        <div class="flex gap-10px flex-col">
          <div class="flex justify-between">
            记录存放格式：
            <n-radio-group v-model:value="radioValue" name="radiogroup" @update:value="updateRadio">
              <n-space>
                <n-radio v-for="song in songs" :key="song.value" :value="song.value">
                  {{ song.label }}
                </n-radio>
              </n-space>
            </n-radio-group>
          </div>
          <div class="flex justify-between items-center">
            导出今日计划：
            <div class="flex items-center">
              <n-button size="small" @click="exportTodayPlan">
                <template #icon>
                  <i i-solar-download-minimalistic-bold class="w-16px h-16px"></i>
                </template>
                导出
              </n-button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            导出历史待办：
            <div class="flex items-center">
              <n-button size="small" @click="exportHistoryTodos">
                <template #icon>
                  <i i-solar-archive-down-minimlistic-bold class="w-16px h-16px"></i>
                </template>
                导出
              </n-button>
            </div>
          </div>
          <div class="flex items-center">
            当前版本：
            <div class="flex items-center">
              <span>v{{ version }}</span>
            </div>
            <div class="flex items-center">
              <n-button class="ml-10px" size="tiny" :loading="isChecking" @click="checkUpdate">
                检查更新
              </n-button>
            </div>
            <n-button class="ml-auto" size="small" @click="clearCache">清除缓存</n-button>
          </div>
          <div v-if="hasNewVersion" class="flex items-center text-green-500">
            <span>发现新版本：v{{ latestVersion }}</span>
            <n-button
              class="ml-10px"
              size="tiny"
              type="primary"
              :loading="isUpdating"
              @click="startUpdate"
            >
              {{ updateButtonText }}
            </n-button>
          </div>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { $msg } from '@renderer/config/interaction.config'
import useUserStore from '@renderer/stores/modules/user'
const useUser = useUserStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const modalShow = ref(false)
const songs = ref([
  {
    value: 'txt',
    label: 'txt'
  },
  {
    value: 'excel',
    label: 'excel'
  }
])

const radioValue = ref(useUser.fileType || 'txt')

// 获取当前版本号
const version = ref('')

const updateRadio = () => {
  useUser.setValue({ type: 'fileType', value: radioValue.value })
}

const isChecking = ref(false)
const hasNewVersion = ref(false)
const latestVersion = ref('')
const downloadUrl = ref('')
const isUpdating = ref(false)
const updateButtonText = ref('立即更新')

const checkUpdate = async () => {
  try {
    isChecking.value = true
    const result = await window.electron.ipcRenderer.invoke('check-update')
    if (result.hasUpdate) {
      hasNewVersion.value = true
      latestVersion.value = result.latestVersion
      downloadUrl.value = result.downloadUrl
    } else {
      $msg({
        type: 'success',
        msg: '当前已是最新版本'
      })
    }
  } catch (error) {
    $msg({
      type: 'error',
      msg: '检查更新失败'
    })
    console.error('检查更新失败:', error)
  } finally {
    isChecking.value = false
  }
}

const startUpdate = async () => {
  window.electron.ipcRenderer.invoke('get-app-update')
}

watch(
  () => props.show,
  (val) => {
    modalShow.value = val
  }
)

const emit = defineEmits(['update:show'])

const closeModal = () => {
  emit('update:show', false)
}

const clearCache = () => {
  window.localStorage.clear()
}

// 导出今日计划
const exportTodayPlan = async () => {
  try {
    // 获取今日计划数据
    const todayData = await window.store.get('todayTodos')
    if (!todayData || todayData.length === 0) {
      $msg({
        type: 'warning',
        msg: '暂无今日计划数据'
      })
      return
    }

    // 调用导出功能
    const result = await window.electron.ipcRenderer.invoke('export-data', {
      data: todayData,
      type: 'today',
      format: radioValue.value
    })

    if (result.success) {
      $msg({
        type: 'success',
        msg: `今日计划导出成功！文件保存至: ${result.filePath}`
      })
    } else {
      if (result.error !== '用户取消导出') {
        $msg({
          type: 'error',
          msg: `导出失败: ${result.error}`
        })
      }
    }
  } catch (error) {
    console.error('导出今日计划失败:', error)
    $msg({
      type: 'error',
      msg: '导出失败，请重试'
    })
  }
}

// 导出历史待办
const exportHistoryTodos = async () => {
  try {
    // 获取历史数据
    const historyData = await window.store.get('historyData')
    if (!historyData || historyData.length === 0) {
      $msg({
        type: 'warning',
        msg: '暂无历史待办数据'
      })
      return
    }

    // 调用导出功能
    const result = await window.electron.ipcRenderer.invoke('export-data', {
      data: historyData,
      type: 'history',
      format: radioValue.value
    })

    if (result.success) {
      $msg({
        type: 'success',
        msg: `历史待办导出成功！文件保存至: ${result.filePath}`
      })
    } else {
      if (result.error !== '用户取消导出') {
        $msg({
          type: 'error',
          msg: `导出失败: ${result.error}`
        })
      }
    }
  } catch (error) {
    console.error('导出历史待办失败:', error)
    $msg({
      type: 'error',
      msg: '导出失败，请重试'
    })
  }
}

onMounted(async () => {
  // 从主进程获取版本号
  version.value = await window.electron.ipcRenderer.invoke('get-version')
})
</script>

<style scoped></style>
