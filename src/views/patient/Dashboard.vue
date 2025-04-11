<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <h3 v-if="!collapsed">PIR健康记录</h3>
        <h3 v-else>PIR</h3>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="dashboard" @click="activeContent = 'dashboard'">
          <template #icon><dashboard-outlined /></template>
          <span>仪表盘</span>
        </a-menu-item>
        <a-menu-item key="health-records" @click="activeContent = 'health-records'">
          <template #icon><file-text-outlined /></template>
          <span>健康记录</span>
        </a-menu-item>
        <a-menu-item key="appointments" @click="activeContent = 'appointments'">
          <template #icon><calendar-outlined /></template>
          <span>预约管理</span>
        </a-menu-item>
        <a-menu-item key="prescriptions" @click="activeContent = 'prescriptions'">
          <template #icon><medicine-box-outlined /></template>
          <span>处方管理</span>
        </a-menu-item>
        <a-menu-item key="doctors" @click="activeContent = 'doctors'">
          <template #icon><user-outlined /></template>
          <span>我的医生</span>
        </a-menu-item>
        <a-menu-item key="profile" @click="activeContent = 'profile'">
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
        <span style="font-size: 18px; font-weight: bold">患者健康管理中心</span>
        <span>欢迎，{{ userName }}</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>{{ breadcrumbTitle }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <!-- 仪表盘内容 -->
          <div v-if="activeContent === 'dashboard'">
            <h1>患者仪表盘</h1>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-card title="我的健康记录" :bordered="false">
                  <template #extra><a href="#">更多</a></template>
                  <p>查看和管理您的健康记录</p>
                  <a-button type="primary" @click="activeContent = 'health-records'">查看健康记录</a-button>
                </a-card>
              </a-col>
              <a-col :span="8">
                <a-card title="我的预约" :bordered="false">
                  <template #extra><a href="#">更多</a></template>
                  <p>管理您的医疗预约</p>
                  <a-button type="primary" @click="activeContent = 'appointments'">查看预约</a-button>
                </a-card>
              </a-col>
              <a-col :span="8">
                <a-card title="我的处方" :bordered="false">
                  <template #extra><a href="#">更多</a></template>
                  <p>查看您的医疗处方</p>
                  <a-button type="primary" @click="activeContent = 'prescriptions'">查看处方</a-button>
                </a-card>
              </a-col>
            </a-row>
            
            <a-divider />
            
            <a-row :gutter="16">
              <a-col :span="24">
                <a-card title="最近健康记录" :bordered="false">
                  <a-empty description="暂无健康记录" />
                </a-card>
              </a-col>
            </a-row>
          </div>

          <!-- 健康记录内容 -->
          <div v-if="activeContent === 'health-records'">
            <h1>我的健康记录</h1>
            <a-empty description="暂无健康记录" />
          </div>

          <!-- 预约管理内容 -->
          <div v-if="activeContent === 'appointments'">
            <h1>我的预约</h1>
            <a-empty description="暂无预约记录" />
          </div>

          <!-- 处方管理内容 -->
          <div v-if="activeContent === 'prescriptions'">
            <h1>我的处方</h1>
            <a-empty description="暂无处方记录" />
          </div>

          <!-- 我的医生内容 -->
          <div v-if="activeContent === 'doctors'">
            <h1>我的医生</h1>
            <a-empty description="暂无医生信息" />
          </div>

          <!-- 个人设置内容 -->
          <div v-if="activeContent === 'profile'">
            <h1>个人设置</h1>
            <a-card>
              <profile-component />
            </a-card>
          </div>
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        PIR健康记录系统 ©2023 隐私保护技术医疗健康记录
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  MedicineBoxOutlined, 
  UserOutlined, 
  SettingOutlined,
  LogoutOutlined 
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';
import ProfileComponent from '@/views/auth/Profile.vue';

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '患者用户');
const activeContent = ref('dashboard');

// 根据当前激活的内容计算面包屑标题
const breadcrumbTitle = computed(() => {
  switch (activeContent.value) {
    case 'dashboard': return '仪表盘';
    case 'health-records': return '健康记录';
    case 'appointments': return '预约管理';
    case 'prescriptions': return '处方管理';
    case 'doctors': return '我的医生';
    case 'profile': return '个人设置';
    default: return '仪表盘';
  }
});

// 监听内容变化时更新selectedKeys和保存到localStorage
watch(activeContent, (newVal) => {
  selectedKeys.value = [newVal];
  localStorage.setItem('patientSelectedMenu', newVal);
});

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
    localStorage.removeItem('patientSelectedMenu');
    router.push('/auth/login');
  }
};

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(() => {
  const savedMenu = localStorage.getItem('patientSelectedMenu');
  if (savedMenu) {
    activeContent.value = savedMenu;
    selectedKeys.value = [savedMenu];
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