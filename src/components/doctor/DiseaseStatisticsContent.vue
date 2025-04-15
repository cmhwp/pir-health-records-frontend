<template>
  <div class="disease-statistics-content">
    <h1>疾病统计</h1>
    
    <a-row :gutter="16" style="margin-bottom: 24px">
      <a-col :span="24">
        <a-radio-group v-model:value="timeRange" @change="handleTimeRangeChange" button-style="solid">
          <a-radio-button value="week">本周</a-radio-button>
          <a-radio-button value="month">本月</a-radio-button>
          <a-radio-button value="quarter">本季度</a-radio-button>
          <a-radio-button value="year">本年度</a-radio-button>
          <a-radio-button value="custom">自定义</a-radio-button>
        </a-radio-group>
        
        <a-range-picker 
          v-if="timeRange === 'custom'" 
          v-model:value="dateRange" 
          style="margin-left: 16px"
          @change="handleDateRangeChange" 
        />
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="疾病类型分布" :bordered="false" :loading="loading">
          <div id="disease-type-chart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="疾病趋势分析" :bordered="false" :loading="loading">
          <div id="disease-trend-chart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="常见疾病排名" :bordered="false" :loading="loading">
          <div id="top-diseases-chart" style="width: 100%; height: 400px;"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="疾病详细数据" :bordered="false">
          <a-table
            :columns="columns"
            :data-source="diseaseData"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'trend'">
                <a-tag :color="record.trend === 'up' ? 'red' : (record.trend === 'down' ? 'green' : 'blue')">
                  {{ record.trend === 'up' ? '上升' : (record.trend === 'down' ? '下降' : '持平') }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a @click="openDiseaseDetail(record)">详情</a>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 疾病详情抽屉 -->
    <a-drawer
      title="疾病详情"
      :open="drawerVisible"
      @close="closeDiseaseDetail"
      width="600"
    >
      <a-spin :spinning="detailLoading">
        <a-descriptions v-if="selectedDisease" bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
          <a-descriptions-item label="疾病名称">{{ selectedDisease.name }}</a-descriptions-item>
          <a-descriptions-item label="疾病类型">{{ selectedDisease.type }}</a-descriptions-item>
          <a-descriptions-item label="患者数量">{{ selectedDisease.count }}</a-descriptions-item>
          <a-descriptions-item label="相比上期">
            <a-tag :color="selectedDisease.trend === 'up' ? 'red' : (selectedDisease.trend === 'down' ? 'green' : 'blue')">
              {{ selectedDisease.trend === 'up' ? '上升' : (selectedDisease.trend === 'down' ? '下降' : '持平') }}
            </a-tag>
            {{ selectedDisease.changeRate }}%
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider>趋势图</a-divider>
        <div id="disease-detail-chart" style="width: 100%; height: 300px;"></div>
        
        <a-divider>年龄分布</a-divider>
        <div id="disease-age-chart" style="width: 100%; height: 300px;"></div>
        
        <a-divider>患者性别分布</a-divider>
        <div id="disease-gender-chart" style="width: 100%; height: 300px;"></div>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import { getDiseaseStatistics } from '@/api/doctor';
import type { DiseaseStatisticsResponse } from '@/types/doctor';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  BarChart,
  PieChart,
  LineChart,
  CanvasRenderer
]);

// 状态变量
const loading = ref(false);
const timeRange = ref('month');
const dateRange = ref<any[]>([]);
const diseaseData = ref<any[]>([]);
const drawerVisible = ref(false);
const detailLoading = ref(false);
const selectedDisease = ref<any>(null);

// 图表实例
let diseaseTypeChart: echarts.ECharts | null = null;
let diseaseTrendChart: echarts.ECharts | null = null;
let topDiseasesChart: echarts.ECharts | null = null;
let diseaseDetailChart: echarts.ECharts | null = null;
let diseaseAgeChart: echarts.ECharts | null = null;
let diseaseGenderChart: echarts.ECharts | null = null;

// 表格列定义
const columns = [
  {
    title: '疾病名称',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
  },
  {
    title: '疾病类型',
    dataIndex: 'type',
    key: 'type',
    filters: [
      { text: '呼吸系统', value: '呼吸系统' },
      { text: '消化系统', value: '消化系统' },
      { text: '循环系统', value: '循环系统' },
      { text: '内分泌系统', value: '内分泌系统' },
      { text: '其他', value: '其他' },
    ],
  },
  {
    title: '患者数量',
    dataIndex: 'count',
    key: 'count',
    sorter: true,
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    sorter: true,
  },
  {
    title: '趋势',
    dataIndex: 'trend',
    key: 'trend',
    filters: [
      { text: '上升', value: 'up' },
      { text: '下降', value: 'down' },
      { text: '持平', value: 'flat' },
    ],
  },
  {
    title: '变化率',
    dataIndex: 'changeRate',
    key: 'changeRate',
    sorter: true,
    render: (text: number) => `${text}%`,
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 处理时间范围变更
const handleTimeRangeChange = () => {
  fetchDiseaseData();
};

// 处理日期范围变更
const handleDateRangeChange = () => {
  fetchDiseaseData();
};

// 处理表格变化
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchDiseaseData();
};

// 获取疾病统计数据
const fetchDiseaseData = async () => {
  loading.value = true;
  
  try {
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    
    // 根据选择的时间范围设置起止日期
    if (timeRange.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
      startDateStr = dateRange.value[0]?.format('YYYY-MM-DD');
      endDateStr = dateRange.value[1]?.format('YYYY-MM-DD');
    } else {
      // 预设时间范围
      const now = dayjs();
      let startDate;
      
      switch (timeRange.value) {
        case 'week':
          startDate = now.subtract(1, 'week');
          break;
        case 'month':
          startDate = now.subtract(1, 'month');
          break;
        case 'quarter':
          startDate = now.subtract(3, 'month');
          break;
        case 'year':
          startDate = now.subtract(1, 'year');
          break;
        default:
          startDate = now.subtract(1, 'month'); // 默认最近一个月
      }
      
      startDateStr = startDate.format('YYYY-MM-DD');
      endDateStr = now.format('YYYY-MM-DD');
    }
    
    // 调用API获取数据
    const response = await getDiseaseStatistics(startDateStr, endDateStr);
    
    if (response.success && response.data) {
      const data = response.data;
      
      // 更新表格数据
      processDiseaseData(data);
      
      // 更新图表
      initCharts(data);
    } else {
      message.error(response.message || '获取疾病统计数据失败');
    }
  } catch (error: any) {
    console.error('获取疾病统计数据失败:', error);
    message.error('获取疾病统计数据失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 处理疾病数据用于表格显示
const processDiseaseData = (data: DiseaseStatisticsResponse) => {
  // 转换数据为表格适用格式
  // 合并两种来源的数据：common_diagnoses（常见诊断）和disease_trends（疾病趋势）
  const diagnoses = data.common_diagnoses || {};
  
  // 创建数据数组
  const tableData: any[] = [];
  
  // 获取总数用于计算百分比
  const totalDiagnoses = Object.values(diagnoses).reduce((sum, count) => sum + count, 0);
  
  // 计算变化趋势（如果有历史数据）
  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // 查找当月和上月的数据
  const currentMonthData = data.disease_trends.find(
    item => item.year === currentYear && item.month === currentMonth + 1
  );
  
  const previousMonthData = data.disease_trends.find(
    item => item.year === previousYear && item.month === previousMonth + 1
  );
  
  // 遍历诊断数据
  Object.entries(diagnoses).forEach(([diseaseName, count], index) => {
    // 找出当月和上月该疾病的数量
    const currentCount = currentMonthData?.diagnoses[diseaseName] || 0;
    const prevCount = previousMonthData?.diagnoses[diseaseName] || 0;
    
    // 计算变化率和趋势
    let changeRate = 0;
    let trend: 'up' | 'down' | 'flat' = 'flat';
    
    if (prevCount > 0) {
      changeRate = Math.round(((currentCount - prevCount) / prevCount) * 100);
      trend = changeRate > 0 ? 'up' : (changeRate < 0 ? 'down' : 'flat');
    } else if (currentCount > 0) {
      trend = 'up';
      changeRate = 100;
    }
    
    // 确定疾病类型（这里需要根据实际分类来确定）
    // 为简化实现，这里使用一个简单映射
    const diseaseTypeMap: Record<string, string> = {
      '感冒': '呼吸系统',
      '肺炎': '呼吸系统',
      '咳嗽': '呼吸系统',
      '哮喘': '呼吸系统',
      '胃炎': '消化系统',
      '肠炎': '消化系统',
      '消化不良': '消化系统',
      '高血压': '循环系统',
      '心脏病': '循环系统',
      '糖尿病': '内分泌系统',
      '甲状腺': '内分泌系统'
    };
    
    const diseaseType = diseaseTypeMap[diseaseName] || '其他';
    
    // 添加到表格数据
    tableData.push({
      id: index + 1,
      name: diseaseName,
      type: diseaseType,
      count: count,
      percentage: totalDiagnoses > 0 ? Math.round((count / totalDiagnoses) * 100) : 0,
      trend: trend,
      changeRate: Math.abs(changeRate)
    });
  });
  
  // 按患者数量排序
  tableData.sort((a, b) => b.count - a.count);
  
  // 更新表格数据
  diseaseData.value = tableData;
  pagination.total = tableData.length;
};

// 初始化图表
const initCharts = (data: DiseaseStatisticsResponse) => {
  // 使用setTimeout确保DOM渲染完成
  setTimeout(() => {
    initDiseaseTypeChart(data);
    initDiseaseTrendChart(data);
    initTopDiseasesChart(data);
  }, 100);
};

// 初始化疾病类型分布图表
const initDiseaseTypeChart = (data: DiseaseStatisticsResponse) => {
  const chartElement = document.getElementById('disease-type-chart');
  if (!chartElement) return;
  
  if (!diseaseTypeChart) {
    diseaseTypeChart = echarts.init(chartElement);
  }
  
  // 对疾病按类型分组统计
  const diseaseTypes: Record<string, number> = {};
  
  diseaseData.value.forEach(disease => {
    if (!diseaseTypes[disease.type]) {
      diseaseTypes[disease.type] = 0;
    }
    diseaseTypes[disease.type] += disease.count;
  });
  
  // 转换为图表数据
  const chartData = Object.entries(diseaseTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: chartData.map(item => item.name)
    },
    series: [
      {
        name: '疾病类型',
        type: 'pie',
        radius: '65%',
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
  
  diseaseTypeChart.setOption(option);
};

// 初始化疾病趋势分析图表
const initDiseaseTrendChart = (data: DiseaseStatisticsResponse) => {
  const chartElement = document.getElementById('disease-trend-chart');
  if (!chartElement) return;
  
  if (!diseaseTrendChart) {
    diseaseTrendChart = echarts.init(chartElement);
  }
  
  // 处理趋势数据
  const trends = data.disease_trends || [];
  
  // 对数据按时间排序
  const sortedTrends = [...trends].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // 获取最近6个月的数据
  const recent6Months = sortedTrends.slice(-6);
  
  // 组织X轴标签
  const months = recent6Months.map(item => `${item.year}/${item.month}`);
  
  // 找出前5个最常见的疾病作为系列
  const topDiseases = Object.entries(data.common_diagnoses || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
  
  // 为每种疾病构建趋势数据
  const series = topDiseases.map(disease => {
    const seriesData = recent6Months.map(month => {
      return month.diagnoses[disease] || 0;
    });
    
    return {
      name: disease,
      type: 'line',
      data: seriesData
    };
  });
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: topDiseases
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
      name: '患者数量'
    },
    series: series
  };
  
  diseaseTrendChart.setOption(option);
};

// 初始化常见疾病排名图表
const initTopDiseasesChart = (data: DiseaseStatisticsResponse) => {
  const chartElement = document.getElementById('top-diseases-chart');
  if (!chartElement) return;
  
  if (!topDiseasesChart) {
    topDiseasesChart = echarts.init(chartElement);
  }
  
  // 找出前10个最常见的疾病
  const topDiseases = Object.entries(data.common_diagnoses || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const diseaseNames = topDiseases.map(([name]) => name);
  const diseaseCounts = topDiseases.map(([, count]) => count);
  
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
      name: '患者数量'
    },
    yAxis: {
      type: 'category',
      data: diseaseNames.reverse(), // 反转以便从大到小显示
      inverse: true
    },
    series: [
      {
        name: '患者数量',
        type: 'bar',
        data: diseaseCounts.reverse(),
        label: {
          show: true,
          position: 'right'
        }
      }
    ]
  };
  
  topDiseasesChart.setOption(option);
};

// 打开疾病详情抽屉
const openDiseaseDetail = async (disease: any) => {
  selectedDisease.value = disease;
  drawerVisible.value = true;
  
  detailLoading.value = true;
  try {
    // 获取疾病详情数据
    await fetchDiseaseDetail(disease.name);
  } catch (error: any) {
    console.error('获取疾病详情失败:', error);
    message.error('获取疾病详情失败: ' + (error.message || '未知错误'));
  } finally {
    detailLoading.value = false;
  }
};

// 获取疾病详情数据
const fetchDiseaseDetail = async (diseaseName: string) => {
  // 这里应该通过API获取详细数据
  // 在实际项目中，通常会有一个专门的API端点来获取特定疾病的详细信息
  // 例如:
  // const response = await getDiseaseDetail(diseaseName, timeRange.value, startDate, endDate);
  
  try {
    // 重新获取当前时间范围的数据
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    
    if (timeRange.value === 'custom' && dateRange.value && dateRange.value.length === 2) {
      startDateStr = dateRange.value[0]?.format('YYYY-MM-DD');
      endDateStr = dateRange.value[1]?.format('YYYY-MM-DD');
    } else {
      const now = dayjs();
      const startDate = now.subtract(12, 'month');
      startDateStr = startDate.format('YYYY-MM-DD');
      endDateStr = now.format('YYYY-MM-DD');
    }
    
    // 获取数据
    const response = await getDiseaseStatistics(startDateStr, endDateStr);
    if (response.success && response.data) {
      initDiseaseDetailChart(diseaseName, response.data);
      initDiseaseAgeChart(diseaseName);
      initDiseaseGenderChart(diseaseName);
    }
  } catch (error: any) {
    console.error('获取疾病详情数据失败:', error);
    // 使用模拟数据
    initDiseaseDetailChart(diseaseName, { 
      disease_trends: [], 
      common_diagnoses: {}, 
      medication_stats: {}, 
      treatment_stats: {} 
    });
    initDiseaseAgeChart(diseaseName);
    initDiseaseGenderChart(diseaseName);
  }
};

// 初始化疾病详情趋势图表
const initDiseaseDetailChart = (diseaseName: string, data: DiseaseStatisticsResponse) => {
  const chartElement = document.getElementById('disease-detail-chart');
  if (!chartElement) return;
  
  if (!diseaseDetailChart) {
    diseaseDetailChart = echarts.init(chartElement);
  }
  
  // 找出该疾病的历史趋势数据
  const months: string[] = [];
  const counts: number[] = [];
  
  // 查找最近12个月的数据
  const now = dayjs();
  
  // 使用传入的数据
  const trends = data.disease_trends || [];
  
  for (let i = 11; i >= 0; i--) {
    const date = now.subtract(i, 'month');
    const yearMonth = `${date.year()}/${date.month() + 1}`;
    months.push(yearMonth);
    
    // 尝试从disease_trends中找到对应月份的数据
    const monthData = trends.find((item: {year: number, month: number, diagnoses: Record<string, number>}) => 
      item.year === date.year() && item.month === date.month() + 1
    );
    
    // 如果找到数据，获取该疾病的数量；否则设为0
    const count = monthData?.diagnoses[diseaseName] || 0;
    counts.push(count);
  }
  
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
      data: months
    },
    yAxis: {
      type: 'value',
      name: '患者数量'
    },
    series: [
      {
        name: diseaseName,
        type: 'line',
        data: counts,
        areaStyle: {},
        smooth: true
      }
    ]
  };
  
  diseaseDetailChart.setOption(option);
};

// 初始化疾病年龄分布图表
const initDiseaseAgeChart = (diseaseName: string) => {
  const chartElement = document.getElementById('disease-age-chart');
  if (!chartElement) return;
  
  if (!diseaseAgeChart) {
    diseaseAgeChart = echarts.init(chartElement);
  }
  
  // 模拟年龄分布数据
  const ageGroups = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  const counts = ageGroups.map(() => Math.floor(Math.random() * 20)); // 随机数据用于演示
  
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
      data: ageGroups
    },
    yAxis: {
      type: 'value',
      name: '患者数量'
    },
    series: [
      {
        name: '患者数量',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: function(params: { dataIndex: number }) {
            const colorList = [
              '#c23531','#2f4554','#61a0a8','#d48265','#91c7ae',
              '#749f83','#ca8622','#bda29a','#6e7074'
            ];
            return colorList[params.dataIndex % colorList.length];
          }
        }
      }
    ]
  };
  
  diseaseAgeChart.setOption(option);
};

// 初始化疾病性别分布图表
const initDiseaseGenderChart = (diseaseName: string) => {
  const chartElement = document.getElementById('disease-gender-chart');
  if (!chartElement) return;
  
  if (!diseaseGenderChart) {
    diseaseGenderChart = echarts.init(chartElement);
  }
  
  // 模拟性别分布数据
  const genderData = [
    { value: Math.floor(Math.random() * 100), name: '男' },
    { value: Math.floor(Math.random() * 100), name: '女' }
  ];
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      data: genderData.map(item => item.name)
    },
    series: [
      {
        name: '患者性别',
        type: 'pie',
        radius: '50%',
        center: ['50%', '45%'],
        data: genderData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  };
  
  diseaseGenderChart.setOption(option);
};

// 关闭疾病详情抽屉
const closeDiseaseDetail = () => {
  drawerVisible.value = false;
  selectedDisease.value = null;
  
  // 清理图表
  if (diseaseDetailChart) {
    diseaseDetailChart.dispose();
    diseaseDetailChart = null;
  }
  
  if (diseaseAgeChart) {
    diseaseAgeChart.dispose();
    diseaseAgeChart = null;
  }
  
  if (diseaseGenderChart) {
    diseaseGenderChart.dispose();
    diseaseGenderChart = null;
  }
};

// 处理窗口大小变化
const handleResize = () => {
  diseaseTypeChart?.resize();
  diseaseTrendChart?.resize();
  topDiseasesChart?.resize();
  diseaseDetailChart?.resize();
  diseaseAgeChart?.resize();
  diseaseGenderChart?.resize();
};

// 组件挂载时初始化
onMounted(() => {
  // 初始加载数据
  fetchDiseaseData();
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('resize', handleResize);
  
  // 清理图表实例
  [
    diseaseTypeChart,
    diseaseTrendChart,
    topDiseasesChart,
    diseaseDetailChart,
    diseaseAgeChart,
    diseaseGenderChart
  ].forEach(chart => {
    if (chart) {
      chart.dispose();
    }
  });
});
</script>

<style scoped>
.disease-statistics-content {
  width: 100%;
}

.disease-statistics-content h1 {
  margin-bottom: 24px;
}
</style> 