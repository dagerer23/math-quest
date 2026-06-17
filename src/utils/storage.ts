/**
 * Taro 存储适配器 - 兼容小程序和 H5
 */
import Taro from '@tarojs/taro'
import type { StateStorage } from 'zustand/middleware'

export const taroStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await Taro.getStorage({ key: name })
      return value.data || null
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await Taro.setStorage({ key: name, data: value })
    } catch (e) {
      console.error('setStorage error', e)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await Taro.removeStorage({ key: name })
    } catch (e) {
      console.error('removeStorage error', e)
    }
  },
}

export function getSync<T>(key: string, fallback: T): T {
  try {
    const v = Taro.getStorageSync(key)
    return (v === '' || v === undefined || v === null) ? fallback : (v as T)
  } catch {
    return fallback
  }
}

export function setSync(key: string, value: any): void {
  try {
    Taro.setStorageSync(key, value)
  } catch (e) {
    console.error('setStorageSync error', e)
  }
}
