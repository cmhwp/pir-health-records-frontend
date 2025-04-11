<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <h3 v-if="!collapsed">PIR健康记录</h3>
        <h3 v-else>PIR</h3>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="dashboard">
          <template #icon><dashboard-outlined /></template>
          <span>仪表盘</span>
        </a-menu-item>
        <a-menu-item key="health-records">
          <template #icon><file-text-outlined /></template>
          <span>健康记录</span>
        </a-menu-item>
        <a-menu-item key="appointments">
          <template #icon><calendar-outlined /></template>
          <span>预约管理</span>
        </a-menu-item>
        <a-menu-item key="prescriptions">
          <template #icon><medicine-box-outlined /></template>
          <span>处方管理</span>
        </a-menu-item>
        <a-menu-item key="doctors">
          <template #icon><user-outlined /></template>
          <span>我的医生</span>
        </a-menu-item>
        <a-menu-item key="profile" @click="goToProfile">
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
          <a-breadcrumb-item>仪表盘</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <h1>患者仪表盘</h1>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-card title="我的健康记录" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>查看和管理您的健康记录</p>
                <a-button type="primary">查看健康记录</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="我的预约" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理您的医疗预约</p>
                <a-button type="primary">查看预约</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="我的处方" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>查看您的医疗处方</p>
                <a-button type="primary">查看处方</a-button>
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
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        PIR健康记录系统 ©2023 隐私保护技术医疗健康记录
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
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

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '患者用户');

const goToProfile = () => {
  router.push('/profile');
};

const handleLogout = async () => {
  try {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    message.success('退出登录成功');
    router.push('/auth/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败');
  }
};
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