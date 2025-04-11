<template>
  <div>
    <a-page-header
      title="健康统计"
      sub-title="查看您的健康数据统计和趋势"
    />
    
    <a-card style="margin-top: 16px">
      <template #title>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>时间范围</span>
          <a-radio-group v-model:value="timeRange" @change="handleTimeRangeChange">
            <a-radio-button value="week">近一周</a-radio-button>
            <a-radio-button value="month">近一月</a-radio-button>
            <a-radio-button value="quarter">近三月</a-radio-button>
            <a-radio-button value="year">近一年</a-radio-button>
            <a-radio-button value="custom">自定义</a-radio-button>
          </a-radio-group>
        </div>
      </template>
      
      <a-row v-if="timeRange === 'custom'" style="margin-bottom: 16px">
        <a-col :span="24">
          <a-range-picker 
            v-model:value="customDateRange" 
            style="width: 100%" 
            @change="handleCustomDateChange" 
          />
        </a-col>
      </a-row>
      
      <a-spin :spinning="loading">
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="general" tab="基础指标">
            <a-row :gutter="16">
              <a-col :xs="24" :md="12">
                <a-card title="体重变化趋势 (kg)">
                  <div ref="weightChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-card title="血压变化趋势 (mmHg)">
                  <div ref="bpChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
            </a-row>
            
            <a-row :gutter="16" style="margin-top: 16px">
              <a-col :xs="24" :md="12">
                <a-card title="心率变化趋势 (bpm)">
                  <div ref="heartRateChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-card title="BMI 指数变化">
                  <div ref="bmiChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
            </a-row>
          </a-tab-pane>
          
          <a-tab-pane key="blood" tab="血液指标">
            <a-row :gutter="16">
              <a-col :xs="24" :md="12">
                <a-card title="血糖变化趋势 (mmol/L)">
                  <div ref="glucoseChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-card title="血红蛋白变化趋势 (g/L)">
                  <div ref="hemoglobinChartRef" style="height: 300px"></div>
                </a-card>
              </a-col>
            </a-row>
          </a-tab-pane>
          
          <a-tab-pane key="summary" tab="健康总结">
            <a-card>
              <a-descriptions title="最新健康指标" bordered>
                <a-descriptions-item label="身高">{{ latestMetrics.height || '--' }} cm</a-descriptions-item>
                <a-descriptions-item label="体重">{{ latestMetrics.weight || '--' }} kg</a-descriptions-item>
                <a-descriptions-item label="BMI">{{ latestMetrics.bmi || '--' }}</a-descriptions-item>
                <a-descriptions-item label="血压">{{ latestMetrics.bloodPressure || '--' }}</a-descriptions-item>
                <a-descriptions-item label="心率">{{ latestMetrics.heartRate || '--' }} bpm</a-descriptions-item>
                <a-descriptions-item label="血糖">{{ latestMetrics.glucose || '--' }} mmol/L</a-descriptions-item>
              </a-descriptions>
              
              <a-divider />
              
              <h3>健康风险评估</h3>
              <a-alert
                v-for="(risk, index) in healthRisks"
                :key="index"
                :message="risk.title"
                :description="risk.description"
                :type="risk.level"
                showIcon
                style="margin-bottom: 8px"
              />
              
              <div v-if="healthRisks.length === 0">
                <a-alert
                  message="健康状况良好"
                  description="根据您的健康记录，目前没有发现明显的健康风险。"
                  type="success"
                  showIcon
                />
              </div>
              
              <a-divider />
              
              <h3>健康建议</h3>
              <a-timeline>
                <a-timeline-item v-for="(advice, index) in healthAdvice" :key="index">
                  {{ advice }}
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, nextTick, watch, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { getHealthStatistics } from '@/api/health-records';

// 注册 ECharts 组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  LineChart,
  CanvasRenderer
]);

// 状态变量
const loading = ref(false);
const timeRange = ref('month');
const customDateRange = ref([]);
const activeTab = ref('general');

// 图表引用
const weightChartRef = ref(null);
const bpChartRef = ref(null);
const heartRateChartRef = ref(null);
const bmiChartRef = ref(null);
const glucoseChartRef = ref(null);
const hemoglobinChartRef = ref(null);

// 图表实例
let weightChart = null;
let bpChart = null;
let heartRateChart = null;
let bmiChart = null;
let glucoseChart = null;
let hemoglobinChart = null;

// 健康数据
const healthData = reactive({
  dates: [],
  weight: [],
  systolic: [],
  diastolic: [],
  heartRate: [],
  bmi: [],
  glucose: [],
  hemoglobin: []
});

// 最新健康指标
const latestMetrics = reactive({
  height: null,
  weight: null,
  bmi: null,
  bloodPressure: null,
  heartRate: null,
  glucose: null
});

// 健康风险
const healthRisks = ref([]);

// 健康建议
const healthAdvice = ref([
  '保持规律作息，每晚保证7-8小时的充分睡眠',
  '每天至少30分钟中等强度的有氧运动，如快走、慢跑或游泳',
  '保持均衡饮食，多摄入蔬菜、水果和全谷物，限制高脂肪、高糖和高盐食物',
  '保持充分水分摄入，每天至少饮用8杯水',
  '定期进行健康检查，及时了解自己的健康状况'
]);

// 处理时间范围变化
const handleTimeRangeChange = () => {
  if (timeRange.value !== 'custom') {
    fetchHealthStatistics();
  }
};

// 处理自定义日期变化
const handleCustomDateChange = () => {
  if (customDateRange.value && customDateRange.value.length === 2) {
    fetchHealthStatistics();
  }
};

// 获取统计数据
const fetchHealthStatistics = async () => {
  loading.value = true;
  try {
    let startDate, endDate;
    
    if (timeRange.value === 'custom' && customDateRange.value && customDateRange.value.length === 2) {
      startDate = dayjs(customDateRange.value[0]).format('YYYY-MM-DD');
      endDate = dayjs(customDateRange.value[1]).format('YYYY-MM-DD');
    } else {
      endDate = dayjs().format('YYYY-MM-DD');
      
      switch (timeRange.value) {
        case 'week':
          startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
          break;
        case 'month':
          startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
          break;
        case 'quarter':
          startDate = dayjs().subtract(3, 'month').format('YYYY-MM-DD');
          break;
        case 'year':
          startDate = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
          break;
        default:
          startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
      }
    }
    
    const response = await getHealthStatistics(startDate, endDate);
    if (response.success && response.data) {
      const { statistics, risks, latest } = response.data;
      
      // 更新图表数据
      healthData.dates = statistics.dates || [];
      healthData.weight = statistics.weight || [];
      healthData.systolic = statistics.systolic || [];
      healthData.diastolic = statistics.diastolic || [];
      healthData.heartRate = statistics.heartRate || [];
      healthData.bmi = statistics.bmi || [];
      healthData.glucose = statistics.glucose || [];
      healthData.hemoglobin = statistics.hemoglobin || [];
      
      // 更新最新健康指标
      latestMetrics.height = latest.height;
      latestMetrics.weight = latest.weight;
      latestMetrics.bmi = latest.bmi;
      latestMetrics.bloodPressure = latest.systolic && latest.diastolic ? 
        `${latest.systolic}/${latest.diastolic}` : '--';
      latestMetrics.heartRate = latest.heartRate;
      latestMetrics.glucose = latest.glucose;
      
      // 更新健康风险
      healthRisks.value = risks || [];
      
      // 更新图表
      nextTick(() => {
        initCharts();
      });
    }
  } catch (error) {
    console.error('获取健康统计数据失败:', error);
    message.error('获取健康统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 初始化图表
const initCharts = () => {
  // 体重图表
  if (weightChartRef.value) {
    weightChart = echarts.init(weightChartRef.value);
    weightChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: '体重 (kg)' },
      series: [{
        name: '体重',
        type: 'line',
        data: healthData.weight,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        }
      }]
    });
  }
  
  // 血压图表
  if (bpChartRef.value) {
    bpChart = echarts.init(bpChartRef.value);
    bpChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收缩压', '舒张压'] },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: '血压 (mmHg)' },
      series: [
        {
          name: '收缩压',
          type: 'line',
          data: healthData.systolic,
          markLine: {
            data: [{ yAxis: 140, name: '高血压线', lineStyle: { color: '#ff4d4f' } }]
          }
        },
        {
          name: '舒张压',
          type: 'line',
          data: healthData.diastolic,
          markLine: {
            data: [{ yAxis: 90, name: '高血压线', lineStyle: { color: '#ff4d4f' } }]
          }
        }
      ]
    });
  }
  
  // 心率图表
  if (heartRateChartRef.value) {
    heartRateChart = echarts.init(heartRateChartRef.value);
    heartRateChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: '心率 (bpm)' },
      series: [{
        name: '心率',
        type: 'line',
        data: healthData.heartRate
      }]
    });
  }
  
  // BMI图表
  if (bmiChartRef.value) {
    bmiChart = echarts.init(bmiChartRef.value);
    bmiChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: 'BMI' },
      series: [{
        name: 'BMI',
        type: 'line',
        data: healthData.bmi,
        markLine: {
          data: [
            { yAxis: 18.5, name: '偏瘦', lineStyle: { color: '#faad14' } },
            { yAxis: 24, name: '正常', lineStyle: { color: '#52c41a' } },
            { yAxis: 28, name: '超重', lineStyle: { color: '#faad14' } },
            { yAxis: 30, name: '肥胖', lineStyle: { color: '#ff4d4f' } }
          ]
        }
      }]
    });
  }
  
  // 血糖图表
  if (glucoseChartRef.value) {
    glucoseChart = echarts.init(glucoseChartRef.value);
    glucoseChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: '血糖 (mmol/L)' },
      series: [{
        name: '血糖',
        type: 'line',
        data: healthData.glucose
      }]
    });
  }
  
  // 血红蛋白图表
  if (hemoglobinChartRef.value) {
    hemoglobinChart = echarts.init(hemoglobinChartRef.value);
    hemoglobinChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: healthData.dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value', name: '血红蛋白 (g/L)' },
      series: [{
        name: '血红蛋白',
        type: 'line',
        data: healthData.hemoglobin
      }]
    });
  }
};

// 监听标签页变化，重绘图表
watch(activeTab, () => {
  nextTick(() => {
    if (activeTab.value === 'general') {
      weightChart?.resize();
      bpChart?.resize();
      heartRateChart?.resize();
      bmiChart?.resize();
    } else if (activeTab.value === 'blood') {
      glucoseChart?.resize();
      hemoglobinChart?.resize();
    }
  });
});

// 处理窗口大小变化
const handleResize = () => {
  weightChart?.resize();
  bpChart?.resize();
  heartRateChart?.resize();
  bmiChart?.resize();
  glucoseChart?.resize();
  hemoglobinChart?.resize();
};

onMounted(() => {
  fetchHealthStatistics();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  weightChart?.dispose();
  bpChart?.dispose();
  heartRateChart?.dispose();
  bmiChart?.dispose();
  glucoseChart?.dispose();
  hemoglobinChart?.dispose();
});
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style> 