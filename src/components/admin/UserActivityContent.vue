<template>
  <div>
    <h2>用户活动分析</h2>
    
    <a-spin :spinning="loading">
      <div class="action-bar">
        <a-space>
          <a-select 
            v-model:value="timePeriod" 
            style="width: 120px" 
            @change="handlePeriodChange"
          >
            <a-select-option value="7">最近7天</a-select-option>
            <a-select-option value="15">最近15天</a-select-option>
            <a-select-option value="30">最近30天</a-select-option>
            <a-select-option value="90">最近90天</a-select-option>
          </a-select>
          
          <a-button type="primary" @click="refreshData">
            <template #icon><reload-outlined /></template>
            刷新数据
          </a-button>
        </a-space>
      </div>
      
      <a-row :gutter="16">
        <!-- 日常活动图表 -->
        <a-col :span="24">
          <a-card title="日常活动趋势" class="chart-card">
            <div id="daily-activity-chart" ref="dailyActivityChart" style="height: 300px"></div>
          </a-card>
        </a-col>
      </a-row>
      
      <a-row :gutter="16" style="margin-top: 16px">
        <!-- 角色分布图表 -->
        <a-col :span="12">
          <a-card title="用户角色分布" class="chart-card">
            <div id="role-distribution-chart" ref="roleDistributionChart" style="height: 300px"></div>
          </a-card>
        </a-col>
        
        <!-- 最活跃用户 -->
        <a-col :span="12">
          <a-card title="最活跃用户">
            <a-table
              :columns="activeUserColumns"
              :data-source="activityData?.most_active_users || []"
              :pagination="false"
              rowKey="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'role'">
                  <a-tag :color="getRoleColor(record.role)">
                    {{ formatRole(record.role) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <a-button size="small" @click="viewUserActivity(record.id)">
                    <template #icon><eye-outlined /></template>
                    查看
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
      
      <!-- 用户详细活动抽屉 -->
      <a-drawer
        :title="`用户活动详情 - ${selectedUserName}`"
        placement="right"
        :width="600"
        :visible="drawerVisible"
        @close="drawerVisible = false"
      >
        <a-spin :spinning="userActivityLoading">
          <!-- 用户活动图表 -->
          <div v-if="userActivityData?.daily_activity?.length">
            <div id="user-activity-chart" ref="userActivityChart" style="height: 300px"></div>
          </div>
          <a-empty v-else description="暂无活动数据" />
        </a-spin>
      </a-drawer>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { 
  ReloadOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';
import { getUserActivity } from '@/api/admin';
import type { UserActivityResponse, ActivityData, ActiveUser } from '@/types/admin';

// 注册ECharts组件
echarts.use([
  LineChart,
  PieChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  CanvasRenderer
]);

// 状态变量
const loading = ref<boolean>(true);
const timePeriod = ref<string>('30');
const activityData = ref<UserActivityResponse | null>(null);
const dailyActivityChart = ref<HTMLElement | null>(null);
const roleDistributionChart = ref<HTMLElement | null>(null);
let actvChart: echarts.ECharts | null = null;
let roleChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 用户详情抽屉
const drawerVisible = ref<boolean>(false);
const selectedUserId = ref<number | null>(null);
const selectedUserName = ref<string>('');
const userActivityLoading = ref<boolean>(false);
const userActivityData = ref<UserActivityResponse | null>(null);
const userActivityChart = ref<HTMLElement | null>(null);
let userActvChart: echarts.ECharts | null = null;

// 活跃用户列表表格列定义
const activeUserColumns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
  },
  {
    title: '活动数',
    dataIndex: 'activity_count',
    key: 'activity_count',
    sorter: (a: ActiveUser, b: ActiveUser) => a.activity_count - b.activity_count,
    sortDirections: ['descend', 'ascend'],
    defaultSortOrder: 'descend',
  },
  {
    title: '操作',
    key: 'actions',
  },
];

// 加载用户活动数据
const loadActivityData = async () => {
  loading.value = true;
  try {
    const response = await getUserActivity(parseInt(timePeriod.value));
    if (response.success && response.data) {
      activityData.value = response.data;
      
      nextTick(() => {
        initDailyActivityChart();
        initRoleDistributionChart();
      });
    }
  } catch (error) {
    console.error('获取用户活动数据失败:', error);
    message.error('获取用户活动数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  loadActivityData();
};

// 时间周期更改
const handlePeriodChange = () => {
  loadActivityData();
};

// 初始化日常活动图表
const initDailyActivityChart = () => {
  if (!activityData.value || !dailyActivityChart.value) return;
  
  const chartDom = dailyActivityChart.value;
  if (actvChart) {
    actvChart.dispose();
  }
  actvChart = echarts.init(chartDom);
  
  const { daily_activity } = activityData.value;
  
  const dates = daily_activity.map(item => item.date);
  const counts = daily_activity.map(item => item.count);
  
  const option = {
    title: {
      text: `最近${timePeriod.value}天用户活动趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '活动次数'
    },
    series: [
      {
        name: '活动次数',
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(24, 144, 255, 0.7)'
              },
              {
                offset: 1,
                color: 'rgba(24, 144, 255, 0.1)'
              }
            ]
          }
        }
      }
    ]
  };
  
  actvChart.setOption(option);
};

// 初始化角色分布图表
const initRoleDistributionChart = () => {
  if (!activityData.value || !roleDistributionChart.value) return;
  
  const chartDom = roleDistributionChart.value;
  if (roleChart) {
    roleChart.dispose();
  }
  roleChart = echarts.init(chartDom);
  
  const { role_distribution } = activityData.value;
  
  const roleData = [
    { value: role_distribution?.patient || 0, name: '患者', itemStyle: { color: '#1890ff' } },
    { value: role_distribution?.doctor || 0, name: '医生', itemStyle: { color: '#52c41a' } },
    { value: role_distribution?.researcher || 0, name: '研究人员', itemStyle: { color: '#722ed1' } },
    { value: role_distribution?.admin || 0, name: '管理员', itemStyle: { color: '#fa8c16' } }
  ];
  
  const option = {
    title: {
      text: '用户角色分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['患者', '医生', '研究人员', '管理员']
    },
    series: [
      {
        name: '用户角色',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: roleData
      }
    ]
  };
  
  roleChart.setOption(option);
};

// 查看用户活动
const viewUserActivity = async (userId: number) => {
  selectedUserId.value = userId;
  const user = activityData.value?.most_active_users.find(u => u.id === userId);
  if (user) {
    selectedUserName.value = user.username;
  }
  
  drawerVisible.value = true;
  
  // 加载用户活动数据
  userActivityLoading.value = true;
  try {
    const response = await getUserActivity(parseInt(timePeriod.value), userId);
    if (response.success && response.data) {
      userActivityData.value = response.data;
      
      nextTick(() => {
        initUserActivityChart();
      });
    }
  } catch (error) {
    console.error('获取用户活动数据失败:', error);
    message.error('获取用户活动数据失败');
  } finally {
    userActivityLoading.value = false;
  }
};

// 初始化用户活动图表
const initUserActivityChart = () => {
  if (!userActivityData.value || !userActivityChart.value) return;
  
  const chartDom = userActivityChart.value;
  if (userActvChart) {
    userActvChart.dispose();
  }
  userActvChart = echarts.init(chartDom);
  
  const { daily_activity } = userActivityData.value;
  
  const dates = daily_activity.map(item => item.date);
  const counts = daily_activity.map(item => item.count);
  
  const option = {
    title: {
      text: `用户 ${selectedUserName.value} 的活动趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '活动次数'
    },
    series: [
      {
        name: '活动次数',
        type: 'line',
        smooth: true,
        data: counts,
        itemStyle: {
          color: '#722ed1'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(114, 46, 209, 0.7)'
              },
              {
                offset: 1,
                color: 'rgba(114, 46, 209, 0.1)'
              }
            ]
          }
        }
      }
    ]
  };
  
  userActvChart.setOption(option);
};

// 格式化角色
const formatRole = (role: string): string => {
  switch (role) {
    case 'patient': return '患者';
    case 'doctor': return '医生';
    case 'researcher': return '研究人员';
    case 'admin': return '管理员';
    default: return role;
  }
};

// 获取角色颜色
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'patient': return 'blue';
    case 'doctor': return 'green';
    case 'researcher': return 'purple';
    case 'admin': return 'orange';
    default: return 'default';
  }
};

// 监听窗口大小变化
const handleResize = () => {
  actvChart?.resize();
  roleChart?.resize();
  userActvChart?.resize();
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadActivityData();
  
  // 创建ResizeObserver监听容器大小变化
  if (dailyActivityChart.value && roleDistributionChart.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(dailyActivityChart.value);
    resizeObserver.observe(roleDistributionChart.value);
  }
  
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  actvChart?.dispose();
  roleChart?.dispose();
  userActvChart?.dispose();
});
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;
}
</style> 