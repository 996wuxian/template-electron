<template>
  <div
    class="flex w-100% h-100% flex-items-center overflow-hidden theme-page aside rd-lb-10px"
    :class="containerClass"
  >
    <n-menu
      v-if="menuOptions"
      :value="route.path"
      :options="menuOptions"
      accordion
      :render-icon="renderMenuIcon"
      :root-indent="36"
      :indent="12"
      :collapsed="collapsed"
      :collapsed-width="sideFoldWidth"
      :mode="mode"
      responsive
      class="w-100%"
      :theme-overrides="{
        itemTextColorHover: primaryColor,
        itemIconColorHover: primaryColor,
        itemTextColor: itemColor,
        itemIconColor: itemColor
      }"
      @update:value="(key, item) => change(key, item)"
    />

    <i
      v-if="!collapsed"
      class="mt-auto mb-20px w-20px h-20px cursor-pointer hover:text-#89C1E8 transition transition-duration-[.3s]"
      i-solar-settings-broken
      @click="showModal"
    ></i>
    <Setting :show="modalVisible" @update:show="(value) => (modalVisible = value)" />
  </div>
</template>

<script lang="ts" setup>
import { ref, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import tinycolor from 'tinycolor2'
import Setting from './components/Setting.vue'

import useRoutesStore from '@renderer/stores/modules/routes'
import useThemeStore from '@renderer/stores/modules/theme'

const useTheme = useThemeStore()
const routes = useRoutesStore().routes
const useRoutes = useRoutesStore()
const route = useRoute()
const router = useRouter()

const sideFoldWidth = computed(() => useTheme.$state.sideFoldWidth)
const collapsed = computed(() => useTheme.$state.collapsed)
const primaryColor = computed(() => useTheme.$state.primaryColor.toString())
const themeType = computed(() => useTheme.$state.themeType)
const itemColor = computed(() => {
  return themeType.value === 'light'
    ? tinycolor(primaryColor).darken(30).toString()
    : tinycolor(primaryColor).lighten(100).toString()
})
// 容器类名
const containerClass = computed(() => ({
  'flex-col': props.mode === 'vertical'
}))

const menuOptions = ref(routes)
const modalVisible = ref(false)

type ModeType = 'vertical' | 'horizontal' | undefined

const props = withDefaults(
  defineProps<{
    mode?: ModeType
    title?: boolean
  }>(),
  {
    mode: 'vertical',
    title: true
  }
)

// todo 动态渲染菜单图标 缺陷：需要在uno.config.ts的safelist中先添加对应icon
function renderMenuIcon(option: any) {
  if (option.icon) {
    return h(NIcon, {
      class: `${option.icon}`
    })
  } else {
    return null
  }
}

const change = (key: any, item: any) => {
  router.push(key)
  useTheme.setTagData({
    tag: {
      ...item,
      close: true
    }
  })
  useRoutes.setCurrentRoute({ route: item })
}

const showModal = () => {
  modalVisible.value = true
}
</script>

<style lang="scss" scoped>
.aside {
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
