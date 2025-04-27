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
                    {{ PIR_TYPE_MAP[metrics?.protocol?.protocol_type as keyof typeof PIR_TYPE_MAP] }}
                  </a-tag>
                </template>
                <a-row :gutter="16">
                  <a-col :xs="24" :sm="12" :md="8" v-for="(value, key) in metrics?.metrics" :key="key">
                    <a-statistic 
                      :title="formatMetricName(key)"
                      :value="formatMetricValue(key, value)"
                      :precision="getPrecision(key)"
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
                  <a-descriptions-item label="协议类型">{{ PIR_TYPE_MAP[metrics?.protocol?.protocol_type as keyof typeof PIR_TYPE_MAP] }}</a-descriptions-item>
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
import { ref, onMounted, nextTick, defineProps, defineEmits, watch, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getPerformanceMetrics } from '@/api/researcher';
import { PIRProtocolType, PIRPerformanceMetric } from '@/types/researcher';
import type { PerformanceMetricsResponse } from '@/types/researcher';
import * as echarts from 'echarts/core';
import { PIR_TYPE_MAP } from '@/constants/researcher';
import { 
  BarChart, 
  type BarSeriesOption,
  GaugeChart,
  type GaugeSeriesOption,
  PieChart,
  type PieSeriesOption
} from 'echarts/charts';
import {
  TooltipComponent,
  type TooltipComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  type TitleComponentOption,
  GridComponent,
  type GridComponentOption
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  BarChart,
  GaugeChart,
  PieChart,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GridComponent,
  LabelLayout,
  CanvasRenderer
]);

// 定义类型
type ECOption = echarts.ComposeOption<
  BarSeriesOption | 
  GaugeSeriesOption |
  PieSeriesOption |
  TooltipComponentOption | 
  LegendComponentOption |
  GridComponentOption |
  TitleComponentOption
>;

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

// 创建chart实例的映射
const charts = ref<{[key: string]: echarts.ECharts | null}>({
  queryTime: null,
  communication: null,
  comparison: null,
  privacy: null
});

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
    console.log(response)
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
  if (!metrics.value) return;
  
  nextTick(() => {
    // 渲染查询时间图表
    if (queryTimeChart.value && !charts.value.queryTime && metrics.value) {
      charts.value.queryTime = echarts.init(queryTimeChart.value);
      
      const queryTime = metrics.value.metrics.query_time || 0;
      
      const queryTimeOption: ECOption = {
        title: {
          text: '查询时间 (秒)',
          left: 'center'
        },
        tooltip: {
          formatter: '{b}: {c} 秒'
        },
        series: [
          {
            type: 'gauge',
            min: 0,
            max: Math.max(queryTime * 2, 0.1),
            progress: {
              show: true,
              roundCap: true,
              width: 18
            },
            axisLine: {
              lineStyle: {
                width: 18
              }
            },
            axisTick: {
              show: false
            },
            splitLine: {
              length: 15,
              lineStyle: {
                width: 2,
                color: '#999'
              }
            },
            axisLabel: {
              distance: 25,
              color: '#999',
              fontSize: 12
            },
            anchor: {
              show: true,
              showAbove: true,
              size: 25,
              itemStyle: {
                borderWidth: 10
              }
            },
            title: {
              show: false
            },
            detail: {
              valueAnimation: true,
              formatter: '{value} 秒',
              fontSize: 16,
              offsetCenter: [0, '70%']
            },
            data: [
              {
                value: queryTime,
                name: '查询时间'
              }
            ]
          }
        ]
      };
      
      charts.value.queryTime.setOption(queryTimeOption);
    }
    
    // 渲染通信成本图表
    if (communicationChart.value && !charts.value.communication && metrics.value) {
      charts.value.communication = echarts.init(communicationChart.value);
      
      const commCost = metrics.value.metrics.comm_cost || 0;
      
      const commCostOption: ECOption = {
        title: {
          text: '通信成本 (KB)',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            name: '通信成本',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: commCost, name: '数据传输' },
              { 
                value: commCost > 10 ? 10 : commCost * 0.5, 
                name: '其他成本'
              }
            ]
          }
        ]
      };
      
      charts.value.communication.setOption(commCostOption);
    }
    
    // 渲染负载对比图表
    if (comparisonChart.value && !charts.value.comparison && metrics.value) {
      charts.value.comparison = echarts.init(comparisonChart.value);
      
      const serverLoad = (metrics.value.metrics.server_load || 0) * 100;
      const clientLoad = (metrics.value.metrics.client_load || 0) * 100;
      
      const comparisonOption: ECOption = {
        title: {
          text: '负载对比',
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
          type: 'value',
          max: Math.max(serverLoad, clientLoad) * 1.2,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: ['客户端', '服务端']
        },
        series: [
          {
            name: '负载百分比',
            type: 'bar',
            data: [clientLoad, serverLoad],
            itemStyle: {
              color: function(params: any) {
                const colorList = ['#5470c6', '#91cc75'];
                return colorList[params.dataIndex];
              }
            },
            label: {
              show: true,
              position: 'right',
              formatter: '{c}%'
            }
          }
        ]
      };
      
      charts.value.comparison.setOption(comparisonOption);
    }
    
    // 渲染隐私保护等级图表
    if (privacyChart.value && !charts.value.privacy && metrics.value) {
      charts.value.privacy = echarts.init(privacyChart.value);
      
      const privacyLevel = metrics.value.metrics.privacy_level || 0;
      
      const privacyOption: ECOption = {
        title: {
          text: '隐私保护级别',
          left: 'center'
        },
        tooltip: {
          formatter: '{b}: {c}级'
        },
        series: [
          {
            type: 'gauge',
            min: 0,
            max: 10,
            progress: {
              show: true,
              roundCap: true,
              width: 18
            },
            axisLine: {
              lineStyle: {
                width: 18,
                color: [
                  [0.2, '#ff4500'],
                  [0.4, '#ffa500'],
                  [0.6, '#ffff00'],
                  [0.8, '#9acd32'],
                  [1, '#008000']
                ]
              }
            },
            axisTick: {
              show: false
            },
            splitLine: {
              length: 15,
              lineStyle: {
                width: 2,
                color: '#999'
              }
            },
            axisLabel: {
              distance: 25,
              color: '#999',
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '{value} 级',
              fontSize: 16,
              offsetCenter: [0, '70%']
            },
            data: [
              {
                value: privacyLevel,
                name: '隐私等级'
              }
            ]
          }
        ]
      };
      
      charts.value.privacy.setOption(privacyOption);
    }
  });
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
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '隐私保护级别',
    [PIRPerformanceMetric.TOTAL_QUERY_TIME]: '总查询时间',
    [PIRPerformanceMetric.START_TIME]: '开始时间',
    [PIRPerformanceMetric.END_TIME]: '结束时间'
  };
  return nameMap[metricName] || metricName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// 格式化指标值
const formatMetricValue = (metricName: string, value: any) => {
  if (metricName === PIRPerformanceMetric.QUERY_TIME) {
    // 将小值显示为微秒
    const seconds = parseFloat(String(value));
    if (seconds < 0.001) {
      return (seconds * 1000000).toFixed(2); // 转换为微秒
    }
    return seconds.toFixed(5);
  }
  if (metricName === PIRPerformanceMetric.SERVER_LOAD || metricName === PIRPerformanceMetric.CLIENT_LOAD) {
    // 对于非常小的值，调整显示格式
    const load = parseFloat(String(value));
    if (load < 0.0001) {
      return (load * 1000000).toFixed(2) + 'μ'; // 微单位
    }
    return (load * 100).toFixed(2);
  }
  if (metricName === PIRPerformanceMetric.TOTAL_QUERY_TIME) {
    const seconds = parseFloat(String(value));
    return (seconds * 1000).toFixed(3); // 转换为毫秒，保留3位小数
  }
  if (metricName === PIRPerformanceMetric.ACCURACY) {
    return (parseFloat(String(value)) * 100).toFixed(1); // 转为百分比
  }
  if(metricName === PIRPerformanceMetric.START_TIME || metricName === PIRPerformanceMetric.END_TIME){
    return formatDateTime(value);
  }
  return value;
};

// 获取指标精度
const getPrecision = (metricName: string) => {
  if (metricName === PIRPerformanceMetric.QUERY_TIME || metricName === PIRPerformanceMetric.ACCURACY) {
    return 3;
  }
  if (metricName === PIRPerformanceMetric.TOTAL_QUERY_TIME) {
    return 5; // 总查询时间保留5位小数
  }
  return 0;
};

// 获取指标单位
const getMetricUnit = (metricName: string) => {
  const unitMap: Record<string, string | ((value: any) => string)> = {
    [PIRPerformanceMetric.QUERY_TIME]: (value) => {
      const seconds = parseFloat(String(value));
      return seconds < 0.001 ? 'μs' : 's';
    },
    [PIRPerformanceMetric.ACCURACY]: '%',
    [PIRPerformanceMetric.COMM_COST]: 'KB',
    [PIRPerformanceMetric.SERVER_LOAD]: (value) => {
      const load = parseFloat(String(value));
      return load < 0.0001 ? '' : '%';
    },
    [PIRPerformanceMetric.CLIENT_LOAD]: (value) => {
      const load = parseFloat(String(value));
      return load < 0.0001 ? '' : '%';
    },
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '级',
    [PIRPerformanceMetric.TOTAL_QUERY_TIME]: 'ms'
  };
  
  const unit = unitMap[metricName];
  // 处理动态单位
  if (typeof unit === 'function') {
    return unit(metrics.value?.metrics[metricName]);
  }
  return unit || '';
};

// 在组件挂载时，如果模态框可见，则获取性能指标
onMounted(() => {
  if (modalVisible.value) {
    fetchMetrics();
  }
});

// 在组件卸载前清理chart实例
onBeforeUnmount(() => {
  Object.values(charts.value).forEach(chart => {
    if (chart) {
      chart.dispose();
    }
  });
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
  display: none; /* 隐藏placeholder，使用echarts代替 */
}

.chart-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}
</style> 