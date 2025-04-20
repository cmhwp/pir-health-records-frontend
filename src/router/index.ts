import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'

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
  // 患者仪表盘
  {
    path: '/patient',
    name: 'PatientDashboard',
    component: () => import('@/views/patient/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'patient' },
    children: [
      {
        path: '',
        name: 'PatientHome',
        component: () => import('@/components/patient/DashboardContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '健康概览' }
      },
      {
        path: 'records',
        name: 'PatientRecords',
        component: () => import('@/components/patient/RecordsContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '健康记录' }
      },
      {
        path: 'add-record',
        name: 'AddRecord',
        component: () => import('@/components/patient/AddRecordContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '添加记录' }
      },
      {
        path: 'record/:id',
        name: 'RecordDetail',
        component: () => import('@/components/patient/RecordDetailContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '记录详情' }
      },
      {
        path:'share-users',
        name:'ShareUsers',
        component:()=>import('@/components/patient/ShareableUsersContent.vue'),
        meta:{requiresAuth:true,role:'patient',title:'共享用户'}
      },
      {
        path: 'edit-record/:id',
        name: 'EditRecord',
        component: () => import('@/components/patient/EditRecordContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '编辑记录' }
      },
      {
        path: 'shared',
        name: 'SharedRecords',
        component: () => import('@/components/patient/SharedRecordsContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '共享记录' }
      },
      {
        path: 'pir-query',
        name: 'PirQuery',
        component: () => import('@/components/patient/PirQueryContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '隐私查询' }
      },
      {
        path: 'pir-settings',
        name: 'PirSettings',
        component: () => import('@/components/patient/PirSettingsContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '隐私设置' }
      },
      {
        path: 'pir-history',
        name: 'PirHistory',
        component: () => import('@/components/patient/PirHistoryContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '查询历史' }
      },
      {
        path: 'prescriptions',
        name: 'PatientPrescriptions',
        component: () => import('@/components/patient/PrescriptionsContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '我的处方' }
      },
      {
        path: 'doctors',
        name: 'PatientDoctors',
        component: () => import('@/components/patient/DoctorsContent.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '医生列表' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/auth/Profile.vue'),
        meta: { requiresAuth: true, role: 'patient', title: '个人资料' }
      }
    ]
  },
  // 医生仪表盘
  {
    path: '/doctor',
    name: 'DoctorDashboard',
    component: () => import('@/views/doctor/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'doctor' },
    children: [
      {
        path: '',
        name: 'DoctorHome',
        component: () => import('@/components/doctor/DashboardContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '工作台' }
      },
      {
        path: 'patients',
        name: 'DoctorPatients',
        component: () => import('@/components/doctor/PatientsContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '患者管理' }
      },
      {
        path: 'prescriptions',
        name: 'DoctorPrescriptions',
        component: () => import('@/components/doctor/PrescriptionsContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '处方管理' }
      },
      {
        path: 'records',
        name: 'DoctorRecords',
        component: () => import('@/components/doctor/DoctorRecordsContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '医疗记录' }
      },
      {
        path: 'pir',
        name: 'DoctorPirQuery',
        component: () => import('@/components/doctor/PIRQueryComponent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '隐私保护查询' }
      },
      {
        path: 'patient-statistics',
        name: 'PatientStatistics',
        component: () => import('@/components/doctor/PatientStatisticsContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '患者统计' }
      },
      {
        path: 'disease-statistics',
        name: 'DiseaseStatistics',
        component: () => import('@/components/doctor/DiseaseStatisticsContent.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '疾病统计' }
      },
      {
        path: 'profile',
        name: 'DoctorProfile',
        component: () => import('@/views/auth/Profile.vue'),
        meta: { requiresAuth: true, role: 'doctor', title: '个人设置' }
      }
    ]
  },
  // 研究人员仪表盘
  {
    path: '/researcher',
    name: 'ResearcherDashboard',
    component: () => import('@/views/researcher/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'researcher' },
    children: [
      {
        path: '',
        name: 'ResearcherHome',
        component: () => import('@/components/researcher/DashboardContent.vue'),
        meta: { requiresAuth: true, role: 'researcher', title: '工作台' }
      },
      {
        path: 'projects',
        name: 'ResearcherProjects',
        component: () => import('@/components/researcher/ProjectsContent.vue'),
        meta: { requiresAuth: true, role: 'researcher', title: '研究项目' }
      },
      {
        path:'project/:id',
        name:'ProjectDetails',
        component:()=>import('@/components/researcher/ProjectDetails.vue'),
        meta:{requiresAuth:true,role:'researcher',title:'项目详情'}
      },
      {
        path:'records',
        name:'ResearcherRecords',
        component:()=>import('@/components/researcher/RecordsContent.vue'),
        meta:{requiresAuth:true,role:'researcher',title:'健康记录'}
      },
      {
        path:'record/:id',
        name:'RecordDetails',
        component:()=>import('@/components/researcher/RecordDetailContent.vue'),
        meta:{requiresAuth:true,role:'researcher',title:'记录详情'}
      },  
      {
        path: 'analytics',
        name: 'ResearcherAnalytics',
        component: () => import('@/components/researcher/AnalyticsContent.vue'),
        meta: { requiresAuth: true, role: 'researcher', title: '数据分析' }
      },
      {
        path: 'pir',
        name: 'ResearcherPIR',
        component: () => import('@/components/researcher/PirQueryContent.vue'),
        meta: { requiresAuth: true, role: 'researcher', title: '隐私查询' }
      },
      {
        path: 'profile',
        name: 'ResearcherProfile',
        component: () => import('@/views/auth/Profile.vue'),
        meta: { requiresAuth: true, role: 'researcher', title: '研究人员资料' }
      }
    ]
  },
  // 管理员仪表盘
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminHome',
        component: () => import('@/components/admin/DashboardContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '系统概览' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/components/admin/UsersContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '所有用户' }
      },
      {
        path: 'system-logs',
        name: 'SystemLogs',
        component: () => import('@/components/admin/SystemLogsContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '系统日志' }
      },
      {
        path: 'export-data',
        name: 'ExportData',
        component: () => import('@/components/admin/ExportDataContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '导出数据' }
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/components/admin/SettingsContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '系统设置' }
      },
      {
        path: 'user-activity',
        name: 'UserActivity',
        component: () => import('@/components/admin/UserActivityContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '用户活动分析' }
      },
      {
        path: 'institutions',
        name: 'AdminInstitutions',
        component: () => import('@/components/admin/InstitutionsContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '医疗机构管理' }
      },
      {
        path: 'record-types',
        name: 'AdminRecordTypes',
        component: () => import('@/components/admin/RecordTypesContent.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '记录类型管理' }
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/auth/Profile.vue'),
        meta: { requiresAuth: true, role: 'admin', title: '个人资料' }
      }
    ]
  },
  // 其他路由可以根据需要添加
  {
    path: '/shared/:accessKey',
    name: 'SharedRecordAccess',
    component: () => import('@/views/SharedRecordView.vue'),
    meta: { requiresAuth: false, title: '共享健康记录' }
  },
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

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  // 等待用户store初始化完成
  if (!userStore.initialized) {
    await userStore.restoreSession();
  }
  
  // 获取目标路由的元信息
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role as string | undefined;
  
  // 如果路由需要身份验证
  if (requiresAuth) {
    // 如果用户未登录，重定向到登录页
    if (!userStore.isLoggedIn) {
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      });
      return;
    }
    
    // 如果路由要求特定角色但用户没有该角色，重定向到无权限页面
    if (requiredRole && userStore.userRole !== requiredRole) {
      next({ path: '/403' });
      return;
    }
  }
  
  // 如果用户已登录，阻止访问登录/注册页面
  if (userStore.isLoggedIn && (to.path === '/auth/login' || to.path === '/auth/register')) {
    // 根据用户角色重定向到对应首页
    const homePath = userStore.userRole === 'admin'
      ? '/admin'
      : userStore.userRole === 'doctor'
        ? '/doctor'
        : userStore.userRole === 'researcher'
          ? '/researcher'
          : '/patient';
    
    next({ path: homePath });
    return;
  }
  
  // 允许继续导航
  next();
});

export default router
