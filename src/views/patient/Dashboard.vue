<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      width="240"
    >
      <div class="logo" style="height: 32px; margin: 16px; color: white; font-size: 18px; font-weight: bold; text-align: center">
        PIR健康系统
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @select="handleMenuSelect"
      >
        <a-menu-item key="dashboard">
          <dashboard-outlined />
          <span>健康概览</span>
        </a-menu-item>
        <a-menu-item key="records">
          <file-outlined />
          <span>健康记录</span>
        </a-menu-item>
        <a-menu-item key="add-record">
          <file-add-outlined />
          <span>添加记录</span>
        </a-menu-item>
        <a-menu-item key="shared">
          <team-outlined />
          <span>共享记录</span>
        </a-menu-item>
        <a-menu-item key="pir-query">
          <safety-outlined />
          <span>隐私查询</span>
        </a-menu-item>
        <a-menu-item key="statistics">
          <bar-chart-outlined />
          <span>健康统计</span>
        </a-menu-item>
        <a-sub-menu key="privacy-tools">
          <template #title>
            <span>
              <lock-outlined />
              <span>隐私工具</span>
            </span>
          </template>
          <a-menu-item key="pir-settings">隐私设置</a-menu-item>
          <a-menu-item key="pir-history">查询历史</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="profile">
          <user-outlined />
          <span>个人设置</span>
        </a-menu-item>
        <a-menu-item key="logout" @click="handleLogout">
          <logout-outlined />
          <span>退出登录</span>
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
          <span style="margin-left: 16px">欢迎，{{ userName }}</span>
        </div>
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
                    <share-alt-outlined v-else-if="item.type === 'record_shared'" style="font-size: 20px" />
                    <file-sync-outlined v-else-if="item.type === 'record_updated'" style="font-size: 20px" />
                    <calendar-outlined v-else-if="item.type === 'appointment'" style="font-size: 20px" />
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
import { ref, computed, markRaw, defineAsyncComponent, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  DashboardOutlined, 
  FileOutlined, 
  FileAddOutlined,
  BarChartOutlined, 
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  MailOutlined,
  NotificationOutlined,
  ShareAltOutlined,
  FileSyncOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { logout } from '@/api/auth';
import { getNotifications, getNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationApi } from '@/api/notifications';
import type { Notification } from '@/types/notifications';

// 默认页面组件 - 健康概览
const DashboardContent = defineAsyncComponent(() => 
  import('@/components/patient/DashboardContent.vue')
);

// 懒加载其他页面组件
const RecordsContent = defineAsyncComponent(() => 
  import('@/components/patient/RecordsContent.vue')
);
const AddRecordContent = defineAsyncComponent(() => 
  import('@/components/patient/AddRecordContent.vue')
);
const SharedRecordsContent = defineAsyncComponent(() => 
  import('@/components/patient/SharedRecordsContent.vue')
);
const PirQueryContent = defineAsyncComponent(() => 
  import('@/components/patient/PirQueryContent.vue')
);
const StatisticsContent = defineAsyncComponent(() => 
  import('@/components/patient/StatisticsContent.vue')
);
const PirSettingsContent = defineAsyncComponent(() => 
  import('@/components/patient/PirSettingsContent.vue')
);
const PirHistoryContent = defineAsyncComponent(() => 
  import('@/components/patient/PirHistoryContent.vue')
);
const ProfileContent = defineAsyncComponent(() => 
  import('@/views/auth/Profile.vue')
);

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '患者用户');

// 通知相关
const showNotifications = ref<boolean>(false);
const loadingNotifications = ref<boolean>(false);
const notifications = ref<Notification[]>([]);
const unreadNotifications = ref<number>(0);

// 当前显示的组件
const currentView = ref(markRaw(DashboardContent));

// 页面标题映射
const pageTitles: Record<string, string> = {
  dashboard: '健康概览',
  records: '健康记录',
  'add-record': '添加记录',
  shared: '共享记录',
  'pir-query': '隐私查询',
  statistics: '健康统计',
  'pir-settings': '隐私设置',
  'pir-history': '查询历史',
  profile: '个人设置'
};

// 计算当前页面标题
const currentPageTitle = computed(() => {
  return pageTitles[selectedKeys.value[0]] || '健康概览';
});

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  selectedKeys.value = [key];
  switch (key) {
    case 'dashboard':
      currentView.value = markRaw(DashboardContent);
      break;
    case 'records':
      currentView.value = markRaw(RecordsContent);
      break;
    case 'add-record':
      currentView.value = markRaw(AddRecordContent);
      break;
    case 'shared':
      currentView.value = markRaw(SharedRecordsContent);
      break;
    case 'pir-query':
      currentView.value = markRaw(PirQueryContent);
      break;
    case 'statistics':
      currentView.value = markRaw(StatisticsContent);
      break;
    case 'pir-settings':
      currentView.value = markRaw(PirSettingsContent);
      break;
    case 'pir-history':
      currentView.value = markRaw(PirHistoryContent);
      break;
    case 'profile':
      currentView.value = markRaw(ProfileContent);
      break;
  }
};

// 处理登出
const handleLogout = async () => {
  try {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    message.success('已成功退出登录');
    router.push('/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败，请重试');
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

// 组件挂载时获取通知
onMounted(() => {
  fetchNotifications();
  fetchNotificationCount();
  
  // 设置定时获取未读通知数量
  const timer = setInterval(fetchNotificationCount, 60000); // 每分钟更新一次
  
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
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
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
</style> 