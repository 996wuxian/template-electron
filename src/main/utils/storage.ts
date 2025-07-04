// Electron持久化存储工具
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

class ElectronStore {
  private storePath: string
  private data: Record<string, any> = {}

  constructor(filename = 'user-data.json') {
    // 使用app.getPath('userData')获取Electron应用数据目录
    this.storePath = path.join(app.getPath('userData'), filename)
    this.loadData()
  }

  private loadData() {
    try {
      if (fs.existsSync(this.storePath)) {
        const fileContent = fs.readFileSync(this.storePath, 'utf8')
        this.data = JSON.parse(fileContent)
      }
    } catch (error) {
      console.error('加载存储数据失败:', error)
      this.data = {}
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (error) {
      console.error('保存存储数据失败:', error)
    }
  }

  set(key: string, value: any) {
    this.data[key] = value
    this.saveData()
  }

  get(key: string, defaultValue: any = null) {
    return key in this.data ? this.data[key] : defaultValue
  }

  remove(key: string) {
    if (key in this.data) {
      delete this.data[key]
      this.saveData()
    }
  }

  clear() {
    this.data = {}
    this.saveData()
  }
}

export const electronStore = new ElectronStore()
