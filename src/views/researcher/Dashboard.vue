<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <h3 v-if="!collapsed">PIR健康记录</h3>
        <h3 v-else>PIR</h3>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" @select="handleMenuSelect">
        <a-menu-item key="dashboard">
          <template #icon><dashboard-outlined /></template>
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="projects">
          <template #icon><project-outlined /></template>
          <span>研究项目</span>
        </a-menu-item>
        <a-menu-item key="analytics">
          <template #icon><fund-outlined /></template>
          <span>数据分析</span>
        </a-menu-item>
        <a-menu-item key="reports">
          <template #icon><file-text-outlined /></template>
          <span>研究报告</span>
        </a-menu-item>
        <a-menu-item key="teams">
          <template #icon><team-outlined /></template>
          <span>合作团队</span>
        </a-menu-item>
        <a-sub-menu key="sub1">
          <template #title>
            <span>
              <area-chart-outlined />
              <span>数据可视化</span>
            </span>
          </template>
          <a-menu-item key="visualization-1">图表分析</a-menu-item>
          <a-menu-item key="visualization-2">地理分布</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="profile">
          <template #icon><setting-outlined /></template>
          <span>个人设置</span>
        </a-menu-item>
        <a-menu-item key="logout" @click="handleLogout">
          <template #icon><logout-outlined /></template>
          <span>退出登录</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 16px; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 18px; font-weight: bold">{{ currentPageTitle }}</span>
        <span>欢迎，{{ userName }}</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>{{ currentPageTitle }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <component :is="currentView" />
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        PIR健康记录系统 ©2023 隐私保护技术医疗健康记录
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw, defineAsyncComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  ProjectOutlined,
  FundOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  AreaChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
  LogoutOutlined 
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';

// 默认页面组件 - 工作台
const DashboardContent = defineAsyncComponent(() => 
  import('@/components/researcher/DashboardContent.vue')
);

// 懒加载其他页面组件
const ProjectsContent = defineAsyncComponent(() => 
  import('@/components/researcher/ProjectsContent.vue')
);
const AnalyticsContent = defineAsyncComponent(() => 
  import('@/components/researcher/AnalyticsContent.vue')
);
const ReportsContent = defineAsyncComponent(() => 
  import('@/components/researcher/ReportsContent.vue')
);
const TeamsContent = defineAsyncComponent(() => 
  import('@/components/researcher/TeamsContent.vue')
);
const VisualizationChartContent = defineAsyncComponent(() => 
  import('@/components/researcher/VisualizationChartContent.vue')
);
const VisualizationGeoContent = defineAsyncComponent(() => 
  import('@/components/researcher/VisualizationGeoContent.vue')
);
const ProfileContent = defineAsyncComponent(() => 
  import('@/views/auth/Profile.vue')
);


const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '研究人员用户');

// 当前显示的组件
const currentView = ref(markRaw(DashboardContent));

// 页面标题映射
const pageTitles = {
  dashboard: '工作台',
  projects: '研究项目',
  analytics: '数据分析',
  reports: '研究报告',
  teams: '合作团队',
  'visualization-1': '图表分析',
  'visualization-2': '地理分布',
  profile: '个人设置'
};

// 计算当前页面标题
const currentPageTitle = computed(() => {
  return pageTitles[selectedKeys.value[0] as keyof typeof pageTitles] || '工作台';
});

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  // 保存选中的菜单项到localStorage
  localStorage.setItem('selectedMenu', key);
  
  // 根据选中的菜单项切换显示的组件
  switch (key) {
    case 'dashboard':
      currentView.value = markRaw(DashboardContent);
      break;
    case 'projects':
      currentView.value = markRaw(ProjectsContent);
      break;
    case 'analytics':
      currentView.value = markRaw(AnalyticsContent);
      break;
    case 'reports':
      currentView.value = markRaw(ReportsContent);
      break;
    case 'teams':
      currentView.value = markRaw(TeamsContent);
      break;
    case 'visualization-1':
      currentView.value = markRaw(VisualizationChartContent);
      break;
    case 'visualization-2':
      currentView.value = markRaw(VisualizationGeoContent);
      break;
    case 'profile':
      currentView.value = markRaw(ProfileContent);
      break;
    case 'logout':
      handleLogout();
      break;
    // profile 和 logout 由单独的方法处理
  }
};

const goToProfile = () => {
  router.push('/researcher/profile');
};

const handleLogout = async () => {
  try {
    await logout();
    message.success('退出登录成功');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败，但已清除本地登录状态');
  } finally {
    // 无论请求成功或失败，都清除本地存储并跳转
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('selectedMenu');
    router.push('/auth/login');
  }
};

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(() => {
  const savedMenu = localStorage.getItem('selectedMenu');
  if (savedMenu) {
    selectedKeys.value = [savedMenu];
    // 根据保存的菜单项设置当前视图
    handleMenuSelect({ key: savedMenu });
  }
});
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  text-align: center;
  line-height: 32px;
  overflow: hidden;
}

.logo h3 {
  color: white;
  margin: 0;
}

.ant-layout-sider-collapsed .logo h3 {
  display: inline-block;
  margin: 0;
  font-size: 16px;
}
</style> 