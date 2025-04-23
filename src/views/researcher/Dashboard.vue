<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      width="240"
    >
      <div class="logo">
        <h3 v-if="!collapsed">PIR健康记录</h3>
        <h3 v-else>PIR</h3>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @select="handleMenuSelect"
      >
        <a-menu-item key="dashboard">
          <template #icon><dashboard-outlined /></template>
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="projects">
          <template #icon><project-outlined /></template>
          <span>研究项目</span>
        </a-menu-item>  
        <a-menu-item key="records">
          <template #icon><file-text-outlined /></template>
          <span>健康记录</span>
        </a-menu-item>  
        <a-menu-item key="pir">
          <template #icon><fund-outlined /></template>
          <span>隐私查询</span> 
        </a-menu-item>
        <a-menu-item key="experiment">
          <template #icon><fund-outlined /></template>
          <span>PIR实验</span>
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
          <a-badge :count="unreadNotifications" :dot="unreadNotifications > 0">
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
                  <template #icon><setting-outlined /></template>
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
            <router-link to="/researcher">首页</router-link>
          </a-breadcrumb-item>
          
          <a-breadcrumb-item v-if="route.path !== '/researcher'">
            <span v-if="route.path.includes('/project/')">
              <router-link to="/researcher/projects">研究项目</router-link>
            </span>
            <span v-else>{{ currentPageTitle }}</span>
          </a-breadcrumb-item>
          
          <a-breadcrumb-item v-if="route.path.includes('/project/')">
            {{ route.path.includes('/edit-project/') ? '编辑项目' : '项目详情' }}
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
    
    <!-- 通知抽屉 -->
    <a-drawer
      title="我的通知"
      placement="right"
      :open="showNotifications"
      @close="showNotifications = false"
      width="400"
    >
      <a-spin :spinning="loadingNotifications">
        <a-list
          v-if="notifications.length > 0"
          item-layout="horizontal"
          :data-source="notifications"
        >
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>您有 {{ unreadNotifications }} 条未读通知</span>
              <a-button type="link" @click="markAllAsRead">全部标为已读</a-button>
            </div>
          </template>
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.title" :description="item.message">
                <template #avatar>
                  <a-badge :dot="!item.is_read" color="blue">
                    <mail-outlined v-if="item.type === 'message'" style="font-size: 20px" />
                    <notification-outlined v-else-if="item.type === 'system'" style="font-size: 20px" />
                    <project-outlined v-else-if="item.type === 'record_shared'" style="font-size: 20px" />
                    <file-sync-outlined v-else-if="item.type === 'record_updated'" style="font-size: 20px" />
                    <info-circle-outlined v-else style="font-size: 20px" />
                  </a-badge>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a @click="markNotificationRead(item.id)">
                  <check-outlined />
                </a>
                <a @click="deleteNotification(item.id)">
                  <delete-outlined />
                </a>
              </template>
              <div style="color: #999; font-size: 12px">{{ formatDate(item.created_at) }}</div>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-else description="暂无通知" />
      </a-spin>
    </a-drawer>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watchEffect, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  DashboardOutlined, 
  ProjectOutlined,
  FundOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  AreaChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MailOutlined,
  NotificationOutlined,
  FileSyncOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons-vue';
import { getNotifications, getNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationApi } from '@/api/notifications';
import type { Notification } from '@/types/notifications';
import { getResearcherDashboard } from '@/api/researcher';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userStore = useUserStore();
const userName = ref<string>(localStorage.getItem('userName') || '研究人员用户');

// 通知相关
const showNotifications = ref<boolean>(false);
const loadingNotifications = ref<boolean>(false);
const notifications = ref<Notification[]>([]);
const unreadNotifications = ref<number>(0);

// 计算当前页面标题
const currentPageTitle = computed(() => {
  // 从路由元数据中获取标题
  if (route.meta.title) {
    return route.meta.title as string;
  }
  
  // 后备方案：根据路径判断标题
  const path = route.path;
  
  if (path === '/researcher') {
    return '工作台';
  } else if (path.includes('/researcher/projects')) {
    return '研究项目';
  } else if (path.includes('/researcher/records')) {
    return '健康记录';
  } else if (path.includes('/researcher/profile')) {
    return '个人设置';
  } else if (path.includes('/researcher/pir')) {
    return '隐私查询';
  } else if (path.includes('/researcher/experiment')) {
    return 'PIR实验';
  }
  
  return '工作台';
});

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  selectedKeys.value = [key];
  
  switch (key) {
    case 'dashboard':
      router.push('/researcher');
      break;
    case 'projects':  
      router.push('/researcher/projects');
      break;
    case 'records':
      router.push('/researcher/records');
      break;
    case 'profile':
      router.push('/researcher/profile');
      break;
    case 'pir':
      router.push('/researcher/pir');
      break;
    case 'experiment':
      router.push('/researcher/experiment');
      break;
  }
};

// 处理退出登录
const handleLogout = async () => {
  try {
    await userStore.logout();
    message.success('退出登录成功');
    router.push('/auth/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败');
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 获取通知列表
const fetchNotifications = async () => {
  loadingNotifications.value = true;
  try {
    const response = await getNotifications();
    if (response.success && response.data) {
      notifications.value = response.data.notifications;
    }
  } catch (error) {
    console.error('获取通知失败:', error);
    message.error('获取通知列表失败');
  } finally {
    loadingNotifications.value = false;
  }
};

// 获取未读通知数量
const fetchNotificationCount = async () => {
  try {
    const response = await getNotificationCount();
    if (response.success && response.data) {
      unreadNotifications.value = response.data.unread;
    }
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
  }
};

// 标记通知为已读
const markNotificationRead = async (id: string) => {
  try {
    const response = await markNotificationAsRead(id);
    if (response.success) {
      message.success('已标记为已读');
      fetchNotifications();
      fetchNotificationCount();
    }
  } catch (error) {
    console.error('标记通知失败:', error);
    message.error('标记通知失败');
  }
};

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    const response = await markAllNotificationsAsRead();
    if (response.success) {
      message.success('已将所有通知标记为已读');
      fetchNotifications();
      fetchNotificationCount();
    }
  } catch (error) {
    console.error('标记所有通知失败:', error);
    message.error('标记所有通知失败');
  }
};

// 删除通知
const deleteNotification = async (id: string) => {
  try {
    const response = await deleteNotificationApi(id);
    if (response.success) {
      message.success('通知已删除');
      fetchNotifications();
      fetchNotificationCount();
    }
  } catch (error) {
    console.error('删除通知失败:', error);
    message.error('删除通知失败');
  }
};

// 设置初始选中菜单项
const setInitialSelectedKey = () => {
  const path = route.path;
  
  // 根据当前路径设置选中的菜单项
  if (path === '/researcher') {
    selectedKeys.value = ['dashboard'];
  } else if (path.includes('/researcher/projects')) {
    selectedKeys.value = ['projects'];
  } else if (path.includes('/researcher/records')) {
    selectedKeys.value = ['records'];
  } else if (path.includes('/researcher/profile')) {
    selectedKeys.value = ['profile'];
  } else if (path.includes('/researcher/pir')) {
    selectedKeys.value = ['pir'];
  } else if (path.includes('/researcher/experiment')) {
    selectedKeys.value = ['experiment'];
  }
};

// 监听路由变化，更新选中的菜单项
watch(() => route.path, () => {
  setInitialSelectedKey();
});

// 组件挂载时
onMounted(() => {
  // 获取通知
  fetchNotifications();
  fetchNotificationCount();
  
  // 设置定时获取未读通知数量
  const timer = setInterval(fetchNotificationCount, 60000); // 每分钟更新一次
  
  // 设置初始选中菜单项
  setInitialSelectedKey();
  
  // 组件卸载时清除定时器
  watchEffect((onInvalidate) => {
    onInvalidate(() => {
      clearInterval(timer);
    });
  });
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

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

/* 添加过渡动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 