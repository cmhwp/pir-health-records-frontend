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
const chartLoading = ref(false);

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
    'shared_records': '共享记录查询',
    'standard_query': '标准记录查询',
    'standard_record_detail': '标准记录详情查询',
    'version_history': '版本历史查询'
  };
  return typeMap[type] || type;
};

// 获取查询类型颜色
const getQueryTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'records': '#1890ff',             // 蓝色
    'record_detail': '#13c2c2',       // 青色
    'advanced_search': '#52c41a',     // 绿色
    'pir_query': '#722ed1',           // 紫色
    'statistics': '#fa8c16',          // 橙色
    'shared_records': '#eb2f96',      // 粉色
    'standard_query': '#2f54eb',      // 深蓝色
    'standard_record_detail': '#faad14', // 黄色
    'version_history': '#fa541c'      // 红橙色
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

// 筛选变更处理
const handleFilterChange = () => {
  pagination.current = 1;
  // 获取分页数据
  fetchQueryHistory();
  // 获取所有数据用于统计
  fetchAllQueryHistoryForStats();
};

// 获取所有查询历史数据用于统计
const fetchAllQueryHistoryForStats = async () => {
  chartLoading.value = true;
  try {
    // 设置图表加载状态
    if (queryTypesChart.value) {
      const chart = echarts.getInstanceByDom(queryTypesChart.value);
      if (chart) {
        chart.showLoading({
          text: '数据加载中...',
          maskColor: 'rgba(255, 255, 255, 0.8)'
        });
      }
    }
    
    // 获取所有历史记录，设置较大的pageSize来一次性获取所有数据
    // 如果数据量非常大，可以考虑直接从后端获取统计数据
    const response = await getPirHistory(
      1,
      1000, // 设置一个较大的值，确保能获取所有记录
      filterType.value === 'pir'
    );
    
    if (response.success && response.data) {
      // 重置查询类型计数
      statistics.query_types = {};
      
      // 统计每种查询类型的次数
      response.data.history.forEach(record => {
        const type = record.query_type;
        if (!statistics.query_types[type]) {
          statistics.query_types[type] = 0;
        }
        statistics.query_types[type] += 1;
      });
      
      // 渲染查询类型图表
      await nextTick();
      renderQueryTypesChart();
    }
  } catch (error) {
    console.error('获取所有查询历史数据失败:', error);
    message.error('统计数据加载失败');
  } finally {
    // 隐藏加载状态
    if (queryTypesChart.value) {
      const chart = echarts.getInstanceByDom(queryTypesChart.value);
      if (chart) {
        chart.hideLoading();
      }
    }
    chartLoading.value = false;
  }
};

// 图表引用
const queryTypesChart = ref<HTMLElement | null>(null);

// 获取PIR统计数据
const fetchPirStatistics = async () => {
  try {
    const response = await getPirStatistics();
    if (response.success && response.data) {
      Object.assign(statistics, response.data);
      
      // 计算查询类型分布
      calculateQueryTypeDistribution();
      
      // 渲染图表
      await nextTick();
      renderQueryTypesChart();
    }
  } catch (error) {
    console.error('获取PIR统计数据失败:', error);
    message.error('获取PIR统计数据失败');
  }
};

// 计算查询类型分布
const calculateQueryTypeDistribution = () => {
  // 重置查询类型计数
  statistics.query_types = {};
  
  // 统计每种查询类型的次数
  queryHistory.value.forEach(record => {
    const type = record.query_type;
    if (!statistics.query_types[type]) {
      statistics.query_types[type] = 0;
    }
    statistics.query_types[type] += 1;
  });
};

// 渲染查询类型分布图
const renderQueryTypesChart = () => {
  if (!queryTypesChart.value) return;
  
  const chart = echarts.init(queryTypesChart.value);
  const queryTypes = statistics.query_types;
  
  // 准备数据
  const data = Object.entries(queryTypes).map(([key, value]) => ({
    name: getQueryTypeName(key),
    value: value || 0,
    itemStyle: {
      color: getQueryTypeColor(key)
    }
  })).filter(item => item.value > 0);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      data: data.map(item => item.name),
      formatter: (name: string) => {
        const item = data.find(d => d.name === name);
        return item ? `${name}: ${item.value}` : name;
      },
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '查询类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '55%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
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

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig, filters: any, sorter: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  
  // 重新获取数据
  fetchQueryHistory();
};

// 初始化
onMounted(async () => {
  // 并行加载数据
  await Promise.all([
    fetchQueryHistory(),
    fetchPirStatistics(),
    fetchAllQueryHistoryForStats()
  ]);
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', function() {
    if (queryTypesChart.value) {
      const chart = echarts.getInstanceByDom(queryTypesChart.value);
      if (chart) {
        chart.resize();
      }
    }
  });
});
</script>

<style scoped>
.pir-history-container {
  width: 100%;
}
</style> 