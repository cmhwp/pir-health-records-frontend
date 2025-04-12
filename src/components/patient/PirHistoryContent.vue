<template>
  <div class="pir-history-container">
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="查询历史" :loading="loading">
          <template #extra>
            <a-radio-group v-model:value="filterType" button-style="solid" @change="handleFilterChange">
              <a-radio-button value="all">全部查询</a-radio-button>
              <a-radio-button value="pir">仅PIR查询</a-radio-button>
            </a-radio-group>
          </template>
          
          <a-table
            :dataSource="queryHistory"
            :columns="columns"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="_id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'query_type'">
                <a-tag :color="getQueryTypeColor(record.query_type)">
                  {{ getQueryTypeName(record.query_type) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'is_anonymous'">
                <a-tag :color="record.is_anonymous ? '#108ee9' : '#d9d9d9'">
                  {{ record.is_anonymous ? 'PIR保护' : '标准查询' }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'query_params'">
                <a-popover title="查询参数" trigger="click">
                  <template #content>
                    <pre style="max-width: 300px; overflow: auto">{{ formatQueryParams(record.query_params) }}</pre>
                  </template>
                  <a-button type="link">查看参数</a-button>
                </a-popover>
              </template>
              
              <template v-if="column.key === 'query_time'">
                {{ formatDate(record.query_time) }}
              </template>
              
              <template v-if="column.key === 'action'">
                <a-button 
                  type="link" 
                  size="small" 
                  @click="replayQuery(record)"
                  :disabled="!canReplayQuery(record)"
                >
                  <template #icon><redo-outlined /></template>
                  重新查询
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="查询统计" :loading="loading">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-statistic
                title="总查询次数"
                :value="statistics.total_queries"
                style="margin-bottom: 16px"
              />
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="标准查询"
                :value="statistics.standard_queries"
                style="margin-bottom: 16px"
              />
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="PIR查询"
                :value="statistics.pir_queries"
                :valueStyle="{ color: '#1890ff' }"
                style="margin-bottom: 16px"
              />
            </a-col>
          </a-row>
          
          <a-progress 
            :percent="pirProtectionRatio" 
            :stroke-color="{ from: '#108ee9', to: '#87d068' }"
            status="active"
          />
          <div style="text-align: center; margin-top: 8px; color: rgba(0, 0, 0, 0.45)">
            隐私保护率: {{ pirProtectionRatio.toFixed(2) }}%
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="查询类型分布" :loading="loading">
          <div ref="queryTypesChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="月度查询趋势" :loading="loading">
          <div ref="monthlyStatsChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { PieChart, BarChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { getPirHistory, getPirStatistics, pirQueryHealthRecords } from '@/api/health';
import type { QueryHistoryItem, PIRStatisticsResponse, PIRQueryRequest } from '@/types/health';
import type { TablePaginationConfig } from 'ant-design-vue';
import { RedoOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';

// 注册 ECharts 组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  BarChart,
  LabelLayout,
  CanvasRenderer
]);

const router = useRouter();

// 数据加载状态
const loading = ref(true);

// 查询历史
const queryHistory = ref<QueryHistoryItem[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
});

// 查询类型筛选
const filterType = ref<string>('all');

// 统计数据
const statistics = reactive<PIRStatisticsResponse>({
  total_queries: 0,
  standard_queries: 0,
  pir_queries: 0,
  privacy_protection_ratio: 0,
  query_types: {},
  monthly_stats: {}
});

// 表格列定义
const columns = [
  {
    title: '查询类型',
    dataIndex: 'query_type',
    key: 'query_type',
    width: 130
  },
  {
    title: '隐私保护',
    dataIndex: 'is_anonymous',
    key: 'is_anonymous',
    width: 120
  },
  {
    title: '查询参数',
    key: 'query_params',
    width: 120
  },
  {
    title: '查询时间',
    dataIndex: 'query_time',
    key: 'query_time',
    width: 180,
    sorter: true
  },
  {
    title: '操作',
    key: 'action',
    width: 120
  }
];

// 隐私保护率
const pirProtectionRatio = computed(() => statistics.privacy_protection_ratio);

// 获取查询类型名称
const getQueryTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'records': '健康记录查询',
    'record_detail': '记录详情查询',
    'advanced_search': '高级搜索',
    'pir_query': 'PIR隐匿查询',
    'statistics': '统计数据查询',
    'shared_records': '共享记录查询'
  };
  return typeMap[type] || type;
};

// 获取查询类型颜色
const getQueryTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'records': '#1890ff',
    'record_detail': '#13c2c2',
    'advanced_search': '#52c41a',
    'pir_query': '#722ed1',
    'statistics': '#fa8c16',
    'shared_records': '#eb2f96'
  };
  return colorMap[type] || '#d9d9d9';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化查询参数
const formatQueryParams = (params: any): string => {
  if (!params) return '无参数';
  try {
    if (typeof params === 'string') {
      return params;
    }
    return JSON.stringify(params, null, 2);
  } catch (e) {
    return String(params);
  }
};

// 判断查询是否可以重放
const canReplayQuery = (record: QueryHistoryItem): boolean => {
  // 只有健康记录查询和PIR查询可以重放
  return ['records', 'pir_query'].includes(record.query_type);
};

// 重新执行查询
const replayQuery = (record: QueryHistoryItem) => {
  if (!canReplayQuery(record)) return;
  
  if (record.query_type === 'pir_query') {
    // 导航到PIR查询页面并填充参数
    router.push({
      path: '/patient/pir-query',
      query: record.query_params as any
    });
  } else if (record.query_type === 'records') {
    // 导航到记录页面并填充参数
    router.push({
      path: '/patient/records',
      query: record.query_params as any
    });
  }
};

// 筛选变更处理
const handleFilterChange = () => {
  pagination.current = 1;
  fetchQueryHistory();
};

// 获取查询历史
const fetchQueryHistory = async () => {
  loading.value = true;
  try {
    const response = await getPirHistory(
      pagination.current,
      pagination.pageSize,
      filterType.value === 'pir'
    );
    
    if (response.success && response.data) {
      queryHistory.value = response.data.history;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error('获取查询历史失败:', error);
    message.error('获取查询历史失败');
  } finally {
    loading.value = false;
  }
};

// 获取PIR统计数据
const fetchPirStatistics = async () => {
  try {
    const response = await getPirStatistics();
    if (response.success && response.data) {
      Object.assign(statistics, response.data);
      
      // 渲染图表
      await nextTick();
      renderQueryTypesChart();
      renderMonthlyStatsChart();
    }
  } catch (error) {
    console.error('获取PIR统计数据失败:', error);
    message.error('获取PIR统计数据失败');
  }
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig, filters: any, sorter: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  
  // 重新获取数据
  fetchQueryHistory();
};

// 渲染查询类型分布图
const renderQueryTypesChart = () => {
  const chartDom = document.getElementById('queryTypesChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  const queryTypes = statistics.query_types;
  
  // 准备数据
  const data = Object.entries(queryTypes).map(([key, value]) => ({
    name: getQueryTypeName(key),
    value: value || 0
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
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '查询类型',
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
        data: data
      }
    ]
  };
  
  chart.setOption(option);
};

// 渲染月度统计图表
const renderMonthlyStatsChart = () => {
  const chartDom = document.getElementById('monthlyStatsChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  const monthlyStats = statistics.monthly_stats;
  
  // 准备X轴数据 - 最近6个月
  const months = [];
  const standardData = [];
  const pirData = [];
  
  const now = dayjs();
  for (let i = 5; i >= 0; i--) {
    const month = now.subtract(i, 'month');
    const monthStr = month.format('YYYY-MM');
    months.push(monthStr);
    
    // 假设monthlyStats格式为 { "2023-01": 10, "2023-01-pir": 5, ... }
    const total = monthlyStats[monthStr] || 0;
    const pir = monthlyStats[`${monthStr}-pir`] || 0;
    
    pirData.push(pir);
    standardData.push(total - pir);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['标准查询', 'PIR查询']
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
        data: months
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '标准查询',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: standardData
      },
      {
        name: 'PIR查询',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: pirData,
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  };
  
  chart.setOption(option);
};

// 初始化
onMounted(async () => {
  // 并行加载数据
  await Promise.all([
    fetchQueryHistory(),
    fetchPirStatistics()
  ]);
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', function() {
    const chartElements = [
      document.getElementById('queryTypesChart'),
      document.getElementById('monthlyStatsChart')
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
.pir-history-container {
  width: 100%;
}
</style> 