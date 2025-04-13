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
        <a-menu-item key="system-logs">
          <file-outlined />
          <span>系统日志</span>
        </a-menu-item>
        <a-menu-item key="users">
          <team-outlined />
          <span>用户管理</span>
        </a-menu-item>
        <a-sub-menu key="data-management">
          <template #title>
            <span>
              <database-outlined />
              <span>数据管理</span>
            </span>
          </template>
          <a-menu-item key="batch-records">批量管理记录</a-menu-item>
          <a-menu-item key="export-data">导出数据</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="settings">
          <setting-outlined />
          <span>系统设置</span>
        </a-menu-item>
        <a-menu-item key="user-activity">
          <bar-chart-outlined />
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
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  FileOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue';
import { getAdminDashboard } from '@/api/admin';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '管理员');
const userStore = useUserStore();

// 计算当前页面标题
const currentPageTitle = computed(() => {
  // 从路由元数据中获取标题
  if (route.meta.title) {
    return route.meta.title as string;
  }
  
  // 后备方案：根据路径判断标题
  switch (selectedKeys.value[0]) {
    case 'dashboard': return '系统概览';
    case 'system-logs': return '系统日志';
    case 'users': return '用户管理';
    case 'batch-records': return '批量管理记录';
    case 'export-data': return '导出数据';
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
  } else if (key === 'dashboard') {
    router.push('/admin');
  } else {
    router.push(`/admin/${key}`);
  }
};

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout();
    message.success('退出登录成功');
    router.push('/auth/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败，但已清除本地登录状态');
    router.push('/auth/login');
  }
};

// 设置初始选中菜单项
const setInitialSelectedKey = () => {
  const path = route.path;
  
  if (path === '/admin') {
    selectedKeys.value = ['dashboard'];
  } else if (path.includes('/admin/system-logs')) {
    selectedKeys.value = ['system-logs'];
  } else if (path.includes('/admin/users')) {
    selectedKeys.value = ['users']; 
  } else if (path.includes('/admin/batch-records')) {
    selectedKeys.value = ['batch-records'];
  } else if (path.includes('/admin/export-data')) {
    selectedKeys.value = ['export-data'];
  } else if (path.includes('/admin/data-backup')) {
    selectedKeys.value = ['data-backup'];
  } else if (path.includes('/admin/settings')) {
    selectedKeys.value = ['settings'];
  } else if (path.includes('/admin/user-activity')) {
    selectedKeys.value = ['user-activity'];
  } else if (path.includes('/admin/profile')) {
    selectedKeys.value = ['profile'];
  }
};

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  () => {
    setInitialSelectedKey();
  }
);

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(() => {
  const savedMenu = localStorage.getItem('adminSelectedMenu');
  if (savedMenu) {
    selectedKeys.value = [savedMenu];
  }
  
  setInitialSelectedKey();
});
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 