<template>
  <div>
    <h2>系统健康状态</h2>
    
    <a-spin :spinning="loading">
      <div class="action-bar">
        <a-button type="primary" @click="refreshData">
          <template #icon><reload-outlined /></template>
          刷新数据
        </a-button>
        <span class="timestamp" v-if="healthData">
          上次更新: {{ formatDate(healthData.timestamp) }}
        </span>
      </div>
      
      <a-row :gutter="16">
        <!-- 系统状态卡片 -->
        <a-col :span="8">
          <a-card title="系统状态" class="health-card">
            <template #extra>
              <a-tag :color="getOverallStatusColor()">{{ getOverallStatus() }}</a-tag>
            </template>
            
            <a-descriptions :column="1">
              <a-descriptions-item label="CPU使用率">
                <a-progress
                  :percent="healthData?.system?.cpu_usage ?? 0"
                  :status="getCpuStatus(healthData?.system?.cpu_usage ?? 0)"
                  :stroke-color="getCpuColor(healthData?.system?.cpu_usage ?? 0)"
                />
              </a-descriptions-item>
              
              <a-descriptions-item label="内存使用率">
                <a-progress
                  :percent="healthData?.system?.memory_usage?.percent ?? 0"
                  :status="getMemoryStatus(healthData?.system?.memory_usage?.percent ?? 0)"
                  :stroke-color="getMemoryColor(healthData?.system?.memory_usage?.percent ?? 0)"
                />
              </a-descriptions-item>
              
              <a-descriptions-item label="磁盘使用率">
                <a-progress
                  :percent="healthData?.system?.disk_usage?.percent ?? 0"
                  :status="getDiskStatus(healthData?.system?.disk_usage?.percent ?? 0)"
                  :stroke-color="getDiskColor(healthData?.system?.disk_usage?.percent ?? 0)"
                />
              </a-descriptions-item>
              
              <a-descriptions-item label="系统运行时间">
                <a-statistic 
                  :value="healthData?.system?.uptime ?? 0" 
                  :precision="0"
                  suffix="分钟"
                  :value-style="{ color: '#3f8600' }"
                />
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
        
        <!-- 数据库状态卡片 -->
        <a-col :span="8">
          <a-card title="数据库状态" class="health-card">
            <template #extra>
              <a-tag :color="getDatabaseStatusColor()">{{ getDatabaseStatus() }}</a-tag>
            </template>
            
            <a-descriptions :column="1">
              <a-descriptions-item label="MySQL状态">
                <a-badge
                  :status="healthData?.database?.mysql_status ? 'success' : 'error'"
                  :text="healthData?.database?.mysql_status ? '正常' : '异常'"
                />
              </a-descriptions-item>
              
              <a-descriptions-item label="MongoDB状态">
                <a-badge
                  :status="healthData?.database?.mongo_status ? 'success' : 'error'"
                  :text="healthData?.database?.mongo_status ? '正常' : '异常'"
                />
              </a-descriptions-item>
              
              <a-descriptions-item label="总记录数">
                <a-statistic 
                  :value="healthData?.database?.record_count ?? 0" 
                  :precision="0"
                  :value-style="{ color: '#3f8600' }"
                />
              </a-descriptions-item>
            </a-descriptions>
            
            <a-divider />
            
            <div class="chart-container">
              <h4>资源监控</h4>
              <div id="database-chart" ref="databaseChart" style="height: 220px"></div>
            </div>
          </a-card>
        </a-col>
        
        <!-- 用户状态卡片 -->
        <a-col :span="8">
          <a-card title="用户状态" class="health-card">
            <template #extra>
              <a-button type="link" @click="router.push('/admin/users')">查看详情</a-button>
            </template>
            
            <a-statistic-card>
              <a-statistic
                title="活跃用户"
                :value="healthData?.users?.active_users ?? 0"
                :precision="0"
                :value-style="{ color: '#3f8600' }"
              >
                <template #prefix><team-outlined /></template>
              </a-statistic>
              
              <div v-if="healthData?.users?.last_login_time" style="margin-top: 4px; font-size: 12px; color: #8c8c8c;">
                最后登录: {{ formatDate(healthData.users.last_login_time) }}
              </div>
              
              <a-statistic
                title="总用户数"
                :value="healthData?.users?.total_users ?? 0"
                :precision="0"
                style="margin-top: 16px"
              >
                <template #prefix><user-outlined /></template>
              </a-statistic>
              
              <a-progress
                :percent="calculateActiveUserPercent()"
                :format="(percent: number) => `活跃率: ${percent}%`"
                status="active"
                style="margin-top: 16px"
              />
            </a-statistic-card>
          </a-card>
        </a-col>
      </a-row>
      
      <a-row :gutter="16" style="margin-top: 16px">
        <!-- 系统详情卡片 -->
        <a-col :span="12">
          <a-card title="系统详情" class="health-card">
            <a-tabs>
              <a-tab-pane key="memory" tab="内存使用">
                <a-card :bordered="false">
                  <a-row>
                    <a-col :span="12">
                      <a-statistic
                        title="可用内存"
                        :value="formatSize(healthData?.system?.memory_usage?.available)"
                        :value-style="{ color: '#3f8600' }"
                      />
                    </a-col>
                    <a-col :span="12">
                      <a-statistic
                        title="总内存"
                        :value="formatSize(healthData?.system?.memory_usage?.total)"
                      />
                    </a-col>
                  </a-row>
                  
                  <div id="memory-chart" ref="memoryChart" style="height: 300px; margin-top: 16px"></div>
                </a-card>
              </a-tab-pane>
              
              <a-tab-pane key="disk" tab="磁盘使用">
                <a-card :bordered="false">
                  <a-row>
                    <a-col :span="8">
                      <a-statistic
                        title="总空间"
                        :value="formatSize(healthData?.system?.disk_usage?.total)"
                      />
                    </a-col>
                    <a-col :span="8">
                      <a-statistic
                        title="已用空间"
                        :value="formatSize(healthData?.system?.disk_usage?.used)"
                        :value-style="{ color: '#cf1322' }"
                      />
                    </a-col>
                    <a-col :span="8">
                      <a-statistic
                        title="可用空间"
                        :value="formatSize(healthData?.system?.disk_usage?.free)"
                        :value-style="{ color: '#3f8600' }"
                      />
                    </a-col>
                  </a-row>
                  
                  <div id="disk-chart" ref="diskChart" style="height: 300px; margin-top: 16px"></div>
                </a-card>
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </a-col>
        
        <!-- 系统维护建议 -->
        <a-col :span="12">
          <a-card title="系统维护建议" class="health-card">
            <template #extra>
              <a-button type="primary" size="small" @click="router.push('/admin/maintenance')">
                执行维护
              </a-button>
            </template>
            
            <a-timeline>
              <a-timeline-item v-if="healthData?.system?.cpu_usage && healthData.system.cpu_usage > 80" color="red">
                CPU使用率过高 ({{ healthData.system.cpu_usage }}%)，建议检查系统进程
              </a-timeline-item>
              
              <a-timeline-item v-if="healthData?.system?.memory_usage?.percent && healthData.system.memory_usage.percent > 80" color="red">
                内存使用率过高 ({{ healthData.system.memory_usage.percent }}%)，建议增加内存或优化应用
              </a-timeline-item>
              
              <a-timeline-item v-if="healthData?.system?.disk_usage?.percent && healthData.system.disk_usage.percent > 80" color="orange">
                磁盘使用率较高 ({{ healthData.system.disk_usage.percent }}%)，建议清理磁盘空间
              </a-timeline-item>
              
              <a-timeline-item v-if="!healthData?.database?.mysql_status" color="red">
                MySQL数据库连接异常，请检查数据库服务
              </a-timeline-item>
              
              <a-timeline-item v-if="!healthData?.database?.mongo_status" color="red">
                MongoDB数据库连接异常，请检查数据库服务
              </a-timeline-item>
              
              <a-timeline-item v-if="healthData?.database?.record_count && healthData.database.record_count > 1000000" color="orange">
                数据库记录数量较多 ({{ healthData.database.record_count }})，建议定期归档数据
              </a-timeline-item>
              
              <a-timeline-item v-if="healthData?.system?.uptime && healthData.system.uptime > 30 * 24 * 60 * 60" color="blue">
                系统已运行 {{ formatUptime(healthData.system.uptime) }}，建议定期重启系统
              </a-timeline-item>
              
              <a-timeline-item v-if="getMaintenanceSuggestions().length === 0" color="green">
                系统运行状态良好，暂无维护建议
              </a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { 
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  DatabaseOutlined,
  HddOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';
import { getSystemHealth } from '@/api/admin';
import type { SystemHealthResponse } from '@/types/admin';

// 注册ECharts组件
echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const router = useRouter();
const loading = ref<boolean>(true);
const healthData = ref<SystemHealthResponse | null>(null);
const databaseChart = ref<HTMLElement | null>(null);
const memoryChart = ref<HTMLElement | null>(null);
const diskChart = ref<HTMLElement | null>(null);
let dbChart: echarts.ECharts | null = null;
let memChart: echarts.ECharts | null = null;
let dskChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 加载系统健康数据
const loadHealthData = async () => {
  loading.value = true;
  try {
    const response = await getSystemHealth();
    if (response.success && response.data) {
      healthData.value = response.data;
      
      // 数据加载完成后初始化图表
      nextTick(() => {
        initDatabaseChart();
        initMemoryChart();
        initDiskChart();
      });
    }
  } catch (error) {
    console.error('加载系统健康数据失败:', error);
    message.error('加载系统健康数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  loadHealthData();
};

// 获取整体系统状态
const getOverallStatus = (): string => {
  if (!healthData.value) return '未知';
  
  const { system, database } = healthData.value;
  
  // 定义严重级别
  const criticalIssues = [
    !database.mysql_status,
    !database.mongo_status
  ];
  
  const majorIssues = [
    system.cpu_usage > 90,
    system.memory_usage.percent > 90,
    system.disk_usage.percent > 90
  ];
  
  const minorIssues = [
    system.cpu_usage > 75,
    system.memory_usage.percent > 75,
    system.disk_usage.percent > 75
  ];
  
  if (criticalIssues.some(Boolean)) return '严重';
  if (majorIssues.some(Boolean)) return '警告';
  if (minorIssues.some(Boolean)) return '注意';
  return '正常';
};

// 获取整体状态颜色
const getOverallStatusColor = (): string => {
  const status = getOverallStatus();
  switch (status) {
    case '严重': return 'red';
    case '警告': return 'orange';
    case '注意': return 'gold';
    case '正常': return 'green';
    default: return 'blue';
  }
};

// 获取数据库状态
const getDatabaseStatus = (): string => {
  if (!healthData.value) return '未知';
  
  const { database } = healthData.value;
  
  if (!database.mysql_status || !database.mongo_status) return '异常';
  return '正常';
};

// 获取数据库状态颜色
const getDatabaseStatusColor = (): string => {
  const status = getDatabaseStatus();
  switch (status) {
    case '异常': return 'red';
    case '正常': return 'green';
    default: return 'blue';
  }
};

// 获取CPU状态
const getCpuStatus = (percent?: number): 'normal' | 'active' | 'success' | 'exception' => {
  if (percent === undefined) return 'normal';
  if (percent > 90) return 'exception';
  if (percent > 75) return 'active';
  return 'success';
};

// 获取CPU颜色
const getCpuColor = (percent?: number): string => {
  if (percent === undefined) return '#1890ff';
  if (percent > 90) return '#ff4d4f';
  if (percent > 75) return '#faad14';
  return '#52c41a';
};

// 获取内存状态
const getMemoryStatus = (percent?: number): 'normal' | 'active' | 'success' | 'exception' => {
  if (percent === undefined) return 'normal';
  if (percent > 90) return 'exception';
  if (percent > 75) return 'active';
  return 'success';
};

// 获取内存颜色
const getMemoryColor = (percent?: number): string => {
  if (percent === undefined) return '#1890ff';
  if (percent > 90) return '#ff4d4f';
  if (percent > 75) return '#faad14';
  return '#52c41a';
};

// 获取磁盘状态
const getDiskStatus = (percent?: number): 'normal' | 'active' | 'success' | 'exception' => {
  if (percent === undefined) return 'normal';
  if (percent > 90) return 'exception';
  if (percent > 75) return 'active';
  return 'success';
};

// 获取磁盘颜色
const getDiskColor = (percent?: number): string => {
  if (percent === undefined) return '#1890ff';
  if (percent > 90) return '#ff4d4f';
  if (percent > 75) return '#faad14';
  return '#52c41a';
};

// 计算活跃用户百分比
const calculateActiveUserPercent = (): number => {
  if (!healthData.value || !healthData.value.users?.total_users) return 0;
  
  const { active_users, total_users } = healthData.value.users;
  return Math.round((active_users / total_users) * 100);
};

// 初始化数据库图表
const initDatabaseChart = () => {
  if (!healthData.value || !databaseChart.value) return;
  
  const chartDom = databaseChart.value;
  dbChart = echarts.init(chartDom);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      left: 'center',
      data: ['MySQL状态', 'MongoDB状态']
    },
    series: [
      {
        name: '数据库状态',
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
          {
            value: healthData.value.database.mysql_status ? 100 : 0,
            name: 'MySQL状态',
            itemStyle: {
              color: healthData.value.database.mysql_status ? '#52c41a' : '#ff4d4f'
            }
          },
          {
            value: healthData.value.database.mongo_status ? 100 : 0,
            name: 'MongoDB状态',
            itemStyle: {
              color: healthData.value.database.mongo_status ? '#1890ff' : '#ff4d4f'
            }
          }
        ]
      }
    ]
  };
  
  dbChart.setOption(option);
};

// 初始化内存图表
const initMemoryChart = () => {
  if (!healthData.value || !memoryChart.value) return;
  
  const chartDom = memoryChart.value;
  memChart = echarts.init(chartDom);
  
  const { memory_usage } = healthData.value.system;
  const used = memory_usage.total - memory_usage.available;
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['已用内存', '可用内存']
    },
    series: [
      {
        name: '内存使用',
        type: 'pie',
        radius: '70%',
        center: ['40%', '50%'],
        data: [
          {
            value: used,
            name: '已用内存',
            itemStyle: { color: '#ff4d4f' }
          },
          {
            value: memory_usage.available,
            name: '可用内存',
            itemStyle: { color: '#52c41a' }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%\n{c} bytes'
        }
      }
    ]
  };
  
  memChart.setOption(option);
};

// 初始化磁盘图表
const initDiskChart = () => {
  if (!healthData.value || !diskChart.value) return;
  
  const chartDom = diskChart.value;
  dskChart = echarts.init(chartDom);
  
  const { disk_usage } = healthData.value.system;
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['已用空间', '可用空间']
    },
    series: [
      {
        name: '磁盘使用',
        type: 'pie',
        radius: '70%',
        center: ['40%', '50%'],
        data: [
          {
            value: disk_usage.used,
            name: '已用空间',
            itemStyle: { color: '#faad14' }
          },
          {
            value: disk_usage.free,
            name: '可用空间',
            itemStyle: { color: '#52c41a' }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%\n{c} bytes'
        }
      }
    ]
  };
  
  dskChart.setOption(option);
};

// 获取维护建议
const getMaintenanceSuggestions = (): string[] => {
  if (!healthData.value) return [];
  
  const suggestions: string[] = [];
  const { system, database } = healthData.value;
  
  if (system.cpu_usage > 80) {
    suggestions.push(`CPU使用率过高 (${system.cpu_usage}%)`);
  }
  
  if (system.memory_usage.percent > 80) {
    suggestions.push(`内存使用率过高 (${system.memory_usage.percent}%)`);
  }
  
  if (system.disk_usage.percent > 80) {
    suggestions.push(`磁盘使用率较高 (${system.disk_usage.percent}%)`);
  }
  
  if (!database.mysql_status) {
    suggestions.push('MySQL数据库连接异常');
  }
  
  if (!database.mongo_status) {
    suggestions.push('MongoDB数据库连接异常');
  }
  
  if (database.record_count > 1000000) {
    suggestions.push(`数据库记录数量较多 (${database.record_count})`);
  }
  
  if (system.uptime > 30 * 24 * 60 * 60) {
    suggestions.push(`系统已运行 ${formatUptime(system.uptime)}`);
  }
  
  return suggestions;
};

// 格式化日期
const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化运行时间
const formatUptime = (uptime?: number): string => {
  if (!uptime) return '未知';
  
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  }
  
  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  }
  
  return `${minutes}分钟`;
};

// 格式化文件大小
const formatSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// 监听窗口大小变化
const handleResize = () => {
  dbChart?.resize();
  memChart?.resize();
  dskChart?.resize();
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadHealthData();
  
  // 创建ResizeObserver监听容器大小变化
  if (databaseChart.value && memoryChart.value && diskChart.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(databaseChart.value);
    resizeObserver.observe(memoryChart.value);
    resizeObserver.observe(diskChart.value);
  }
  
  window.addEventListener('resize', handleResize);
  
  // 设置定时刷新
  const timer = setInterval(loadHealthData, 60000); // 每分钟刷新一次
  
  onBeforeUnmount(() => {
    clearInterval(timer);
    window.removeEventListener('resize', handleResize);
    
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    
    dbChart?.dispose();
    memChart?.dispose();
    dskChart?.dispose();
  });
});
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.timestamp {
  color: #8c8c8c;
  font-size: 12px;
}

.health-card {
  height: 100%;
  margin-bottom: 16px;
}

.chart-container {
  margin-top: 16px;
}
</style> 