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
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="patients" @click="activeContent = 'patients'">
          <template #icon><team-outlined /></template>
          <span>患者管理</span>
        </a-menu-item>
        <a-menu-item key="appointments" @click="activeContent = 'appointments'">
          <template #icon><calendar-outlined /></template>
          <span>预约管理</span>
        </a-menu-item>
        <a-menu-item key="prescriptions" @click="activeContent = 'prescriptions'">
          <template #icon><medicine-box-outlined /></template>
          <span>处方管理</span>
        </a-menu-item>
        <a-menu-item key="records" @click="activeContent = 'records'">
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
          <a-menu-item key="statistics-1" @click="activeContent = 'statistics'">患者统计</a-menu-item>
          <a-menu-item key="statistics-2" @click="activeContent = 'statistics'">疾病统计</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 16px; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 18px; font-weight: bold">医生工作台</span>
        <a-popover placement="bottomRight" trigger="click">
          <template #content>
            <a-menu style="border: none; width: 160px">
              <a-menu-item key="user-profile" @click="activeContent = 'profile'">
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
          <div style="display: flex; align-items: center; cursor: pointer">
            <a-avatar :size="32" style="background-color: #52c41a">
              {{ userName.charAt(0).toUpperCase() }}
            </a-avatar>
            <span style="margin-left: 8px">{{ userName }} 医生</span>
          </div>
        </a-popover>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>首页</a-breadcrumb-item>
          <a-breadcrumb-item>{{ breadcrumbTitle }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <!-- 工作台内容 -->
          <div v-if="activeContent === 'dashboard'">
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
                  <a-button type="primary" @click="activeContent = 'patients'">查看患者列表</a-button>
                </a-card>
              </a-col>
              <a-col :span="8">
                <a-card title="预约管理" :bordered="false">
                  <template #extra><a href="#">更多</a></template>
                  <p>管理您的医疗预约</p>
                  <a-button type="primary" @click="activeContent = 'appointments'">管理预约</a-button>
                </a-card>
              </a-col>
              <a-col :span="8">
                <a-card title="处方管理" :bordered="false">
                  <template #extra><a href="#">更多</a></template>
                  <p>管理患者处方</p>
                  <a-button type="primary" @click="activeContent = 'prescriptions'">管理处方</a-button>
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

          <!-- 患者管理内容 -->
          <div v-if="activeContent === 'patients'">
            <h1>患者管理</h1>
            <a-empty description="暂无患者数据" />
          </div>

          <!-- 预约管理内容 -->
          <div v-if="activeContent === 'appointments'">
            <h1>预约管理</h1>
            <a-empty description="暂无预约数据" />
          </div>

          <!-- 处方管理内容 -->
          <div v-if="activeContent === 'prescriptions'">
            <h1>处方管理</h1>
            <a-empty description="暂无处方数据" />
          </div>

          <!-- 医疗记录内容 -->
          <div v-if="activeContent === 'records'">
            <h1>医疗记录</h1>
            <a-empty description="暂无医疗记录" />
          </div>

          <!-- 统计分析内容 -->
          <div v-if="activeContent === 'statistics'">
            <h1>统计分析</h1>
            <a-empty description="暂无统计数据" />
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
import ProfileComponent from '@/views/auth/Profile.vue';

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const userName = ref<string>(localStorage.getItem('userName') || '医生用户');
const activeContent = ref('dashboard');

// 根据当前激活的内容计算面包屑标题
const breadcrumbTitle = computed(() => {
  switch (activeContent.value) {
    case 'dashboard': return '工作台';
    case 'patients': return '患者管理';
    case 'appointments': return '预约管理';
    case 'prescriptions': return '处方管理';
    case 'records': return '医疗记录';
    case 'statistics': return '统计分析';
    case 'profile': return '个人设置';
    default: return '工作台';
  }
});

// 监听内容变化时更新selectedKeys和保存到localStorage
watch(activeContent, (newVal) => {
  selectedKeys.value = [newVal];
  localStorage.setItem('doctorSelectedMenu', newVal);
});

const goToProfile = () => {
  activeContent.value = 'profile';
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
    localStorage.removeItem('doctorSelectedMenu');
    router.push('/auth/login');
  }
};

// 组件挂载时，从localStorage读取上次选中的菜单项
onMounted(() => {
  const savedMenu = localStorage.getItem('doctorSelectedMenu');
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