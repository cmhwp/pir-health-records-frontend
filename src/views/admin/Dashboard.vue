<template>
  <a-layout style="min-height: 100vh">
     <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      width="240"
    >
      <div class="logo" style="height: 32px; margin: 16px; color: white; font-size: 18px; font-weight: bold; text-align: center">
        PIR管理系统
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @select="handleMenuSelect"
      >
        <a-menu-item key="dashboard">
          <dashboard-outlined />
          <span>系统概览</span>
        </a-menu-item>
        <a-sub-menu key="user-management">
          <template #title>
            <span>
              <team-outlined />
              <span>用户管理</span>
            </span>
          </template>
          <a-menu-item key="users">所有用户</a-menu-item>
          <a-menu-item key="patients">患者管理</a-menu-item>
          <a-menu-item key="doctors">医生管理</a-menu-item>
          <a-menu-item key="researchers">研究人员管理</a-menu-item>
          <a-menu-item key="admins">管理员管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="system-management">
          <template #title>
            <span>
              <setting-outlined />
              <span>系统管理</span>
            </span>
          </template>
          <a-menu-item key="system-logs">系统日志</a-menu-item>
          <a-menu-item key="system-health">系统健康</a-menu-item>
          <a-menu-item key="system-metrics">系统指标</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="data-management">
          <template #title>
            <span>
              <database-outlined />
              <span>数据管理</span>
            </span>
          </template>
          <a-menu-item key="batch-records">批量管理记录</a-menu-item>
          <a-menu-item key="export-data">导出数据</a-menu-item>
          <a-menu-item key="maintenance">系统维护</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="settings">
          <tool-outlined />
          <span>系统设置</span>
        </a-menu-item>
        <a-menu-item key="user-activity">
          <area-chart-outlined />
          <span>用户活动分析</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 16px; display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            style="font-size: 18px; cursor: pointer; margin-right: 16px"
            @click="collapsed = !collapsed"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            style="font-size: 18px; cursor: pointer; margin-right: 16px"
            @click="collapsed = !collapsed"
          />
          <span style="font-size: 18px; font-weight: bold">{{ currentPageTitle }}</span>
        </div>
        <div style="display: flex; align-items: center">
          <a-badge :count="systemAlerts.length" :dot="systemAlerts.length > 0">
            <a-button shape="circle" icon-only @click="showNotifications = true">
              <template #icon>
                <bell-outlined />
              </template>
            </a-button>
          </a-badge>
          
          <a-popover placement="bottomRight" trigger="click">
            <template #content>
              <a-menu style="border: none; width: 160px">
                <a-menu-item key="user-profile" @click="handleMenuSelect({ key: 'profile' })">
                  <template #icon><user-outlined /></template>
                  个人设置
                </a-menu-item>
                <a-divider style="margin: 4px 0" />
                <a-menu-item key="user-logout" @click="handleLogout">
                  <template #icon><logout-outlined /></template>
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
            <div style="margin-left: 16px; display: flex; align-items: center; cursor: pointer">
              <a-avatar :size="32" style="background-color: #1890ff">
                {{ userName.charAt(0).toUpperCase() }}
              </a-avatar>
              <span style="margin-left: 8px">{{ userName }}</span>
            </div>
          </a-popover>
        </div>
      </a-layout-header>
      
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>
            <router-link to="/admin">首页</router-link>
          </a-breadcrumb-item>
          
          <a-breadcrumb-item v-if="route.path !== '/admin'">
            {{ currentPageTitle }}
          </a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </a-layout-content>
      
      <a-layout-footer style="text-align: center">
        PIR健康记录系统 ©2023 隐私保护技术医疗健康记录
      </a-layout-footer>
    </a-layout>
    
    <!-- 系统通知抽屉 -->
    <a-drawer
      title="系统通知"
      placement="right"
      :open="showNotifications"
      @close="showNotifications = false"
      width="400"
    >
      <a-spin :spinning="loadingAlerts">
        <a-list
          v-if="systemAlerts.length > 0"
          item-layout="horizontal"
          :data-source="systemAlerts"
        >
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>您有 {{ systemAlerts.length }} 条系统通知</span>
              <a-button type="link" @click="dismissAllAlerts">全部清除</a-button>
            </div>
          </template>
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.message" :description="item.details">
                <template #avatar>
                  <a-badge dot color="blue">
                    <warning-outlined v-if="item.type === 'error'" style="font-size: 20px; color: #ff4d4f" />
                    <exclamation-circle-outlined v-else-if="item.type === 'warning'" style="font-size: 20px; color: #faad14" />
                    <info-circle-outlined v-else style="font-size: 20px; color: #1890ff" />
                  </a-badge>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a @click="dismissAlert(item)">
                  <check-outlined />
                </a>
              </template>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-else description="暂无系统通知" />
      </a-spin>
    </a-drawer>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  SettingOutlined,
  UserOutlined,
  ToolOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  BellOutlined,
  CheckOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  AreaChartOutlined
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';
import { getAdminDashboard } from '@/api/admin';
import type { Alert } from '@/types/admin';

const router = useRouter();
const route = useRoute();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '管理员');
const showNotifications = ref<boolean>(false);
const loadingAlerts = ref<boolean>(false);
const systemAlerts = ref<Alert[]>([]);

// 计算当前页面标题
const currentPageTitle = computed(() => {
  switch (selectedKeys.value[0]) {
    case 'dashboard': return '系统概览';
    case 'users': return '所有用户';
    case 'patients': return '患者管理';
    case 'doctors': return '医生管理';
    case 'researchers': return '研究人员管理';
    case 'admins': return '管理员管理';
    case 'system-logs': return '系统日志';
    case 'system-health': return '系统健康';
    case 'system-metrics': return '系统指标';
    case 'batch-records': return '批量管理记录';
    case 'export-data': return '导出数据';
    case 'maintenance': return '系统维护';
    case 'settings': return '系统设置';
    case 'user-activity': return '用户活动分析';
    case 'profile': return '个人资料';
    default: return '系统管理';
  }
});

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  localStorage.setItem('adminSelectedMenu', key);
  
  // 根据选择的菜单项导航到相应的路由
  if (key === 'profile') {
    router.push('/admin/profile');
  } else {
    router.push(`/admin/${key}`);
  }
};

// 退出登录
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

// 加载系统警报
const loadSystemAlerts = async () => {
  loadingAlerts.value = true;
  try {
    const response = await getAdminDashboard();
    if (response.success && response.data) {
      systemAlerts.value = response.data.alerts || [];
    }
  } catch (error) {
    console.error('加载系统警报失败:', error);
    message.error('加载系统警报失败');
  } finally {
    loadingAlerts.value = false;
  }
};

// 清除单个警报
const dismissAlert = (alert: Alert) => {
  systemAlerts.value = systemAlerts.value.filter(a => a !== alert);
};

// 清除所有警报
const dismissAllAlerts = () => {
  systemAlerts.value = [];
};

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  (newPath) => {
    const path = newPath.split('/').pop() || 'dashboard';
    selectedKeys.value = [path];
    localStorage.setItem('adminSelectedMenu', path);
  }
);

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(async () => {
  const savedMenu = localStorage.getItem('adminSelectedMenu');
  if (savedMenu) {
    selectedKeys.value = [savedMenu];
  }
  
  // 加载系统警报
  await loadSystemAlerts();
});
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  text-align: center;
  overflow: hidden;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 