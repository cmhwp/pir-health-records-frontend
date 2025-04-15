<template>
  <div class="statistics-container">
    <!-- 时间范围选择器 -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card>
          <a-radio-group v-model:value="timeRange" button-style="solid" @change="handleTimeRangeChange">
            <a-radio-button value="week">最近一周</a-radio-button>
            <a-radio-button value="month">最近一月</a-radio-button>
            <a-radio-button value="quarter">最近三月</a-radio-button>
            <a-radio-button value="year">最近一年</a-radio-button>
            <a-radio-button value="custom">自定义</a-radio-button>
          </a-radio-group>
          
          <a-range-picker 
            v-if="timeRange === 'custom'" 
            v-model:value="dateRange" 
            @change="handleDateRangeChange"
            style="margin-left: 16px"
          />
        </a-card>
      </a-col>
    </a-row>

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
          <div id="recordTypeChart" style="height: 400px"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="就诊时间分布" :loading="loading">
          <div id="monthlyRecordsChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="生命体征统计" :loading="loading">
          <a-tabs v-model:activeKey="activeVitalSign">
            <a-tab-pane v-for="(data, type) in vitalSigns" :key="type" :tab="getVitalSignName(type)">
              <div :id="`vitalSign-${type}`" style="height: 350px"></div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="常用药物统计" :loading="loading">
          <div id="medicationChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px" v-if="doctorStats.length > 0">
      <a-col :span="24">
        <a-card title="医生互动统计" :loading="loading">
          <div id="doctorStatsChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px" v-if="hasAppointmentData">
      <a-col :span="12">
        <a-card title="预约状态分布" :loading="loading">
          <div id="appointmentStatsChart" style="height: 400px"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="处方状态分布" :loading="loading">
          <div id="prescriptionStatsChart" style="height: 400px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
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
import dayjs from 'dayjs';
import {
  FileOutlined,
  CalendarOutlined,
  HeartOutlined,
  UserOutlined
} from '@ant-design/icons-vue';
import type { Dayjs } from 'dayjs';

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

// 时间范围控制
const timeRange = ref('month');
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

// 统计数据
const statistics = ref<HealthStatisticsResponse | null>(null);
const totalRecords = ref(0);
const activeVitalSign = ref('');
const vitalSigns = ref<Record<string, { values: number[]; dates: string[]; unit: string }>>({});
const doctorStats = ref<Array<{id: number, name: string, count: number}>>([]);
const chartInstances = reactive<Record<string, echarts.ECharts | null>>({});

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

// 预约状态映射
const appointmentStatusMap: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  CANCELLED: '已取消',
  COMPLETED: '已完成'
};

// 处方状态映射
const prescriptionStatusMap: Record<string, string> = {
  ACTIVE: '有效',
  COMPLETED: '已完成',
  EXPIRED: '已过期',
  REVOKED: '已撤销'
};

// 获取生命体征名称
const getVitalSignName = (type: string): string => {
  return vitalSignMap[type] || type;
};

// 计算是否有预约和处方数据
const hasAppointmentData = computed(() => {
  if (!statistics.value) return false;
  
  const hasAppointments = statistics.value.appointment_stats && 
    Object.values(statistics.value.appointment_stats).some(val => val > 0);
    
  const hasPrescriptions = statistics.value.prescription_stats && 
    Object.values(statistics.value.prescription_stats).some(val => val > 0);
    
  return hasAppointments || hasPrescriptions;
});

// 计算概览统计数据
const overviewStats = computed(() => {
  if (!statistics.value) return [];

  const recordTypes = statistics.value.record_types;
  
  // 获取当月和上月记录数
  const currentMonth = dayjs().month() + 1; // 1-12
  const currentYear = dayjs().year();
  
  // 从time_stats中找当月和上月的数据
  const timeStats = statistics.value.time_stats || [];
  const currentMonthData = timeStats.find(item => 
    item.year === currentYear && item.month === currentMonth
  );
  const lastMonthData = timeStats.find(item => {
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return item.year === lastMonthYear && item.month === lastMonth;
  });
  
  const currentMonthRecords = currentMonthData?.count || 0;
  const lastMonthRecords = lastMonthData?.count || 0;
  
  // 计算月度增长率
  let growthRate = 0;
  if (lastMonthRecords > 0) {
    growthRate = (currentMonthRecords - lastMonthRecords) / lastMonthRecords * 100;
  }
  
  return [
    {
      title: '健康记录总数',
      value: statistics.value.total_records || totalRecords.value,
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
      title: '互动医生数',
      value: statistics.value.total_doctors || (statistics.value.doctor_stats?.length || 0),
      icon: UserOutlined,
      color: '#722ed1'
    }
  ];
});

// 处理时间范围变更
const handleTimeRangeChange = () => {
  if (timeRange.value !== 'custom') {
    let startDate = dayjs();
    
    // 设置开始日期
    switch (timeRange.value) {
      case 'week':
        startDate = startDate.subtract(7, 'day');
        break;
      case 'month':
        startDate = startDate.subtract(1, 'month');
        break;
      case 'quarter':
        startDate = startDate.subtract(3, 'month');
        break;
      case 'year':
        startDate = startDate.subtract(1, 'year');
        break;
    }
    
    fetchStatistics(startDate.format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD'));
  }
};

// 处理日期范围变更
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    fetchStatistics(
      dateRange.value[0].format('YYYY-MM-DD'),
      dateRange.value[1].format('YYYY-MM-DD')
    );
  }
};

// 获取健康统计数据
const fetchStatistics = async (startDate?: string, endDate?: string) => {
  loading.value = true;
  try {
    const response = await getHealthStatistics(startDate, endDate);
    if (response.success && response.data) {
      statistics.value = response.data;
      vitalSigns.value = response.data.vital_signs || {};
      doctorStats.value = response.data.doctor_stats || [];
      
      // 计算记录总数
      totalRecords.value = Object.values(response.data.record_types)
        .reduce((sum, count) => sum + (count || 0), 0);
      
      // 设置默认选中的生命体征标签
      if (Object.keys(vitalSigns.value).length > 0) {
        activeVitalSign.value = Object.keys(vitalSigns.value)[0];
      }
      
      // 渲染图表
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
const renderCharts = () => {
  if (!statistics.value) return;
  
  // 创建或获取图表实例
  const getChartInstance = (elementId: string): echarts.ECharts => {
    const chartDom = document.getElementById(elementId);
    if (!chartDom) throw new Error(`Element ${elementId} not found`);
    
    if (!chartInstances[elementId]) {
      chartInstances[elementId] = echarts.init(chartDom);
    }
    
    return chartInstances[elementId]!;
  };
  
  try {
    renderRecordTypeChart(getChartInstance('recordTypeChart'));
    renderTimeStatsChart(getChartInstance('monthlyRecordsChart'));
    renderMedicationChart(getChartInstance('medicationChart'));
    
    // 渲染生命体征图表
    for (const type of Object.keys(vitalSigns.value)) {
      const chartId = `vitalSign-${type}`;
      const dom = document.getElementById(chartId);
      if (dom) {
        const chart = echarts.init(dom);
        chartInstances[chartId] = chart;
        renderVitalSignChart(chart, type);
      }
    }
    
    // 渲染医生互动统计
    if (doctorStats.value.length > 0) {
      renderDoctorStatsChart(getChartInstance('doctorStatsChart'));
    }
    
    // 渲染预约和处方状态
    if (hasAppointmentData.value) {
      const appointmentDom = document.getElementById('appointmentStatsChart');
      const prescriptionDom = document.getElementById('prescriptionStatsChart');
      
      if (appointmentDom && statistics.value.appointment_stats) {
        const chart = echarts.init(appointmentDom);
        chartInstances['appointmentStatsChart'] = chart;
        renderStatusChart(chart, statistics.value.appointment_stats, appointmentStatusMap, '预约');
      }
      
      if (prescriptionDom && statistics.value.prescription_stats) {
        const chart = echarts.init(prescriptionDom);
        chartInstances['prescriptionStatsChart'] = chart;
        renderStatusChart(chart, statistics.value.prescription_stats, prescriptionStatusMap, '处方');
      }
    }
  } catch (error) {
    console.error('渲染图表失败:', error);
  }
};

// 渲染记录类型分布图
const renderRecordTypeChart = (chart: echarts.ECharts) => {
  if (!statistics.value) return;
  
  const recordTypes = statistics.value.record_types || {};
  
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

// 渲染时间分布图
const renderTimeStatsChart = (chart: echarts.ECharts) => {
  if (!statistics.value) return;
  
  const timeStats = statistics.value.time_stats || [];
  
  // 按时间排序
  const sortedStats = [...timeStats].sort((a, b) => {
    if (a.year !== undefined && b.year !== undefined) {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== undefined && b.month !== undefined) {
        return a.month - b.month;
      }
    }
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return 0;
  });
  
  // 获取X轴标签和数据
  const xLabels = sortedStats.map(item => {
    if (item.date) return item.date;
    if (item.year !== undefined && item.month !== undefined) {
      return `${item.year}/${item.month}`;
    }
    return '';
  });
  
  const data = sortedStats.map(item => item.count);
  
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
      data: xLabels,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '记录数量'
    },
    series: [
      {
        name: '记录数量',
        type: 'bar',
        data: data
      }
    ]
  };
  
  chart.setOption(option);
};

// 渲染生命体征图表
const renderVitalSignChart = (chart: echarts.ECharts, type: string) => {
  if (!statistics.value || !vitalSigns.value[type]) return;
  
  const data = vitalSigns.value[type];
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
};

// 渲染用药统计图
const renderMedicationChart = (chart: echarts.ECharts) => {
  if (!statistics.value) return;
  
  const medications = statistics.value.medications || {};
  
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

// 渲染医生互动统计图
const renderDoctorStatsChart = (chart: echarts.ECharts) => {
  if (!statistics.value || !doctorStats.value.length) return;
  
  // 按互动次数降序排序
  const sortedDoctors = [...doctorStats.value]
    .sort((a, b) => b.count - a.count)
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
      type: 'value',
      name: '互动次数'
    },
    yAxis: {
      type: 'category',
      data: sortedDoctors.map(doctor => doctor.name),
      axisLabel: {
        width: 120,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: '互动次数',
        type: 'bar',
        data: sortedDoctors.map(doctor => doctor.count)
      }
    ]
  };
  
  chart.setOption(option);
};

// 渲染状态分布图（预约/处方）
const renderStatusChart = (
  chart: echarts.ECharts, 
  data: Record<string, number>, 
  statusMap: Record<string, string>,
  title: string
) => {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: statusMap[status] || status,
    value: count
  })).filter(item => item.value > 0);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: chartData.map(item => item.name)
    },
    series: [
      {
        name: `${title}状态`,
        type: 'pie',
        radius: '55%',
        center: ['40%', '50%'],
        data: chartData,
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
  
  chart.setOption(option);
};

// 监听生命体征标签变化
watch(activeVitalSign, (newType) => {
  if (newType && vitalSigns.value[newType]) {
    const chartId = `vitalSign-${newType}`;
    const dom = document.getElementById(chartId);
    if (dom) {
      setTimeout(() => {
        const chart = chartInstances[chartId] || echarts.init(dom);
        chartInstances[chartId] = chart;
        renderVitalSignChart(chart, newType);
      }, 0);
    }
  }
});

// 初始化
onMounted(() => {
  // 默认加载最近一个月的数据
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  fetchStatistics(startDate, endDate);
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', () => {
    Object.values(chartInstances).forEach(chart => {
      if (chart) {
        chart.resize();
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