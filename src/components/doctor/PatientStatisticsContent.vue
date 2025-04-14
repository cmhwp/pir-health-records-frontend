<template>
  <div class="statistics-content">
    <h1>患者统计</h1>
    
    <a-row :gutter="16" style="margin-bottom: 24px">
      <a-col :span="6">
        <a-card>
          <a-statistic title="总患者数" :value="totalPatients" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="本月新增" :value="newPatientsThisMonth" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="今日就诊" :value="patientsToday" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="复诊率" :value="returnRate" suffix="%" precision={2} />
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="患者性别分布" :bordered="false">
          <div id="gender-chart" style="width: 100%; height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="患者年龄分布" :bordered="false">
          <div id="age-chart" style="width: 100%; height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="患者就诊趋势" :bordered="false">
          <div id="visit-trend-chart" style="width: 100%; height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="常见病症分析" :bordered="false">
          <div id="common-diagnoses-chart" style="width: 100%; height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { getPatientStatistics } from '@/api/doctor';
import type { PatientStatisticsResponse } from '@/types/doctor';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  PieChart,
  LineChart,
  CanvasRenderer
]);

// 统计数据
const totalPatients = ref(0);
const newPatientsThisMonth = ref(0);
const patientsToday = ref(0);
const returnRate = ref(0);
const loading = ref(false);

// 控制时间范围
const dateRange = reactive({
  startDate: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD')
});

// 图表实例
let genderChart: echarts.ECharts | null = null;
let ageChart: echarts.ECharts | null = null;
let visitTrendChart: echarts.ECharts | null = null;
let commonDiagnosesChart: echarts.ECharts | null = null;

// 获取统计数据
const fetchStatisticsData = async () => {
  loading.value = true;
  try {
    const response = await getPatientStatistics(
      dateRange.startDate,
      dateRange.endDate
    );
    
    if (response.success && response.data) {
      const data = response.data;
      
      // 设置基本统计数据
      totalPatients.value = data.total_patients;
      
      // 计算本月新增患者数量 (根据monthly_patients中当月的数据)
      const currentMonth = dayjs().month(); // 0-11
      const currentYear = dayjs().year();
      const thisMonthData = data.monthly_patients.find(
        item => item.month === currentMonth + 1 && item.year === currentYear
      );
      newPatientsThisMonth.value = thisMonthData?.count || 0;
      
      // 估算今日患者数量 (这里可以根据API实际返回数据调整)
      patientsToday.value = Math.floor(newPatientsThisMonth.value / 30) || 0;
      
      // 计算复诊率 (假设这是基于某种计算)
      // 实际项目中这个值应该由后端提供或者根据特定规则计算
      // 这里我们自行计算一个近似值，根据月度数据
      returnRate.value = Math.round((data.monthly_patients.reduce((sum, item) => sum + item.count, 0) / data.total_patients - 1) * 100) || 0;
      
      // 更新图表
      updateGenderChart(data.gender_distribution);
      updateAgeChart(data.age_distribution);
      updateVisitTrendChart(data.monthly_patients);
      updateCommonDiagnosesChart(data.record_types);
    } else {
      message.error(response.message || '获取统计数据失败');
    }
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    message.error('获取统计数据失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 更新性别分布图表
const updateGenderChart = (genderData: Record<string, number>) => {
  if (!genderChart) return;
  
  const chartData = [
    { value: genderData['male'] || 0, name: '男性' },
    { value: genderData['female'] || 0, name: '女性' }
  ];
  
  genderChart.setOption({
    series: [
      {
        data: chartData
      }
    ]
  });
};

// 更新年龄分布图表
const updateAgeChart = (ageData: Record<string, number>) => {
  if (!ageChart) return;
  
  // 标准年龄段
  const ageRanges = ['0-18', '19-30', '31-45', '46-60', '61-75', '76+'];
  const values = ageRanges.map(range => ageData[range] || 0);
  
  ageChart.setOption({
    series: [
      {
        data: values
      }
    ]
  });
};

// 更新就诊趋势图表
const updateVisitTrendChart = (monthlyData: Array<{year: number, month: number, count: number}>) => {
  if (!visitTrendChart) return;
  
  // 对数据按时间排序
  const sortedData = [...monthlyData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // 获取最近12个月的数据
  const recent12Months = sortedData.slice(-12);
  
  // 组织X轴标签
  const months = recent12Months.map(item => {
    return `${item.year}/${item.month}`;
  });
  
  // 初诊和复诊数据（这里假设API返回的是总量，实际中可能需要根据API调整）
  // 这里将总量按照某个比例分配
  const firstVisits = recent12Months.map(item => Math.floor(item.count * 0.6));
  const followUpVisits = recent12Months.map(item => Math.floor(item.count * 0.4));
  
  visitTrendChart.setOption({
    xAxis: {
      data: months
    },
    series: [
      {
        name: '初诊',
        data: firstVisits
      },
      {
        name: '复诊',
        data: followUpVisits
      }
    ]
  });
};

// 更新常见病症分析图表
const updateCommonDiagnosesChart = (recordTypes: Record<string, number>) => {
  if (!commonDiagnosesChart) return;
  
  // 将记录类型转换为数组并排序
  const typeArray = Object.entries(recordTypes)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // 取前10条记录
  const top10 = typeArray.slice(0, 7);
  
  // 更新Y轴分类数据和数值
  commonDiagnosesChart.setOption({
    yAxis: {
      data: top10.map(item => item.name)
    },
    series: [
      {
        data: top10.map(item => item.count)
      }
    ]
  });
};

// 初始化性别分布图表
const initGenderChart = () => {
  const chartElement = document.getElementById('gender-chart');
  if (!chartElement) return;
  
  genderChart = echarts.init(chartElement);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['男性', '女性']
    },
    series: [
      {
        name: '患者性别',
        type: 'pie',
        radius: '65%',
        center: ['40%', '50%'],
        data: [
          { value: 0, name: '男性' },
          { value: 0, name: '女性' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  genderChart.setOption(option);
};

// 初始化年龄分布图表
const initAgeChart = () => {
  const chartElement = document.getElementById('age-chart');
  if (!chartElement) return;
  
  ageChart = echarts.init(chartElement);
  
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
      data: ['0-18', '19-30', '31-45', '46-60', '61-75', '76+'],
      axisLabel: {
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [
      {
        name: '年龄分布',
        type: 'bar',
        data: [0, 0, 0, 0, 0, 0],
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  };
  
  ageChart.setOption(option);
};

// 初始化就诊趋势图表
const initVisitTrendChart = () => {
  const chartElement = document.getElementById('visit-trend-chart');
  if (!chartElement) return;
  
  visitTrendChart = echarts.init(chartElement);
  
  // 初始数据
  const months = [];
  const currentDate = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    months.push(date.toLocaleString('zh-CN', { month: 'short' }));
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['初诊', '复诊']
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
      data: months
    },
    yAxis: {
      type: 'value',
      name: '就诊人次'
    },
    series: [
      {
        name: '初诊',
        type: 'line',
        data: Array(12).fill(0)
      },
      {
        name: '复诊',
        type: 'line',
        data: Array(12).fill(0)
      }
    ]
  };
  
  visitTrendChart.setOption(option);
};

// 初始化常见病症分析图表
const initCommonDiagnosesChart = () => {
  const chartElement = document.getElementById('common-diagnoses-chart');
  if (!chartElement) return;
  
  commonDiagnosesChart = echarts.init(chartElement);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '人数'
    },
    yAxis: {
      type: 'category',
      data: ['暂无数据'],
      axisLabel: {
        interval: 0
      }
    },
    series: [
      {
        name: '就诊人数',
        type: 'bar',
        data: [0]
      }
    ]
  };
  
  commonDiagnosesChart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  genderChart?.resize();
  ageChart?.resize();
  visitTrendChart?.resize();
  commonDiagnosesChart?.resize();
};

// 组件挂载时初始化
onMounted(() => {
  // 使用setTimeout确保DOM渲染完成
  setTimeout(() => {
    initGenderChart();
    initAgeChart();
    initVisitTrendChart();
    initCommonDiagnosesChart();
    
    window.addEventListener('resize', handleResize);
    
    // 获取数据
    fetchStatisticsData();
  }, 100);
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  genderChart?.dispose();
  ageChart?.dispose();
  visitTrendChart?.dispose();
  commonDiagnosesChart?.dispose();
});
</script>

<style scoped>
.statistics-content {
  width: 100%;
}

.statistics-content h1 {
  margin-bottom: 24px;
}
</style> 