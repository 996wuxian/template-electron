import NProgress from 'nprogress'

/** Setup plugin NProgress */
export function setupNProgress() {
  NProgress.configure({ easing: 'ease', speed: 1000, showSpinner: false })
  ;(window as any).NProgress = NProgress
}
