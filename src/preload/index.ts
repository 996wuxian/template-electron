import { contextBridge } from 'electron'
import { existsSync, appendFile, writeFileSync } from 'fs'
import path from 'path'
import os from 'os'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  readFile: (filePath: string, fileName: string) => {
    try {
      // 处理 ~ 符号路径
      const processedDir = filePath.startsWith('~')
        ? path.join(os.homedir(), filePath.slice(1))
        : filePath

      // 构造完整路径
      const fullPath = path.join(processedDir, fileName)

      // 安全检查：防止目录遍历攻击
      const normalizedPath = path.normalize(fullPath)
      if (normalizedPath !== fullPath) {
        return null
      }

      // 检查文件存在性
      return existsSync(normalizedPath)
        ? normalizedPath
        : appendFile(fullPath, '', (err) => {
            if (err) return null
            // return true
            console.log('File is created successfully.')
          })
    } catch (err) {
      return null
    }
  },
  writeFile: (filePath: string, data: string) => {
    try {
      writeFileSync(filePath, data, 'utf-8') // 使用同步写入文件的方法
    } catch (err) {
      console.error('Error writing file:', err)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
