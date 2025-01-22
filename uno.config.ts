import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'
import transformerDirective from '@unocss/transformer-directives' // 在style中使用unocss

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist']
    }
  },
  safelist: ['i-solar-sun-2-bold'],
  shortcuts: [['flex-center', 'flex items-center justify-center']],
  transformers: [transformerDirective()]
})
