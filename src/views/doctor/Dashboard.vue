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
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="patients">
          <template #icon><team-outlined /></template>
          <span>患者管理</span>
        </a-menu-item>
        <a-menu-item key="appointments">
          <template #icon><calendar-outlined /></template>
          <span>预约管理</span>
        </a-menu-item>
        <a-menu-item key="prescriptions">
          <template #icon><medicine-box-outlined /></template>
          <span>处方管理</span>
        </a-menu-item>
        <a-menu-item key="records">
          <template #icon><file-text-outlined /></template>
          <span>医疗记录</span>
        </a-menu-item>
        <a-sub-menu key="sub1">
          <template #title>
            <span>
              <bar-chart-outlined />
              <span>统计分析</span>
            </span>
          </template>
          <a-menu-item key="statistics-1">患者统计</a-menu-item>
          <a-menu-item key="statistics-2">疾病统计</a-menu-item>
        </a-sub-menu>
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
        <span style="font-size: 18px; font-weight: bold">医生工作台</span>
        <span>欢迎，{{ userName }} 医生</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>工作台</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <h1>医生工作台</h1>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic title="今日患者" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <user-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="待处理预约" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <calendar-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="今日处方" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <medicine-box-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="新增医疗记录" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <file-text-outlined />
                </template>
              </a-statistic>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="8">
              <a-card title="我的患者" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理您的患者列表</p>
                <a-button type="primary">查看患者列表</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="预约管理" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理您的医疗预约</p>
                <a-button type="primary">管理预约</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="处方管理" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理患者处方</p>
                <a-button type="primary">管理处方</a-button>
              </a-card>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="24">
              <a-card title="今日预约" :bordered="false">
                <a-empty description="暂无预约" />
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
  TeamOutlined,
  CalendarOutlined, 
  MedicineBoxOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined 
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '医生用户');

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