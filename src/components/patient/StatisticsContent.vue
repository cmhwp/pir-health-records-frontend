<template>
  <div class="statistics-container">
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="健康记录概览" :loading="loading">
          <a-row :gutter="16">
            <a-col :span="6" v-for="(stat, index) in overviewStats" :key="index">
              <a-statistic
                :title="stat.title"
                :value="stat.value"
                :precision="stat.precision || 0"
                style="margin-bottom: 16px"
                :value-style="{ color: stat.color }"
              >
                <template #prefix>
                  <component :is="stat.icon" />
                </template>
              </a-statistic>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="记录类型分布" :loading="loading">
          <div ref="recordTypeChart" style="height: 400px"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="月度记录趋势" :loading="loading">
          <div ref="monthlyRecordsChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="生命体征统计" :loading="loading">
          <a-tabs v-model:activeKey="activeVitalSign">
            <a-tab-pane v-for="(data, type) in vitalSigns" :key="type" :tab="getVitalSignName(type)">
              <div :ref="el => vitalSignCharts[type] = el" style="height: 350px"></div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="常用药物统计" :loading="loading">
          <div ref="medicationChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, nextTick, reactive } from 'vue';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { getHealthStatistics } from '@/api/health';
import type { HealthStatisticsResponse } from '@/types/health';
import {
  FileOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  HeartOutlined
} from '@ant-design/icons-vue';

// 注册 ECharts 组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  PieChart,
  BarChart,
  LineChart,
  LabelLayout,
  CanvasRenderer
]);

// 数据加载状态
const loading = ref(true);

// 统计数据
const statistics = ref<HealthStatisticsResponse | null>(null);
const totalRecords = ref(0);
const activeVitalSign = ref('');
const vitalSigns = ref<Record<string, { values: number[]; dates: string[]; unit: string }>>({});
const vitalSignCharts = reactive<Record<string, any>>({});

// 记录类型映射
const recordTypeMap: Record<string, string> = {
  general: '常规检查',
  laboratory: '实验室检查',
  medication: '用药记录',
  imaging: '影像检查',
  vital_signs: '生命体征',
  surgery: '手术记录',
  vaccination: '疫苗接种',
  allergy: '过敏记录',
  diagnosis: '诊断结果',
  other: '其他记录'
};

// 生命体征名称映射
const vitalSignMap: Record<string, string> = {
  heart_rate: '心率',
  blood_pressure: '血压',
  blood_oxygen: '血氧',
  temperature: '体温',
  blood_glucose: '血糖',
  respiratory_rate: '呼吸率',
  weight: '体重'
};

// 获取生命体征名称
const getVitalSignName = (type: string): string => {
  return vitalSignMap[type] || type;
};

// 计算概览统计数据
const overviewStats = computed(() => {
  if (!statistics.value) return [];

  const recordTypes = statistics.value.record_types;
  const monthlyRecords = statistics.value.monthly_records;
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const currentMonthRecords = monthlyRecords[currentMonth.toString()] || 0;
  const lastMonthRecords = monthlyRecords[lastMonth.toString()] || 0;
  
  // 计算月度增长率
  let growthRate = 0;
  if (lastMonthRecords > 0) {
    growthRate = (currentMonthRecords - lastMonthRecords) / lastMonthRecords * 100;
  }
  
  return [
    {
      title: '健康记录总数',
      value: totalRecords.value,
      icon: FileOutlined,
      color: '#1890ff'
    },
    {
      title: '本月新增记录',
      value: currentMonthRecords,
      icon: CalendarOutlined,
      color: '#52c41a'
    },
    {
      title: '月度增长率',
      value: growthRate,
      precision: 2,
      suffix: '%',
      icon: HeartOutlined,
      color: growthRate >= 0 ? '#52c41a' : '#f5222d'
    },
    {
      title: '用药记录数',
      value: recordTypes['medication'] || 0,
      icon: MedicineBoxOutlined,
      color: '#722ed1'
    }
  ];
});

// 获取健康统计数据
const fetchStatistics = async () => {
  loading.value = true;
  try {
    const response = await getHealthStatistics();
    if (response.success && response.data) {
      statistics.value = response.data;
      vitalSigns.value = response.data.vital_signs;
      
      // 计算记录总数
      totalRecords.value = Object.values(response.data.record_types)
        .reduce((sum, count) => sum + (count || 0), 0);
      
      // 设置默认选中的生命体征标签
      if (Object.keys(vitalSigns.value).length > 0) {
        activeVitalSign.value = Object.keys(vitalSigns.value)[0];
      }
      
      // 渲染图表
      await nextTick();
      renderCharts();
    }
  } catch (error) {
    console.error('获取健康统计数据失败:', error);
    message.error('获取健康统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 渲染图表
const renderCharts = async () => {
  if (!statistics.value) return;
  
  renderRecordTypeChart();
  renderMonthlyRecordsChart();
  renderVitalSignCharts();
  renderMedicationChart();
};

// 渲染记录类型分布图
const renderRecordTypeChart = () => {
  const chartDom = document.getElementById('recordTypeChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  const recordTypes = statistics.value?.record_types || {};
  
  const data = Object.entries(recordTypes).map(([key, value]) => ({
    name: recordTypeMap[key] || key,
    value: value || 0
  })).filter(item => item.value > 0);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '记录类型',
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };
  
  chart.setOption(option);
};

// 渲染月度记录趋势图
const renderMonthlyRecordsChart = () => {
  const chartDom = document.getElementById('monthlyRecordsChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  const monthlyRecords = statistics.value?.monthly_records || {};
  
  const months = [];
  const data = [];
  
  for (let i = 1; i <= 12; i++) {
    months.push(`${i}月`);
    data.push(monthlyRecords[i.toString()] || 0);
  }
  
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
    xAxis: [
      {
        type: 'category',
        data: months,
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '记录数量',
        type: 'bar',
        barWidth: '60%',
        data: data
      }
    ]
  };
  
  chart.setOption(option);
};

// 渲染生命体征图表
const renderVitalSignCharts = () => {
  if (!statistics.value) return;
  
  for (const [type, data] of Object.entries(vitalSigns.value)) {
    // 创建图表实例
    const chartDom = vitalSignCharts[type];
    if (!chartDom) continue;
    
    const chart = echarts.init(chartDom);
    const dates = data.dates.map(date => new Date(date).toLocaleDateString());
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: `{value} ${data.unit}`
        }
      },
      series: [
        {
          name: getVitalSignName(type),
          type: 'line',
          data: data.values,
          markLine: {
            data: [
              { type: 'average', name: '平均值' }
            ]
          }
        }
      ]
    };
    
    chart.setOption(option);
  }
};

// 渲染用药统计图
const renderMedicationChart = () => {
  const chartDom = document.getElementById('medicationChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  const medications = statistics.value?.medications || {};
  
  const data = Object.entries(medications)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // 取前10个
  
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
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: {
        width: 120,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: '使用次数',
        type: 'bar',
        data: data.map(item => item.value)
      }
    ]
  };
  
  chart.setOption(option);
};

// 初始化
onMounted(async () => {
  await fetchStatistics();
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', function() {
    const chartElements = [
      document.getElementById('recordTypeChart'),
      document.getElementById('monthlyRecordsChart'),
      document.getElementById('medicationChart'),
      ...Object.values(vitalSignCharts).filter(Boolean)
    ];
    
    chartElements.forEach(element => {
      if (element) {
        const chart = echarts.getInstanceByDom(element);
        if (chart) {
          chart.resize();
        }
      }
    });
  });
});
</script>

<style scoped>
.statistics-container {
  width: 100%;
}
</style> 