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
        <span style="font-size: 18px; font-weight: bold">研究人员工作台</span>
        <span>欢迎，{{ userName }}</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>工作台</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <h1>研究人员工作台</h1>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic title="进行中项目" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <project-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="可用数据集" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <database-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="已发布报告" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <file-text-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="团队成员" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <team-outlined />
                </template>
              </a-statistic>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="8">
              <a-card title="研究项目" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理您的研究项目</p>
                <a-button type="primary">查看项目列表</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="数据分析" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>访问匿名化医疗数据进行分析</p>
                <a-button type="primary">数据分析工具</a-button>
              </a-card>
            </a-col>
            <a-col :span="8">
              <a-card title="研究报告" :bordered="false">
                <template #extra><a href="#">更多</a></template>
                <p>管理研究报告和发现</p>
                <a-button type="primary">管理报告</a-button>
              </a-card>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="24">
              <a-card title="最近项目进展" :bordered="false">
                <a-empty description="暂无项目进展" />
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

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '研究人员用户');

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