<template>
  <div>
    <a-spin :spinning="loading">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="系统用户"
              :value="dashboardData?.system_overview?.total_users || 0"
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <team-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="健康记录"
              :value="dashboardData?.system_overview?.total_records || 0"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <file-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="共享记录"
              :value="dashboardData?.system_overview?.total_shared_records || 0"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <share-alt-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="查询次数"
              :value="dashboardData?.system_overview?.total_queries || 0"
              :value-style="{ color: '#cf1322' }"
            >
              <template #prefix>
                <search-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-divider />

      <!-- 系统警报 -->
      <a-row :gutter="16" style="margin-bottom: 16px" v-if="dashboardData?.alerts?.length">
        <a-col :span="24">
          <a-card title="系统警报" class="alert-card">
            <template #extra>
              <a-button type="primary" size="small" @click="refreshDashboard">刷新</a-button>
            </template>
            <a-list size="small" :data-source="dashboardData?.alerts || []">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-alert
                    :message="item.message"
                    :description="item.details"
                    :type="getAlertType(item.type)"
                    show-icon
                  />
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 用户分布 -->
        <a-col :span="12">
          <a-card title="用户角色分布" :loading="loading">
            <template #extra>
              <a-button type="link" @click="router.push('/admin/users')">查看详情</a-button>
            </template>
            <div style="height: 300px" id="user-distribution-chart" ref="userDistributionChart"></div>
          </a-card>
        </a-col>

        <!-- 时间线数据 -->
        <a-col :span="12">
          <a-card title="近期记录变化" :loading="loading">
            <template #extra>
              <a-button type="link" @click="router.push('/admin/user-activity')">查看详情</a-button>
            </template>
            <div style="height: 300px" id="timeline-chart" ref="timelineChart"></div>
          </a-card>
        </a-col>
      </a-row>

      <a-divider />

      <a-row :gutter="16">
        <!-- 系统状态 -->
        <a-col :span="8">
          <a-card title="系统状态" :loading="loading">
            <template #extra>
              <a-button type="link" @click="router.push('/admin/system-health')">详情</a-button>
            </template>
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="维护模式">
                <a-tag :color="dashboardData?.system_status?.maintenance_mode ? 'orange' : 'green'">
                  {{ dashboardData?.system_status?.maintenance_mode ? '已启用' : '未启用' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="错误数量(24h)">
                {{ dashboardData?.system_status?.error_count_24h || 0 }}
              </a-descriptions-item>
              <a-descriptions-item label="PIR功能">
                <a-tag :color="dashboardData?.system_status?.pir_enabled ? 'blue' : 'gray'">
                  {{ dashboardData?.system_status?.pir_enabled ? '已启用' : '未启用' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="PIR查询数">
                {{ dashboardData?.system_status?.pir_query_count || 0 }}
              </a-descriptions-item>
              <a-descriptions-item label="需要备份">
                <a-tag :color="dashboardData?.system_status?.needs_backup ? 'red' : 'green'">
                  {{ dashboardData?.system_status?.needs_backup ? '是' : '否' }}
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <!-- 最近活动 -->
        <a-col :span="16">
          <a-card title="系统活动" :loading="loading">
            <a-tabs>
              <a-tab-pane key="logs" tab="系统日志">
                <a-list
                  size="small"
                  :data-source="dashboardData?.recent_activity?.logs?.slice(0, 5) || []"
                  :pagination="false"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta
                        :title="item.message"
                        :description="formatDate(item.created_at)"
                      >
                        <template #avatar>
                          <a-avatar style="background-color: #1890ff">
                            <template #icon><history-outlined /></template>
                          </a-avatar>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                  <template #footer>
                    <div style="text-align: center">
                      <a-button type="link" @click="router.push('/admin/system-logs')">查看所有日志</a-button>
                    </div>
                  </template>
                </a-list>
              </a-tab-pane>
              <a-tab-pane key="users" tab="新用户">
                <a-list
                  size="small"
                  :data-source="dashboardData?.recent_activity?.users?.slice(0, 5) || []"
                  :pagination="false"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta
                        :title="item.username"
                        :description="`邮箱: ${item.email} | 角色: ${formatRole(item.role)}`"
                      >
                        <template #avatar>
                          <a-avatar style="background-color: #52c41a">
                            {{ item.username.charAt(0).toUpperCase() }}
                          </a-avatar>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                  <template #footer>
                    <div style="text-align: center">
                      <a-button type="link" @click="router.push('/admin/users')">查看所有用户</a-button>
                    </div>
                  </template>
                </a-list>
              </a-tab-pane>
              <a-tab-pane key="queries" tab="最近查询">
                <a-list
                  size="small"
                  :data-source="dashboardData?.recent_activity?.queries?.slice(0, 5) || []"
                  :pagination="false"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta
                        :title="item.query_text || '查询记录'"
                        :description="formatDate(item.query_time)"
                      >
                        <template #avatar>
                          <a-avatar style="background-color: #fa8c16">
                            <template #icon><search-outlined /></template>
                          </a-avatar>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </a-col>
      </a-row>

      <a-divider />

      <a-row :gutter="16">
        <a-col :span="6">
          <a-card hoverable @click="router.push('/admin/users')">
            <template #cover>
              <div style="background-color: #1890ff; height: 120px; display: flex; justify-content: center; align-items: center;">
                <team-outlined style="font-size: 64px; color: white;" />
              </div>
            </template>
            <a-card-meta title="用户管理">
              <template #description>管理系统中的所有用户账号</template>
            </a-card-meta>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card hoverable @click="router.push('/admin/system-logs')">
            <template #cover>
              <div style="background-color: #722ed1; height: 120px; display: flex; justify-content: center; align-items: center;">
                <history-outlined style="font-size: 64px; color: white;" />
              </div>
            </template>
            <a-card-meta title="系统日志">
              <template #description>查看和分析系统操作日志</template>
            </a-card-meta>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card hoverable @click="router.push('/admin/settings')">
            <template #cover>
              <div style="background-color: #52c41a; height: 120px; display: flex; justify-content: center; align-items: center;">
                <setting-outlined style="font-size: 64px; color: white;" />
              </div>
            </template>
            <a-card-meta title="系统设置">
              <template #description>配置系统参数和功能</template>
            </a-card-meta>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card hoverable @click="router.push('/admin/maintenance')">
            <template #cover>
              <div style="background-color: #fa8c16; height: 120px; display: flex; justify-content: center; align-items: center;">
                <tool-outlined style="font-size: 64px; color: white;" />
              </div>
            </template>
            <a-card-meta title="系统维护">
              <template #description>执行系统维护任务和备份</template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import { 
  TeamOutlined, 
  FileOutlined, 
  ShareAltOutlined, 
  SearchOutlined,
  SettingOutlined,
  HistoryOutlined,
  ToolOutlined
} from '@ant-design/icons-vue';
import { getAdminDashboard } from '@/api/admin';
import type { AdminDashboardResponse, Alert } from '@/types/admin';

// 注册ECharts组件
echarts.use([
  BarChart,
  PieChart,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  CanvasRenderer
]);

const router = useRouter();
const loading = ref<boolean>(true);
const dashboardData = ref<AdminDashboardResponse | null>(null);
const userDistributionChart = ref<HTMLElement | null>(null);
const timelineChart = ref<HTMLElement | null>(null);
let userChart: echarts.ECharts | null = null;
let recordChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 加载仪表盘数据
const loadDashboardData = async () => {
  loading.value = true;
  try {
    const response = await getAdminDashboard();
    if (response.success && response.data) {
      dashboardData.value = response.data;
      
      // 数据加载完成后初始化图表
      nextTick(() => {
        initUserDistributionChart();
        initTimelineChart();
      });
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    message.error('加载仪表盘数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新仪表盘数据
const refreshDashboard = () => {
  loadDashboardData();
};

// 初始化用户分布图表
const initUserDistributionChart = () => {
  if (!dashboardData.value || !userDistributionChart.value) return;
  
  const chartDom = userDistributionChart.value;
  userChart = echarts.init(chartDom);
  
  const { user_distribution } = dashboardData.value;
  
  const option = {
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
        data: [
          { value: user_distribution?.patient || 0, name: '患者', itemStyle: { color: '#1890ff' } },
          { value: user_distribution?.doctor || 0, name: '医生', itemStyle: { color: '#52c41a' } },
          { value: user_distribution?.researcher || 0, name: '研究人员', itemStyle: { color: '#722ed1' } },
          { value: user_distribution?.admin || 0, name: '管理员', itemStyle: { color: '#fa8c16' } }
        ]
      }
    ]
  };
  
  userChart.setOption(option);
};

// 初始化时间线图表
const initTimelineChart = () => {
  if (!dashboardData.value || !timelineChart.value) return;
  
  const chartDom = timelineChart.value;
  recordChart = echarts.init(chartDom);
  
  const { timeline_data } = dashboardData.value;
  
  const dates = timeline_data.map(item => item.date);
  const counts = timeline_data.map(item => item.count);
  
  const option = {
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
      type: 'value'
    },
    series: [
      {
        name: '记录数量',
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
  
  recordChart.setOption(option);
};

// 格式化日期
const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化用户角色
const formatRole = (role: string): string => {
  switch (role) {
    case 'patient': return '患者';
    case 'doctor': return '医生';
    case 'researcher': return '研究人员';
    case 'admin': return '管理员';
    default: return role;
  }
};

// 获取警报类型
const getAlertType = (type: string): 'success' | 'info' | 'warning' | 'error' => {
  switch (type) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'info';
  }
};

// 监听窗口大小变化
const handleResize = () => {
  userChart?.resize();
  recordChart?.resize();
};

onMounted(async () => {
  await loadDashboardData();
  
  // 创建ResizeObserver监听容器大小变化
  if (userDistributionChart.value && timelineChart.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(userDistributionChart.value);
    resizeObserver.observe(timelineChart.value);
  }
  
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 清理图表实例和事件监听
  window.removeEventListener('resize', handleResize);
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  userChart?.dispose();
  recordChart?.dispose();
});
</script>

<style scoped>
.alert-card :deep(.ant-alert) {
  margin-bottom: 8px;
}

.alert-card :deep(.ant-alert:last-child) {
  margin-bottom: 0;
}

.ant-card {
  margin-bottom: 16px;
}
</style> 