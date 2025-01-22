import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

import UnoCSS from 'unocss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [
      vue(),
      UnoCSS(),
      AutoImport({
        imports: ['vue']
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "./src/renderer/src/assets/sass/global.scss" as *;`
        }
      }
    },
    define: {
      __dirname: JSON.stringify(__dirname)
    }
  }
})
