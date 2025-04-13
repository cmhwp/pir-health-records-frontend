<template>
  <div class="system-metrics-container">
    <a-page-header
      title="系统指标"
      subtitle="监控系统性能和利用率指标"
    />
    
    <!-- 主要指标卡片 -->
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="CPU利用率"
            :value="metrics.cpu.usage"
            :precision="1"
            suffix="%"
            :value-style="{ color: getCpuColor(metrics.cpu.usage) }"
          >
            <template #prefix>
              <dashboard-outlined />
            </template>
          </a-statistic>
          <a-progress
            :percent="metrics.cpu.usage"
            :stroke-color="getCpuColor(metrics.cpu.usage)"
            size="small"
            :status="getCpuStatus(metrics.cpu.usage)"
          />
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="内存利用率"
            :value="metrics.memory.usagePercent"
            :precision="1"
            suffix="%"
            :value-style="{ color: getMemoryColor(metrics.memory.usagePercent) }"
          >
            <template #prefix>
              <database-outlined />
            </template>
          </a-statistic>
          <a-progress
            :percent="metrics.memory.usagePercent"
            :stroke-color="getMemoryColor(metrics.memory.usagePercent)"
            size="small"
            :status="getMemoryStatus(metrics.memory.usagePercent)"
          />
          <div class="sub-stat">
            已用: {{ formatBytes(metrics.memory.used) }} / 总计: {{ formatBytes(metrics.memory.total) }}
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="磁盘利用率"
            :value="metrics.disk.usagePercent"
            :precision="1"
            suffix="%"
            :value-style="{ color: getDiskColor(metrics.disk.usagePercent) }"
          >
            <template #prefix>
              <hdd-outlined />
            </template>
          </a-statistic>
          <a-progress
            :percent="metrics.disk.usagePercent"
            :stroke-color="getDiskColor(metrics.disk.usagePercent)"
            size="small"
            :status="getDiskStatus(metrics.disk.usagePercent)"
          />
          <div class="sub-stat">
            可用: {{ formatBytes(metrics.disk.free) }} / 总计: {{ formatBytes(metrics.disk.total) }}
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="数据库连接数"
            :value="metrics.database.connections"
            :value-style="{ color: getDbColor(metrics.database.connections, metrics.database.maxConnections) }"
          >
            <template #prefix>
              <api-outlined />
            </template>
          </a-statistic>
          <a-progress
            :percent="(metrics.database.connections / metrics.database.maxConnections) * 100"
            :stroke-color="getDbColor(metrics.database.connections, metrics.database.maxConnections)"
            size="small"
            :status="getDbStatus(metrics.database.connections, metrics.database.maxConnections)"
          />
          <div class="sub-stat">
            最大连接数: {{ metrics.database.maxConnections }}
          </div>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 系统负载和响应时间 -->
    <a-card title="系统负载和响应时间" class="chart-card" :loading="loading">
      <a-row :gutter="16">
        <a-col :span="12">
          <div ref="loadChart" class="chart-container"></div>
        </a-col>
        <a-col :span="12">
          <div ref="responseTimeChart" class="chart-container"></div>
        </a-col>
      </a-row>
    </a-card>
    
    <!-- API请求统计 -->
    <a-card title="API请求统计（最近24小时）" class="chart-card" :loading="loading">
      <a-row :gutter="16">
        <a-col :span="24">
          <div ref="apiRequestsChart" class="chart-container"></div>
        </a-col>
      </a-row>
    </a-card>
    
    <!-- 详细指标表格 -->
    <a-card title="详细系统指标" class="chart-card">
      <a-tabs>
        <a-tab-pane key="cpu" tab="CPU">
          <a-table :columns="cpuColumns" :data-source="metrics.cpu.cores" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'usage'">
                <a-progress
                  :percent="record.usage"
                  :stroke-color="getCpuColor(record.usage)"
                  size="small"
                  :status="getCpuStatus(record.usage)"
                />
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="memory" tab="内存">
          <a-descriptions bordered :column="2">
            <a-descriptions-item label="总内存">{{ formatBytes(metrics.memory.total) }}</a-descriptions-item>
            <a-descriptions-item label="已使用">{{ formatBytes(metrics.memory.used) }}</a-descriptions-item>
            <a-descriptions-item label="可用内存">{{ formatBytes(metrics.memory.free) }}</a-descriptions-item>
            <a-descriptions-item label="使用率">{{ metrics.memory.usagePercent }}%</a-descriptions-item>
            <a-descriptions-item label="交换分区总大小">{{ formatBytes(metrics.memory.swapTotal) }}</a-descriptions-item>
            <a-descriptions-item label="交换分区已使用">{{ formatBytes(metrics.memory.swapUsed) }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        
        <a-tab-pane key="disk" tab="磁盘">
          <a-table :columns="diskColumns" :data-source="metrics.disk.mounts" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'usage'">
                <a-progress
                  :percent="record.usagePercent"
                  :stroke-color="getDiskColor(record.usagePercent)"
                  size="small"
                  :status="getDiskStatus(record.usagePercent)"
                />
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="network" tab="网络">
          <a-descriptions bordered :column="2">
            <a-descriptions-item label="当前下载速率">{{ formatBytes(metrics.network.rxSec) }}/s</a-descriptions-item>
            <a-descriptions-item label="当前上传速率">{{ formatBytes(metrics.network.txSec) }}/s</a-descriptions-item>
            <a-descriptions-item label="总接收数据">{{ formatBytes(metrics.network.rxTotal) }}</a-descriptions-item>
            <a-descriptions-item label="总发送数据">{{ formatBytes(metrics.network.txTotal) }}</a-descriptions-item>
            <a-descriptions-item label="活动连接数">{{ metrics.network.connections }}</a-descriptions-item>
            <a-descriptions-item label="错误包数量">{{ metrics.network.errors }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  DashboardOutlined, 
  DatabaseOutlined,
  HddOutlined,
  ApiOutlined
} from '@ant-design/icons-vue';
import * as echarts from 'echarts/core';
import { 
  LineChart, 
  BarChart 
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  BarChart,
  CanvasRenderer
]);

// 定义接口
interface CpuCore {
  id: number;
  model: string;
  speed: number;
  usage: number;
}

interface DiskMount {
  key: string;
  mount: string;
  filesystem: string;
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: CpuCore[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    swapTotal: number;
    swapUsed: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    mounts: DiskMount[];
  };
  database: {
    connections: number;
    maxConnections: number;
    queriesPerSec: number;
    slowQueries: number;
  };
  network: {
    rxSec: number;
    txSec: number;
    rxTotal: number;
    txTotal: number;
    connections: number;
    errors: number;
  };
}

// 状态变量
const loading = ref<boolean>(false);
const loadChart = ref<HTMLDivElement | null>(null);
const responseTimeChart = ref<HTMLDivElement | null>(null);
const apiRequestsChart = ref<HTMLDivElement | null>(null);
let charts: echarts.ECharts[] = [];
let refreshTimer: number | null = null;

// 指标数据
const metrics = reactive<SystemMetrics>({
  cpu: {
    usage: 42.5,
    cores: [
      { id: 1, model: "Intel Core i7", speed: 3.6, usage: 45.2 },
      { id: 2, model: "Intel Core i7", speed: 3.6, usage: 38.7 },
      { id: 3, model: "Intel Core i7", speed: 3.6, usage: 52.1 },
      { id: 4, model: "Intel Core i7", speed: 3.6, usage: 34.0 }
    ]
  },
  memory: {
    total: 16e9, // 16GB
    used: 6.8e9, // 6.8GB
    free: 9.2e9, // 9.2GB
    usagePercent: 42.5,
    swapTotal: 8e9, // 8GB
    swapUsed: 0.5e9 // 0.5GB
  },
  disk: {
    total: 500e9, // 500GB
    used: 220e9, // 220GB
    free: 280e9, // 280GB
    usagePercent: 44,
    mounts: [
      { key: "1", mount: "/", filesystem: "ext4", total: 500e9, used: 220e9, free: 280e9, usagePercent: 44 },
      { key: "2", mount: "/data", filesystem: "ext4", total: 1e12, used: 250e9, free: 750e9, usagePercent: 25 }
    ]
  },
  database: {
    connections: 24,
    maxConnections: 100,
    queriesPerSec: 45,
    slowQueries: 2
  },
  network: {
    rxSec: 2.5e6, // 2.5 MB/s
    txSec: 1.2e6, // 1.2 MB/s
    rxTotal: 1.5e12, // 1.5 TB
    txTotal: 0.8e12, // 0.8 TB
    connections: 145,
    errors: 12
  }
});

// 表格列定义
const cpuColumns = [
  { title: '核心ID', dataIndex: 'id', key: 'id' },
  { title: '型号', dataIndex: 'model', key: 'model' },
  { title: '频率 (GHz)', dataIndex: 'speed', key: 'speed' },
  { title: '使用率', dataIndex: 'usage', key: 'usage' }
];

const diskColumns = [
  { title: '挂载点', dataIndex: 'mount', key: 'mount' },
  { title: '文件系统', dataIndex: 'filesystem', key: 'filesystem' },
  { title: '总大小', dataIndex: 'total', key: 'total', render: (val: number) => formatBytes(val) },
  { title: '已使用', dataIndex: 'used', key: 'used', render: (val: number) => formatBytes(val) },
  { title: '可用', dataIndex: 'free', key: 'free', render: (val: number) => formatBytes(val) },
  { title: '使用率', dataIndex: 'usagePercent', key: 'usage' }
];

// 加载系统指标数据
const loadMetrics = async () => {
  loading.value = true;
  
  try {
    // 这里应该是实际的API调用，目前使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 在实际应用中，这里应该从API获取数据并更新metrics对象
    // 这里只是模拟数据变化
    metrics.cpu.usage = Math.floor(Math.random() * 30) + 30;
    metrics.memory.usagePercent = Math.floor(Math.random() * 20) + 35;
    metrics.disk.usagePercent = Math.floor(Math.random() * 15) + 40;
    metrics.database.connections = Math.floor(Math.random() * 30) + 20;
    
    // 更新图表
    initCharts();
    
  } catch (error) {
    console.error('加载系统指标失败:', error);
    message.error('加载系统指标失败');
  } finally {
    loading.value = false;
  }
};

// 初始化图表
const initCharts = () => {
  // 销毁已有图表
  disposeCharts();
  
  // 系统负载图表
  if (loadChart.value) {
    const chart = echarts.init(loadChart.value);
    charts.push(chart);
    
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const loadData = Array.from({ length: 24 }, () => (Math.random() * 2 + 1).toFixed(2));
    
    chart.setOption({
      title: {
        text: '系统负载'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: hours
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: loadData,
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 2,
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
              { offset: 0, color: 'rgba(24,144,255,0.5)' },
              { offset: 1, color: 'rgba(24,144,255,0.1)' }
            ]
          }
        }
      }]
    });
  }
  
  // 响应时间图表
  if (responseTimeChart.value) {
    const chart = echarts.init(responseTimeChart.value);
    charts.push(chart);
    
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const responseTimeData = Array.from({ length: 24 }, () => (Math.random() * 100 + 50).toFixed(0));
    
    chart.setOption({
      title: {
        text: 'API响应时间 (ms)'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: hours
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: responseTimeData,
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#52c41a'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82,196,26,0.5)' },
              { offset: 1, color: 'rgba(82,196,26,0.1)' }
            ]
          }
        }
      }]
    });
  }
  
  // API请求统计图表
  if (apiRequestsChart.value) {
    const chart = echarts.init(apiRequestsChart.value);
    charts.push(chart);
    
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const apiEndpoints = ['用户API', '记录API', 'PIR查询', '认证API', '系统API'];
    
    const series = apiEndpoints.map(endpoint => {
      return {
        name: endpoint,
        type: 'bar',
        stack: 'total',
        data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
      };
    });
    
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: apiEndpoints
      },
      xAxis: {
        type: 'category',
        data: hours
      },
      yAxis: {
        type: 'value'
      },
      series: series
    });
  }
};

// 销毁图表
const disposeCharts = () => {
  charts.forEach(chart => {
    chart.dispose();
  });
  charts = [];
};

// 格式化字节数
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取CPU颜色
const getCpuColor = (usage: number) => {
  if (usage < 60) return '#52c41a';
  if (usage < 80) return '#faad14';
  return '#f5222d';
};

// 获取CPU状态
const getCpuStatus = (usage: number) => {
  if (usage < 60) return 'normal';
  if (usage < 80) return 'active';
  return 'exception';
};

// 获取内存颜色
const getMemoryColor = (usage: number) => {
  if (usage < 70) return '#52c41a';
  if (usage < 85) return '#faad14';
  return '#f5222d';
};

// 获取内存状态
const getMemoryStatus = (usage: number) => {
  if (usage < 70) return 'normal';
  if (usage < 85) return 'active';
  return 'exception';
};

// 获取磁盘颜色
const getDiskColor = (usage: number) => {
  if (usage < 75) return '#52c41a';
  if (usage < 90) return '#faad14';
  return '#f5222d';
};

// 获取磁盘状态
const getDiskStatus = (usage: number) => {
  if (usage < 75) return 'normal';
  if (usage < 90) return 'active';
  return 'exception';
};

// 获取数据库颜色
const getDbColor = (connections: number, maxConnections: number) => {
  const usage = (connections / maxConnections) * 100;
  if (usage < 60) return '#52c41a';
  if (usage < 80) return '#faad14';
  return '#f5222d';
};

// 获取数据库状态
const getDbStatus = (connections: number, maxConnections: number) => {
  const usage = (connections / maxConnections) * 100;
  if (usage < 60) return 'normal';
  if (usage < 80) return 'active';
  return 'exception';
};

// 处理窗口大小变化
const handleResize = () => {
  charts.forEach(chart => {
    chart.resize();
  });
};

// 组件挂载时初始化
onMounted(() => {
  loadMetrics();
  
  // 设置定期刷新
  refreshTimer = window.setInterval(loadMetrics, 60000);
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理
onUnmounted(() => {
  disposeCharts();
  
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
  }
  
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.system-metrics-container {
  padding: 0 24px 24px;
}

.chart-card {
  margin-top: 16px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.sub-stat {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 5px;
}
</style> 