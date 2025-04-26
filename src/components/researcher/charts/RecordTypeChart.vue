<template>
  <div class="chart-container" ref="chartContainer">
    <a-empty v-if="!hasData && !loading" description="暂无数据" />
    <a-spin v-else :spinning="loading" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue';
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
import { useRecordTypes } from '@/hooks/useRecordTypes';

const{getRecordTypeName}  = useRecordTypes()
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
const chartInitialized = ref<boolean>(false);

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
      if (chartContainer.value) {
        initChart();
      }
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
    name: getRecordTypeName(item.record_type),
    value: item.count
  }));
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value || chartInitialized.value) return;
  
  try {
    chart = echarts.init(chartContainer.value);
    chartInitialized.value = true;
    updateChart();
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chart || !hasData.value) return;
  
  try {
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
  } catch (error) {
    console.error('更新图表失败:', error);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听DOM变化，确保在DOM就绪后初始化图表
watch(() => chartContainer.value, (newVal) => {
  if (newVal && !chartInitialized.value) {
    // 使用nextTick和延迟双保险确保DOM已渲染
    nextTick(() => {
      setTimeout(() => {
        initChart();
      }, 100);
    });
  }
}, { immediate: true });

// 在加载状态改变时重新渲染
watch(() => props.loading, (newVal) => {
  if (!newVal && recordTypeStats.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        if (chartInitialized.value) {
          updateChart();
        } else if (chartContainer.value) {
          initChart();
        }
      }, 100);
    });
  }
});

// 监听数据变化
watch(() => recordTypeStats.value, () => {
  if (chartInitialized.value) {
    updateChart();
  }
}, { deep: true });

// 组件挂载时获取数据
onMounted(() => {
  fetchRecordTypeStats();
  window.addEventListener('resize', handleResize);
  
  // 确保DOM完全挂载后才初始化图表
  nextTick(() => {
    setTimeout(() => {
      if (chartContainer.value && !chartInitialized.value) {
        initChart();
      }
    }, 300);
  });
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* 确保a-empty和a-spin组件正确定位 */
.chart-container :deep(.ant-empty),
.chart-container :deep(.ant-spin-nested-loading) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style> 