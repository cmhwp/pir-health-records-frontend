<template>
  <div class="chart-container" ref="chartContainer">
    <a-empty v-if="!hasData && !loading" description="暂无数据" />
    <a-spin v-else :spinning="loading" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import { getRecordTypeStatistics } from '@/api/researcher';
import type { RecordTypeStatisticsResponse } from '@/types/researcher';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { 
  PieChart,
  type PieSeriesOption
} from 'echarts/charts';
import {
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
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  LabelLayout,
  CanvasRenderer
]);

// 定义类型
type ECOption = echarts.ComposeOption<
  PieSeriesOption | 
  TooltipComponentOption | 
  LegendComponentOption |
  TitleComponentOption
>;

// 处理echarts实例
const chartContainer = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
const recordTypeStats = ref<RecordTypeStatisticsResponse['stats']>([]);
const localLoading = ref<boolean>(false);

// 检查是否有数据
const hasData = computed(() => {
  return recordTypeStats.value && recordTypeStats.value.length > 0;
});

// 接收props
const props = defineProps<{
  loading?: boolean
}>();

// 获取记录类型统计数据
const fetchRecordTypeStats = async () => {
  localLoading.value = true;
  try {
    const response = await getRecordTypeStatistics();
    if (response.success && response.data) {
      recordTypeStats.value = response.data.stats;
      renderChart();
    }
  } catch (error) {
    console.error('获取记录类型统计失败:', error);
    message.error('获取记录类型统计失败');
  } finally {
    localLoading.value = false;
  }
};

// 准备图表数据
const prepareChartData = () => {
  // 转换数据为echarts需要的格式
  return recordTypeStats.value.map(item => ({
    name: getRecordTypeDisplayName(item.record_type),
    value: item.count
  }));
};

// 获取记录类型显示名称
const getRecordTypeDisplayName = (type: string) => {
  const typeMap: Record<string, string> = {
    'medical_record': '病历记录',
    'lab_result': '检验结果',
    'prescription': '处方记录',
    'imaging': '影像资料',
    'vaccination': '疫苗接种',
    'surgery': '手术记录',
    'allergy': '过敏记录',
    'visit': '就诊记录'
  };
  return typeMap[type] || type;
};

// 渲染图表
const renderChart = () => {
  if (!chartContainer.value) return;
  
  if (!chart) {
    chart = echarts.init(chartContainer.value);
  }

  if (!hasData.value) {
    chart.clear();
    return;
  }

  const option: ECOption = {
    title: {
      text: '记录类型分布',
      left: 'center',
      show: false
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      type: 'scroll',
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '记录类型',
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
        data: prepareChartData()
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

// 在加载状态改变时重新渲染
watch(() => props.loading, (newVal) => {
  if (!newVal && recordTypeStats.value.length > 0) {
    setTimeout(() => {
      renderChart();
    }, 50);
  }
});

// 组件挂载时获取数据并初始化图表
onMounted(() => {
  fetchRecordTypeStats();
  window.addEventListener('resize', handleResize);
});

// 组件卸载前清理
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
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style> 