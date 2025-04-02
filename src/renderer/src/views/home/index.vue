<template>
  <div class="flex flex-col h-full p-20px">
    <!-- 设备信息区域 -->
    <div class="device-info mb-30px">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-18px font-bold">此设备</h2>
        <n-icon class="text-warning">
          <WarningFilled />
        </n-icon>
      </div>

      <div class="flex items-center gap-30px">
        <div class="flex-1">
          <div class="text-gray-500 mb-2">设备代码</div>
          <div class="flex items-center gap-2">
            <span class="text-primary text-24px font-bold">510 967 850</span>
            <n-button text class="!p-0">
              <n-icon size="20">
                <Copy />
              </n-icon>
            </n-button>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500">临时密码</span>
            <n-switch size="small" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-24px font-bold">6vg9f3dc</span>
            <div class="flex items-center gap-1">
              <n-button text class="!p-0">
                <n-icon size="20">
                  <EyeOutlined />
                </n-icon>
              </n-button>
              <n-button text class="!p-0">
                <n-icon size="20">
                  <EditOutlined />
                </n-icon>
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <n-checkbox class="mt-4">控制本设备需校验本机锁屏密码</n-checkbox>
    </div>

    <!-- 远程控制区域 -->
    <div class="remote-control">
      <h2 class="text-18px font-bold mb-4">远程控制设备</h2>

      <div class="flex items-center gap-4">
        <n-input
          v-model:value="remoteId"
          size="large"
          placeholder="请输入对方设备代码"
          class="flex-1"
        >
          <template #suffix>
            <n-icon>
              <StarFilled class="text-warning cursor-pointer" />
            </n-icon>
          </template>
        </n-input>

        <n-button type="primary" size="large" :disabled="!remoteId"> 连接 </n-button>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <n-radio-group v-model:value="controlType" class="flex">
          <n-radio-button value="control"> 远程控制 </n-radio-button>
          <n-radio-button value="file"> 文件传输 </n-radio-button>
        </n-radio-group>

        <div class="text-success flex items-center gap-1">
          <n-icon>
            <CheckCircleFilled />
          </n-icon>
          已准备好连接(端到端加密已启用)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const remoteId = ref('')
const controlType = ref('control')
</script>

<style scoped>
.device-info {
  border-bottom: 1px solid var(--border-color);
}
</style>
