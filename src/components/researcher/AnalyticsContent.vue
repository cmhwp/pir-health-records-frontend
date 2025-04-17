<template>
  <div>
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card :bordered="false" title="健康数据分析">
          <template #extra>
            <a-button type="primary" @click="executeAnalysis">
              <template #icon><pie-chart-outlined /></template>
              执行分析
            </a-button>
          </template>

          <!-- 分析参数选择 -->
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="分析维度">
                  <a-select
                    v-model:value="analysisParams.dimension"
                    placeholder="请选择分析维度"
                  >
                    <a-select-option value="disease">疾病分布</a-select-option>
                    <a-select-option value="age_group">年龄分布</a-select-option>
                    <a-select-option value="gender">性别分布</a-select-option>
                    <a-select-option value="region">地区分布</a-select-option>
                    <a-select-option value="medication">药物分布</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="次要维度">
                  <a-select
                    v-model:value="analysisParams.sub_dimension"
                    placeholder="请选择次要维度"
                    allowClear
                  >
                    <a-select-option value="disease" v-if="analysisParams.dimension !== 'disease'">疾病分布</a-select-option>
                    <a-select-option value="age_group" v-if="analysisParams.dimension !== 'age_group'">年龄分布</a-select-option>
                    <a-select-option value="gender" v-if="analysisParams.dimension !== 'gender'">性别分布</a-select-option>
                    <a-select-option value="record_type">记录类型</a-select-option>
                    <a-select-option value="time_period">时间分布</a-select-option>
                    <a-select-option value="doctor_department">医生科室</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="记录类型">
                  <a-select
                    v-model:value="recordType"
                    placeholder="选择记录类型"
                    allowClear
                  >
                    <a-select-option value="medical_record">病历记录</a-select-option>
                    <a-select-option value="lab_result">检验结果</a-select-option>
                    <a-select-option value="prescription">处方记录</a-select-option>
                    <a-select-option value="imaging">影像资料</a-select-option>
                    <a-select-option value="vaccination">疫苗接种</a-select-option>
                    <a-select-option value="surgery">手术记录</a-select-option>
                    <a-select-option value="allergy">过敏记录</a-select-option>
                    <a-select-option value="visit">就诊记录</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="日期范围">
                  <a-range-picker 
                    v-model:value="dateRange" 
                    style="width: 100%" 
                    :placeholder="['开始日期', '结束日期']" 
                    @change="onDateChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="指标">
                  <a-select
                    v-model:value="analysisParams.metric"
                    placeholder="请选择指标"
                    allowClear
                  >
                    <a-select-option value="count">数量统计</a-select-option>
                    <a-select-option value="avg">平均值</a-select-option>
                    <a-select-option value="sum">总和</a-select-option>
                    <a-select-option value="min">最小值</a-select-option>
                    <a-select-option value="max">最大值</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="最小计数">
                  <a-input-number 
                    v-model:value="analysisParams.min_count" 
                    placeholder="最小计数" 
                    style="width: 100%" 
                    :min="0" 
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-col>
    </a-row>

    <!-- 分析结果 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card :bordered="false" :loading="loading">
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane key="chart" tab="图表视图">
              <a-empty v-if="!hasAnalysisData" description="暂无分析数据，请执行分析" />
              <div v-else class="chart-container" ref="chartContainer"></div>
            </a-tab-pane>
            <a-tab-pane key="table" tab="表格视图">
              <a-empty v-if="!hasAnalysisData" description="暂无分析数据，请执行分析" />
              <div v-else>
                <a-table
                  :columns="analysisColumns"
                  :data-source="analysisTableData"
                  :pagination="{ pageSize: 10 }"
                  :scroll="{ x: 800 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'dimension'">
                      <a-tag>{{ record.dimension }}</a-tag>
                    </template>
                    <template v-if="column.dataIndex === 'percentage'">
                      <a-progress 
                        :percent="record.percentage" 
                        size="small" 
                        :status="record.percentage > 50 ? 'success' : 'normal'" 
                      />
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
            <a-tab-pane key="raw" tab="原始数据">
              <a-empty v-if="!hasAnalysisData" description="暂无分析数据，请执行分析" />
              <div v-else>
                <pre class="json-data">{{ JSON.stringify(analysisData, null, 2) }}</pre>
                <div style="margin-top: 16px; text-align: right">
                  <a-button type="primary" @click="downloadAnalysisData">
                    <template #icon><download-outlined /></template>
                    导出数据
                  </a-button>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  PieChartOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue';
import { aggregateHealthStats } from '@/api/researcher';
import type {
  AggregateHealthStatsRequest,
  AggregateHealthStatsResponse,
  DiseaseAggregateResponse,
  AgeGroupAggregateResponse,
  GenderAggregateResponse,
  RegionAggregateResponse,
  MedicationAggregateResponse,
} from '@/types/researcher';
import * as echarts from 'echarts/core';
import {
  PieChart,
  type PieSeriesOption,
  BarChart,
  type BarSeriesOption
} from 'echarts/charts';
import {
  GridComponent,
  type GridComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  type TitleComponentOption
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  LabelLayout,
  CanvasRenderer
]);

// 定义类型
type ECOption = echarts.ComposeOption<
  PieSeriesOption | 
  BarSeriesOption | 
  GridComponentOption | 
  TooltipComponentOption | 
  LegendComponentOption |
  TitleComponentOption
>;

const loading = ref<boolean>(false);
const chartContainer = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
const activeTabKey = ref<string>('chart');
const dateRange = ref<any[]>([]);

// 分析参数
const analysisParams = reactive<AggregateHealthStatsRequest>({
  dimension: 'disease',
  sub_dimension: undefined,
  metric: undefined,
  min_count: 5,
  filters: {
    record_type: undefined,
    date_range: {
      start: undefined,
      end: undefined
    }
  }
});

// 分析结果数据
const analysisData = ref<AggregateHealthStatsResponse | null>(null);

// 是否有分析数据
const hasAnalysisData = computed(() => {
  return analysisData.value && 
        analysisData.value?.dimension && 
        Array.isArray(analysisData.value?.data) && 
        analysisData.value.data.length > 0;
});

// 表格列定义
const analysisColumns = computed(() => {
  const dimension = analysisData.value?.dimension;
  
  if (!dimension) return [];
  
  const dimensionColumnName = getDimensionDisplayName(dimension);
  
  return [
    {
      title: dimensionColumnName,
      dataIndex: 'dimension',
      key: 'dimension',
      width: 200
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a: any, b: any) => a.count - b.count
    },
    {
      title: '百分比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 200
    },
    ...(analysisData.value?.dimension === 'disease' ? [
      {
        title: '平均值',
        dataIndex: 'mean',
        key: 'mean',
        width: 100
      },
      {
        title: '标准差',
        dataIndex: 'std',
        key: 'std',
        width: 100
      }
    ] : [])
  ];
});

// 表格数据
const analysisTableData = computed(() => {
  if (!analysisData.value || !analysisData.value.data) return [];
  
  const dimension = analysisData.value?.dimension;
  const totalRecords = 'total_records' in analysisData.value ? analysisData.value.total_records : 0;
  
  // 根据维度处理数据
  switch (dimension) {
    case 'disease':
      return (analysisData.value as DiseaseAggregateResponse).data.map(item => ({
        key: item.disease,
        dimension: item.disease,
        count: item.count,
        percentage: calculatePercentage(item.count, totalRecords),
        mean: item.mean || '-',
        std: item.std || '-',
        sub_groups: item.sub_groups || []
      }));
    
    case 'age_group':
      return (analysisData.value as AgeGroupAggregateResponse).data.map(item => ({
        key: item.age_group,
        dimension: item.age_group,
        count: item.count,
        percentage: calculatePercentage(item.count, totalRecords),
        sub_groups: item.sub_groups || []
      }));
    
    case 'gender':
      return (analysisData.value as GenderAggregateResponse).data.map(item => ({
        key: item.gender,
        dimension: item.gender,
        count: item.count,
        percentage: calculatePercentage(item.count, totalRecords),
        sub_groups: item.sub_groups || []
      }));
    
    case 'region':
      return (analysisData.value as RegionAggregateResponse).data.map(item => ({
        key: item.region,
        dimension: item.region,
        count: item.count,
        percentage: calculatePercentage(item.count, totalRecords),
        sub_groups: item.sub_groups || []
      }));
    
    case 'medication':
      return (analysisData.value as MedicationAggregateResponse).data.map(item => ({
        key: item.medication,
        dimension: item.medication,
        count: item.count,
        percentage: calculatePercentage(item.count, totalRecords),
        sub_groups: item.sub_groups || []
      }));
    
    default:
      return [];
  }
});

// 处理日期范围变更
const onDateChange = (dates: any, dateStrings: string[]) => {
  if (!analysisParams.filters) {
    analysisParams.filters = {};
  }
  analysisParams.filters.date_range = {
    start: dateStrings[0] || undefined,
    end: dateStrings[1] || undefined
  };
};

// 执行分析
const executeAnalysis = async () => {
  loading.value = true;
  
  try {
    const response = await aggregateHealthStats(analysisParams);
    
    if (response.success && response.data) {
      analysisData.value = response.data;
      renderChart();
    } else {
      message.error('分析数据失败');
    }
  } catch (error) {
    console.error('分析数据失败:', error);
    message.error('分析数据失败');
  } finally {
    loading.value = false;
  }
};

// 计算百分比
const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// 获取维度显示名称
const getDimensionDisplayName = (dimension: string) => {
  const dimensionMap: Record<string, string> = {
    disease: '疾病',
    age_group: '年龄组',
    gender: '性别',
    region: '地区',
    medication: '药物'
  };
  
  return dimensionMap[dimension] || dimension;
};

// 渲染图表
const renderChart = () => {
  if (!chartContainer.value || !hasAnalysisData.value) return;
  
  if (!chart) {
    chart = echarts.init(chartContainer.value);
  }
  
  const dimension = analysisData.value?.dimension;
  const dimensionDisplayName = getDimensionDisplayName(dimension || '');
  
  // 准备图表数据
  let chartData: any[] = [];
  if (analysisData.value && analysisData.value.data) {
    switch (dimension) {
      case 'disease':
        chartData = (analysisData.value as DiseaseAggregateResponse).data.map(item => ({
          name: item.disease,
          value: item.count
        }));
        break;
      case 'age_group':
        chartData = (analysisData.value as AgeGroupAggregateResponse).data.map(item => ({
          name: item.age_group,
          value: item.count
        }));
        break;
      case 'gender':
        chartData = (analysisData.value as GenderAggregateResponse).data.map(item => ({
          name: item.gender,
          value: item.count
        }));
        break;
      case 'region':
        chartData = (analysisData.value as RegionAggregateResponse).data.map(item => ({
          name: item.region,
          value: item.count
        }));
        break;
      case 'medication':
        chartData = (analysisData.value as MedicationAggregateResponse).data.map(item => ({
          name: item.medication,
          value: item.count
        }));
        break;
    }
  }
  
  // 如果数据不多，使用饼图，否则使用柱状图
  const usePieChart = chartData.length <= 10;
  
  const option: ECOption = usePieChart
    ? {
        title: {
          text: `${dimensionDisplayName}分布`,
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          type: 'scroll'
        },
        series: [
          {
            name: dimensionDisplayName,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
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
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData
          }
        ]
      }
    : {
        title: {
          text: `${dimensionDisplayName}分布`,
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
          type: 'category',
          data: chartData.map(item => item.name),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: dimensionDisplayName,
            type: 'bar',
            data: chartData.map(item => item.value)
          }
        ]
      };
  
  chart.setOption(option);
};

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 下载分析数据
const downloadAnalysisData = () => {
  if (!analysisData.value) return;
  
  const dataStr = JSON.stringify(analysisData.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `health_analysis_${analysisData.value?.dimension || 'data'}_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
  document.body.appendChild(a);
  a.click();
  
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  
  message.success('数据导出成功');
};

// 使用计算属性处理record_type
const recordType = computed({
  get: () => {
    return analysisParams.filters?.record_type;
  },
  set: (value) => {
    if (!analysisParams.filters) {
      analysisParams.filters = {};
    }
    analysisParams.filters.record_type = value;
  }
});

onMounted(() => {
  if (!analysisParams.filters) {
    analysisParams.filters = {
      record_type: undefined,
      date_range: {
        start: undefined,
        end: undefined
      }
    };
  }
  
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.chart-container {
  height: 400px;
  width: 100%;
}

.json-data {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 