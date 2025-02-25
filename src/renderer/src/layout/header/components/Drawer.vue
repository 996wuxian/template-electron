<template>
  <n-drawer
    v-model:show="drawerShow"
    :width="width"
    placement="right"
    close-on-esc
    mask-closable
    :trap-focus="false"
    @mask-click="closeDrawer"
    @esc="closeDrawer"
  >
    <n-drawer-content>
      <template #header> 主题配置 </template>
      <div class="flex flex-col">
        <n-divider> 主题颜色 </n-divider>
        <div v-for="cs in colorSetting" :key="cs.label" class="step-block">
          {{ cs.label }}
          <component
            :is="cs.component"
            v-model:value="cs.color"
            style="width: 120px"
            :modes="['hex']"
            :swatches="cs.previewColor"
            @update:value="(value) => cs.handler(value, cs.type)"
          />
        </div>
        <n-divider> 页面功能 </n-divider>
        <div v-for="setting in settings" :key="setting.label">
          <div v-if="!setting.hidden" class="step-block">
            {{ setting.label }}
            <component
              :is="setting.component"
              v-model:value="setting.model"
              placeholder=""
              v-bind="setting.props"
              @update:value="(value) => setting.handler(value, setting.type, setting?.text)"
            />
          </div>
        </div>
      </div>
      <div class="w-100% flex m-t-20px">
        <n-button type="primary" @click="initTheme">重置配置</n-button>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
import { State } from '@renderer/types/theme-state-type'
import { NInputNumber, NColorPicker } from 'naive-ui'
import { getThemeOverrides } from '@renderer/config/theme.config'
const themeOverrides = getThemeOverrides()

const useTheme = useThemeStore()
// const whether = computed(() => useTheme.whether)
const sideWidth = computed(() => useTheme.sideWidth)
const sideFoldWidth = computed(() => useTheme.sideFoldWidth)
const headerHeight = computed(() => useTheme.headerHeight)

const props = defineProps({
  drawerShow: {
    type: Boolean,
    default: false
  },
  width: {
    type: Number,
    default: 360
  },
  placement: {
    type: String,
    default: 'right'
  }
})

const drawerShow = computed(() => props.drawerShow)

// 对于某些处理器不需要使用到的参数（如_text），可以通过下划线前缀来标记它是未使用的，这是一种常见的TS做法。
const sizeChange = (value: number, type: keyof State) => {
  useTheme.setSize({ type: type, size: value })
  if (type === 'sideWidth') {
    useTheme.setSize({ type: 'oldSideWidth', size: value })
  }
}

const colorChange = (value: string, type: keyof State) => {
  useTheme.setColor({ type: type, value: value })
}

interface Settings {
  label?: string
  component?: any
  model?: any
  props?: any
  handler?: any
  type?: keyof State
  text?: string
  hidden?: boolean
}

interface Colors {
  label?: string
  color?: string
  component?: any
  handler?: any
  previewColor?: string[]
  type?: keyof State
}

const settings = ref<Settings[]>([
  {
    label: '侧边栏宽度',
    component: NInputNumber,
    model: sideWidth.value,
    props: { min: 90, max: 500, style: { width: '120px' } },
    handler: sizeChange,
    type: 'sideWidth',
    hidden: false
  },
  {
    label: '侧边栏折叠宽度',
    component: NInputNumber,
    model: sideFoldWidth.value,
    props: { min: 70, max: 120, style: { width: '120px' } },
    handler: sizeChange,
    type: 'sideFoldWidth',
    hidden: false
  },
  {
    label: '头部高度',
    component: NInputNumber,
    model: headerHeight.value,
    props: { min: 40, max: 100, style: { width: '120px' } },
    handler: sizeChange,
    type: 'headerHeight',
    hidden: false
  }
])

const colorSetting = ref<Colors[]>([
  {
    label: '主色',
    color: themeOverrides.value.common?.primaryColor,
    component: NColorPicker,
    handler: colorChange,
    previewColor: [
      '#253B6E',
      '#1F5F8B',
      '#1891AC',
      '#00A8CC',
      '#71C9CE',
      '#1FAB89',
      '#62D2A2',
      '#878ECD',
      '#0F4C75',
      '#7E6BC4',
      '#35477D',
      '#5E63B6',
      '#F47C7C',
      '#307672',
      '#144D53',
      '#8AAE92'
    ],
    type: 'primaryColor'
  },
  {
    label: '成功色',
    color: themeOverrides.value.common?.successColor,
    component: NColorPicker,
    handler: colorChange,
    previewColor: [
      '#2EB872',
      '#108349',
      '#52D681',
      '#18A058',
      '#36622B',
      '#729D39',
      '#64A80B',
      '#7DA87B'
    ],
    type: 'successColor'
  },
  {
    label: '警告色',
    color: themeOverrides.value.common?.warningColor,
    component: NColorPicker,
    handler: colorChange,
    previewColor: [
      '#F0A020',
      '#FFB400',
      '#FFDE7D',
      '#F07B3F',
      '#FF9A00',
      '#FF9A3C',
      '#FFAA64',
      '#FFBD39'
    ],
    type: 'warningColor'
  },
  {
    label: '错误色',
    color: themeOverrides.value.common?.errorColor,
    component: NColorPicker,
    handler: colorChange,
    previewColor: [
      '#D03050',
      '#B83B5E',
      '#903749',
      '#F6416C',
      '#88304E',
      '#E23E57',
      '#F73859',
      '#D72323'
    ],
    type: 'errorColor'
  },
  {
    label: '信息色',
    color: themeOverrides.value.common?.infoColor,
    component: NColorPicker,
    handler: colorChange,
    previewColor: [
      '#909298',
      '#C2C2C2',
      '#E7E6E1',
      '#888888',
      '#DDDDDD',
      '#C5C5C5',
      '#D8DFE2',
      '#D3D6DB'
    ],
    type: 'infoColor'
  }
])

watch(
  () => ({
    sideWidth: useTheme.sideWidth,
    sideFoldWidth: useTheme.sideFoldWidth,
    headerHeight: useTheme.headerHeight,
    footerHeight: useTheme.footerHeight
  }),
  (newValues) => {
    settings.value = settings.value.map((setting) => {
      switch (setting.type) {
        case 'sideWidth':
          setting.model = newValues.sideWidth
          break
        case 'sideFoldWidth':
          setting.model = newValues.sideFoldWidth
          break
        case 'headerHeight':
          setting.model = newValues.headerHeight
          break
        case 'footerHeight':
          setting.model = newValues.footerHeight
          break
      }
      return setting
    })
  }
)

const emit = defineEmits(['close'])

const closeDrawer = () => {
  emit('close')
}

const initTheme = () => {
  useTheme.initTheme()
}
</script>

<style lang="scss" scoped>
.block {
  @apply flex-center p-10px b-rd-5px w-100%;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    background-color: #ececed !important;
    transition: all 0.3s;
  }
}

.step-block {
  @apply flex items-center justify-between mb-10px;
}
</style>
