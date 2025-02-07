<template>
  <div class="rd-10px">
    <div :style="{ height: headerHeight + 'px' }">
      <Header></Header>
    </div>
    <div class="flex" :style="{ height: `calc(100vh - ${headerHeight}px)` }">
      <Aside :style="{ width: sideWidth + 'px' }"></Aside>
      <div class="flex-1 theme-page rd-rb-10px">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './header/index.vue'
import Aside from './aside/index.vue'

import useThemeStore from '@renderer/stores/modules/theme'
const themeStore = useThemeStore()
const sideWidth = computed(() => {
  return themeStore.sideWidth
})

const headerHeight = computed(() => {
  return themeStore.headerHeight
})
</script>

<style lang="scss" scoped></style>
