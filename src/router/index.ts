import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/auth/login'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/auth/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/auth/Profile.vue'),
    meta: { requiresAuth: true }
  },
  // 患者仪表盘
  {
    path: '/patient',
    name: 'PatientDashboard',
    component: () => import('@/views/patient/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'patient' }
  },
  // 医生仪表盘
  {
    path: '/doctor',
    name: 'DoctorDashboard',
    component: () => import('@/views/doctor/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'doctor' }
  },
  // 研究人员仪表盘
  {
    path: '/researcher',
    name: 'ResearcherDashboard',
    component: () => import('@/views/researcher/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'researcher' }
  },
  // 管理员仪表盘
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  // 其他路由可以根据需要添加
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.meta.role
  
  if (requiresAuth && !token) {
    // 如果需要登录但没有token，重定向到登录页
    next({ name: 'Login' })
  } else if (token && (to.name === 'Login' || to.name === 'Register')) {
    // 如果已登录，但尝试访问登录或注册页，重定向到对应角色的仪表盘
    if (userRole) {
      switch (userRole) {
        case 'patient':
          next({ name: 'PatientDashboard' })
          break
        case 'doctor':
          next({ name: 'DoctorDashboard' })
          break
        case 'researcher':
          next({ name: 'ResearcherDashboard' })
          break
        case 'admin':
          next({ name: 'AdminDashboard' })
          break
        default:
          next({ name: 'Profile' })
      }
    } else {
      next({ name: 'Profile' })
    }
  } else if (requiredRole && userRole !== requiredRole) {
    // 如果页面需要特定角色但用户角色不匹配，重定向到对应角色的仪表盘
    if (userRole) {
      switch (userRole) {
        case 'patient':
          next({ name: 'PatientDashboard' })
          break
        case 'doctor':
          next({ name: 'DoctorDashboard' })
          break
        case 'researcher':
          next({ name: 'ResearcherDashboard' })
          break
        case 'admin':
          next({ name: 'AdminDashboard' })
          break
        default:
          next({ name: 'Profile' })
      }
    } else {
      next({ name: 'Profile' })
    }
  } else {
    next()
  }
})

export default router
