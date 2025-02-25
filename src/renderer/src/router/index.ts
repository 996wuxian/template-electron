import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Layout from '@renderer/layout/index.vue'

import { setting } from '@renderer/config/setting.config'

import { setupPermissions } from './permissions'

const constantRoutes = [
  {
    path: '/403',
    name: '403',
    component: () => import('@renderer/views/error-page/403.vue'),
    meta: {
      hide: true
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@renderer/views/error-page/404.vue'),
    meta: {
      hide: true
    }
  }
]

export const asyncRoutes = [
  {
    path: '/',
    name: 'Root',
    component: Layout,
    redirect: '/home',
    meta: {
      title: '今日计划',
      icon: 'i-solar-sun-2-bold',
      hide: false
    },
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@renderer/views/home/index.vue'),
        meta: {
          title: '今日计划'
        }
      }
    ]
  },
  {
    path: '/recently-page',
    name: 'RecentlyPage',
    component: Layout,
    meta: {
      title: '最近待办',
      icon: 'i-solar-sun-2-bold',
      hide: false
    },
    children: [
      {
        path: '/recently',
        name: 'Recently',
        component: () => import('@renderer/views/home/index.vue'),
        meta: {
          title: '最近待办'
        }
      }
    ]
  },

  {
    path: '/floating',
    name: 'Floating',
    component: () => import('@renderer/views/floating/index.vue')
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NoFound',
    redirect: '/404',
    meta: {
      hide: true
    }
  }
]

const router = createRouter({
  history: setting.isHashRouterMode ? createWebHashHistory() : createWebHistory(),
  routes: constantRoutes as RouteRecordRaw[]
})

export const addRouter = (routes: any) => {
  routes.forEach((route: any) => {
    if (!router.hasRoute(route.name)) router.addRoute(route as RouteRecordRaw)
    if (route.children) addRouter(route.children)
  })
}

export function setupRouter(app: any) {
  // 开发路由
  if (setting.authentication === 'intelligence') addRouter(asyncRoutes)
  setupPermissions(router) // 生产路由
  app.use(router)
  return router
}

export default router
