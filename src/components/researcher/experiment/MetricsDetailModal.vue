<template>
  <a-modal
    v-model:visible="modalVisible"
    title="性能指标详情"
    :footer="null"
    width="800px"
  >
    <a-spin :spinning="loading">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="overview" tab="性能概览">
          <a-row :gutter="16">
            <a-col :span="24">
              <a-card class="metrics-card">
                <template #title>
                  <span>PIR协议性能指标</span>
                  <a-tag v-if="metrics?.protocol?.protocol_type" :color="getProtocolColor(metrics.protocol.protocol_type)" style="margin-left: 8px;">
                    {{ metrics?.protocol?.protocol_type }}
                  </a-tag>
                </template>
                <a-row :gutter="16">
                  <a-col :xs="24" :sm="12" :md="8" v-for="(value, key) in metrics?.metrics" :key="key">
                    <a-statistic 
                      :title="formatMetricName(key)"
                      :value="formatMetricValue(key, value)"
                      :precision="key === 'query_time' || key === 'accuracy' ? 3 : 0"
                      :suffix="getMetricUnit(key)"
                      style="margin-bottom: 24px;"
                    />
                  </a-col>
                </a-row>
              </a-card>
            </a-col>
          </a-row>
          
          <a-row :gutter="16" style="margin-top: 16px;">
            <a-col :span="24">
              <a-card title="测试信息" class="metrics-card">
                <a-descriptions bordered :column="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }">
                  <a-descriptions-item label="实验ID">{{ metrics?.experiment_id }}</a-descriptions-item>
                  <a-descriptions-item label="测试时间">{{ formatDateTime(metrics?.timestamp) }}</a-descriptions-item>
                  <a-descriptions-item label="协议类型">{{ metrics?.protocol?.protocol_type }}</a-descriptions-item>
                </a-descriptions>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
        
        <a-tab-pane key="charts" tab="性能图表">
          <div ref="chartsContainer" class="charts-container">
            <div ref="queryTimeChart" class="chart-box"></div>
            <div ref="communicationChart" class="chart-box"></div>
            <div ref="comparisonChart" class="chart-box"></div>
            <div ref="privacyChart" class="chart-box"></div>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="details" tab="详细数据">
          <pre class="code-block">{{ JSON.stringify(metrics, null, 2) }}</pre>
        </a-tab-pane>
      </a-tabs>
      
      <template v-if="!metrics && !loading">
        <a-empty description="无法获取性能指标数据" />
      </template>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, defineProps, defineEmits, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getPerformanceMetrics } from '@/api/researcher';
import { PIRProtocolType, PIRPerformanceMetric } from '@/types/researcher';
import type { PerformanceMetricsResponse } from '@/types/researcher';

const props = defineProps<{
  visible: boolean;
  experimentId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

// 状态变量
const loading = ref(false);
const metrics = ref<PerformanceMetricsResponse | null>(null);
const activeTab = ref('overview');
const modalVisible = ref(props.visible);
const chartsContainer = ref<HTMLElement | null>(null);
const queryTimeChart = ref<HTMLElement | null>(null);
const communicationChart = ref<HTMLElement | null>(null);
const comparisonChart = ref<HTMLElement | null>(null);
const privacyChart = ref<HTMLElement | null>(null);

// 监听visible属性变化
watch(
  () => props.visible,
  (newVisible) => {
    modalVisible.value = newVisible;
    if (newVisible) {
      fetchMetrics();
    }
  }
);

// 监听内部可见性变化
watch(
  () => modalVisible.value,
  (newVisible) => {
    emit('update:visible', newVisible);
  }
);

// 监听experimentId变化
watch(
  () => props.experimentId,
  () => {
    if (modalVisible.value) {
      fetchMetrics();
    }
  }
);

// 监听activeTab变化
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'charts' && metrics.value) {
      nextTick(() => {
        renderCharts();
      });
    }
  }
);

// 获取性能指标
const fetchMetrics = async () => {
  loading.value = true;
  try {
    const response = await getPerformanceMetrics(props.experimentId);
    if (response.success) {
      metrics.value = response.data || null;
      
      // 如果当前在图表标签页，则渲染图表
      if (activeTab.value === 'charts') {
        nextTick(() => {
          renderCharts();
        });
      }
    } else {
      message.error(response.message || '获取性能指标失败');
    }
  } catch (error) {
    console.error('获取性能指标出错:', error);
    message.error('获取性能指标出错');
  } finally {
    loading.value = false;
  }
};

// 渲染图表
const renderCharts = () => {
  // 这里可以使用echarts或其他图表库来渲染图表
  // 需要先引入图表库
  // 由于这里使用的是ref引用DOM元素，需要确保元素已经渲染
  console.log('渲染性能图表', queryTimeChart.value, communicationChart.value);
  
  // 这里仅做简单的示例，实际项目中应该引入echarts并实现具体的图表渲染逻辑
  if (queryTimeChart.value) {
    queryTimeChart.value.innerHTML = `
      <div class="chart-title">查询时间</div>
      <div class="chart-placeholder">
        <div class="chart-placeholder-text">查询时间图表</div>
        <div class="chart-value">${metrics.value?.metrics.query_time || 0} 秒</div>
      </div>
    `;
  }
  
  if (communicationChart.value) {
    communicationChart.value.innerHTML = `
      <div class="chart-title">通信成本</div>
      <div class="chart-placeholder">
        <div class="chart-placeholder-text">通信成本图表</div>
        <div class="chart-value">${metrics.value?.metrics.comm_cost || 0} KB</div>
      </div>
    `;
  }
  
  if (comparisonChart.value) {
    comparisonChart.value.innerHTML = `
      <div class="chart-title">负载对比</div>
      <div class="chart-placeholder">
        <div class="chart-placeholder-text">负载对比图表</div>
        <div class="chart-value">服务器: ${metrics.value?.metrics.server_load || 0}% / 客户端: ${metrics.value?.metrics.client_load || 0}%</div>
      </div>
    `;
  }
  
  if (privacyChart.value) {
    privacyChart.value.innerHTML = `
      <div class="chart-title">隐私保护级别</div>
      <div class="chart-placeholder">
        <div class="chart-placeholder-text">隐私保护级别图表</div>
        <div class="chart-value">${metrics.value?.metrics.privacy_level || 0} 级</div>
      </div>
    `;
  }
};

// 格式化日期时间
const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 获取协议类型颜色
const getProtocolColor = (type: PIRProtocolType) => {
  const colorMap: Record<string, string> = {
    [PIRProtocolType.BASIC]: 'cyan',
    [PIRProtocolType.HOMOMORPHIC]: 'green',
    [PIRProtocolType.HYBRID]: 'purple',
    [PIRProtocolType.ONION]: 'orange'
  };
  return colorMap[type] || 'default';
};

// 格式化指标名称
const formatMetricName = (metricName: string) => {
  const nameMap: Record<string, string> = {
    [PIRPerformanceMetric.QUERY_TIME]: '查询时间',
    [PIRPerformanceMetric.ACCURACY]: '准确率',
    [PIRPerformanceMetric.COMM_COST]: '通信成本',
    [PIRPerformanceMetric.SERVER_LOAD]: '服务器负载',
    [PIRPerformanceMetric.CLIENT_LOAD]: '客户端负载',
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '隐私保护级别'
  };
  return nameMap[metricName] || metricName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// 格式化指标值
const formatMetricValue = (metricName: string, value: any) => {
  if (metricName === PIRPerformanceMetric.QUERY_TIME) {
    return parseFloat(String(value)).toFixed(3);
  }
  if (metricName === PIRPerformanceMetric.SERVER_LOAD || metricName === PIRPerformanceMetric.CLIENT_LOAD) {
    return (parseFloat(String(value)) * 100).toFixed(2);
  }
  return value;
};

// 获取指标单位
const getMetricUnit = (metricName: string) => {
  const unitMap: Record<string, string> = {
    [PIRPerformanceMetric.QUERY_TIME]: '秒',
    [PIRPerformanceMetric.ACCURACY]: '',
    [PIRPerformanceMetric.COMM_COST]: 'KB',
    [PIRPerformanceMetric.SERVER_LOAD]: '%',
    [PIRPerformanceMetric.CLIENT_LOAD]: '%',
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '级'
  };
  return unitMap[metricName] || '';
};

// 在组件挂载时，如果模态框可见，则获取性能指标
onMounted(() => {
  if (modalVisible.value) {
    fetchMetrics();
  }
});
</script>

<style scoped>
.metrics-card {
  margin-bottom: 16px;
}

.code-block {
  max-height: 500px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.chart-box {
  height: 250px;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 28px);
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}

.chart-placeholder-text {
  color: #999;
  margin-bottom: 8px;
}

.chart-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}
</style> 