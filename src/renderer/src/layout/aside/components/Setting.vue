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
          <div class="flex justify-between">
            记录存放位置：
            <div class="flex items-center">
              {{ filePath?.filePaths[0] }}
              <i
                i-solar-pen-2-broken
                class="mx-10px cursor-pointer"
                @click="selectDirectory('new')"
              ></i>
            </div>
          </div>
          <div class="flex justify-between">
            历史记录存放位置：
            <div class="flex items-center">
              {{ historyPath?.filePaths[0] }}
              <i
                i-solar-pen-2-broken
                class="mx-10px cursor-pointer"
                @click="selectDirectory('history')"
              ></i>
            </div>
          </div>
          <div class="flex justify-between">
            当前版本：
            <div class="flex items-center">
              <span>v{{ version }}</span>
            </div>
          </div>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
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
const filePath = ref<{
  filePaths: string[]
}>({
  filePaths: [useUser.filePath!] || []
})
const historyPath = ref<{
  filePaths: string[]
}>({
  filePaths: [useUser.historyPath!] || []
})
// 获取当前版本号
const version = ref('')

const getFileExit = (type: string, path: string) => {
  window.api.fileExit(path, `${type}.${useUser.fileType}`)
}

const selectDirectory = async (type: string) => {
  // 调用 Electron 暴露的 API 选择文件夹
  const selectedPath = await window.electron.ipcRenderer.invoke('selectDirectory')
  if (selectedPath) {
    if (type === 'new') {
      filePath.value = selectedPath // 更新显示的路径
      useUser.setValue({ type: 'filePath', value: selectedPath.filePaths[0] })
      useUser.setValue({
        type: 'fileFullPath',
        value: `${selectedPath.filePaths[0]}\\todo.${useUser.fileType}`
      })
      getFileExit('todo', useUser.filePath!)

      if (!historyPath.value.filePaths[0]) {
        historyPath.value = selectedPath
        useUser.setValue({ type: 'historyPath', value: selectedPath.filePaths[0] })
        useUser.setValue({
          type: 'historyFullPath',
          value: `${selectedPath.filePaths[0]}\\todoHistory.${useUser.fileType}`
        })
        getFileExit('todoHistory', useUser.historyPath!)
      }
    } else {
      historyPath.value = selectedPath
      useUser.setValue({ type: 'historyPath', value: selectedPath.filePaths[0] })
      useUser.setValue({
        type: 'historyFullPath',
        value: `${selectedPath.filePaths[0]}\\todoHistory.${useUser.fileType}`
      })
      getFileExit('todoHistory', useUser.historyPath!)
    }
  }
}

const updateRadio = () => {
  useUser.setValue({ type: 'fileType', value: radioValue.value })
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

onMounted(async () => {
  // 从主进程获取版本号
  version.value = await window.electron.ipcRenderer.invoke('get-version')
})
</script>

<style scoped></style>
