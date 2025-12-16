import path, { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

import UnoCSS from 'unocss/vite'
import { presetUno, presetAttributify, presetIcons } from 'unocss'
import transformerDirective from '@unocss/transformer-directives'

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
        '@renderer': resolve(__dirname, './src/renderer/src')
      }
    },
    plugins: [
      vue(),
      UnoCSS({
        // 显式禁用外部 uno.config.* 文件的自动加载，避免 unconfig/jiti 递归问题
        configFile: false,
        presets: [presetUno(), presetAttributify(), presetIcons()],
        content: {
          pipeline: {
            exclude: ['node_modules', 'dist']
          }
        },
        safelist: ['i-solar-sun-2-bold'],
        shortcuts: [['flex-center', 'flex items-center justify-center']],
        transformers: [transformerDirective()]
      }),
      AutoImport({
        imports: ['vue']
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [path.resolve(process.cwd(), './src/renderer/src/assets/svg-icon')],
        // 指定symbolId格式
        symbolId: '[name]'
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@renderer/assets/sass/global.scss" as *;`
        }
      }
    },
    define: {
      __dirname: JSON.stringify(__dirname)
    }
  }
})
