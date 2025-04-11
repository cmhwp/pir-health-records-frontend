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
          <span>控制台</span>
        </a-menu-item>
        <a-sub-menu key="sub1">
          <template #title>
            <span>
              <user-outlined />
              <span>用户管理</span>
            </span>
          </template>
          <a-menu-item key="user-patients">患者管理</a-menu-item>
          <a-menu-item key="user-doctors">医生管理</a-menu-item>
          <a-menu-item key="user-researchers">研究人员管理</a-menu-item>
          <a-menu-item key="user-admins">管理员管理</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="roles">
          <template #icon><safety-outlined /></template>
          <span>角色权限</span>
        </a-menu-item>
        <a-menu-item key="logs">
          <template #icon><history-outlined /></template>
          <span>系统日志</span>
        </a-menu-item>
        <a-menu-item key="settings">
          <template #icon><tool-outlined /></template>
          <span>系统设置</span>
        </a-menu-item>
        <a-menu-item key="backups">
          <template #icon><cloud-outlined /></template>
          <span>数据备份</span>
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
        <span style="font-size: 18px; font-weight: bold">系统管理员控制台</span>
        <span>欢迎，{{ userName }}</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>控制台</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <h1>系统管理员控制台</h1>
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic title="系统用户" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <team-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="今日活跃用户" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <user-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="系统负载" value="0%" style="margin-bottom: 16px">
                <template #suffix>
                  <dashboard-outlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="6">
              <a-statistic title="安全警告" :value="0" style="margin-bottom: 16px">
                <template #suffix>
                  <warning-outlined />
                </template>
              </a-statistic>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="6">
              <a-card title="用户管理" :bordered="false">
                <template #extra><a href="#">管理</a></template>
                <p>管理系统用户</p>
                <a-button type="primary">用户列表</a-button>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card title="角色权限管理" :bordered="false">
                <template #extra><a href="#">管理</a></template>
                <p>管理系统角色和权限</p>
                <a-button type="primary">权限管理</a-button>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card title="系统日志" :bordered="false">
                <template #extra><a href="#">管理</a></template>
                <p>查看系统操作日志</p>
                <a-button type="primary">查看日志</a-button>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card title="系统设置" :bordered="false">
                <template #extra><a href="#">管理</a></template>
                <p>配置系统参数</p>
                <a-button type="primary">系统设置</a-button>
              </a-card>
            </a-col>
          </a-row>
          
          <a-divider />
          
          <a-row :gutter="16">
            <a-col :span="24">
              <a-card title="系统状态" :bordered="false">
                <template #extra><a href="#">刷新</a></template>
                <a-timeline>
                  <a-timeline-item>系统初始化完成</a-timeline-item>
                  <a-timeline-item>数据库连接正常</a-timeline-item>
                  <a-timeline-item>缓存服务运行中</a-timeline-item>
                  <a-timeline-item>所有系统服务正常运行</a-timeline-item>
                </a-timeline>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  UserOutlined,
  TeamOutlined,
  HistoryOutlined,
  SafetyOutlined,
  ToolOutlined,
  CloudOutlined,
  WarningOutlined,
  SettingOutlined,
  LogoutOutlined 
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '系统管理员');

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  localStorage.setItem('adminSelectedMenu', key);
};

const goToProfile = () => {
  router.push('/profile');
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
    localStorage.removeItem('adminSelectedMenu');
    router.push('/auth/login');
  }
};

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(() => {
  const savedMenu = localStorage.getItem('adminSelectedMenu');
  if (savedMenu) {
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