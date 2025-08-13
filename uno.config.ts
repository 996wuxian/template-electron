import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'
import transformerDirective from '@unocss/transformer-directives' // 在style中使用unocss

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist']
    }
  },
  safelist: [
    'i-solar-sun-2-bold',
    'i-solar-widget-5-bold-duotone',
    'i-solar-checklist-minimalistic-bold-duotone',
    'i-solar-pie-chart-broken',
    'i-solar-calendar-minimalistic-broken',
    'i-solar-history-2-broken',
    'i-solar-bill-broken'
  ],
  shortcuts: [['flex-center', 'flex items-center justify-center']],
  rules: [
    ['drag', { '-webkit-app-region': 'drag' }],
    ['no-drag', { '-webkit-app-region': 'no-drag' }],
    ['no-select', { 'user-select': 'none' }]
  ],
  transformers: [transformerDirective()]
})
