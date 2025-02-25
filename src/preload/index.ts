import { contextBridge } from 'electron'
import { existsSync, appendFile, writeFileSync, readFileSync } from 'fs'
import path from 'path'
import os from 'os'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  fileExit: (filePath: string, fileName: string) => {
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
            console.log('🚀 ~ :appendFile ~ err:', err)

            if (err) return null
            return true
          })
    } catch (err) {
      return null
    }
  },
  writeFile: (filePath: string, data: string) => {
    try {
      writeFileSync(filePath, data, 'utf-8')
    } catch (err) {
      console.error('Error writing file:', err)
    }
  },
  readFile: (filePath: string) => {
    try {
      if (!filePath) {
        return
      }
      const content = readFileSync(filePath, 'utf-8')
      if (content) {
        return JSON.parse(content) // 转换当前格式为数组
      }
    } catch (err) {
      console.error('Error readFile file:', err)
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
