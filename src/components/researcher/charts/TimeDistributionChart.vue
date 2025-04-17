<template>
  <div class="chart-container" ref="chartContainer">
    <a-empty v-if="!hasData && !loading" description="暂无数据" />
    <a-spin v-else :spinning="loading" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import { getTimeDistribution } from '@/api/researcher';
import type { TimeDistributionResponse, TimeDistributionParams } from '@/types/researcher';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { 
  LineChart,
  type LineSeriesOption,
  BarChart,
  type BarSeriesOption
} from 'echarts/charts';
import {
  TooltipComponent,
  type TooltipComponentOption,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  type TitleComponentOption,
  DataZoomComponent,
  type DataZoomComponentOption
} from 'echarts/components';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  LineChart,
  BarChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  UniversalTransition,
  CanvasRenderer
]);

// 定义类型
type ECOption = echarts.ComposeOption<
  LineSeriesOption | 
  BarSeriesOption |
  TooltipComponentOption | 
  GridComponentOption |
  LegendComponentOption |
  TitleComponentOption |
  DataZoomComponentOption
>;

// 处理echarts实例
const chartContainer = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
const timeStats = ref<TimeDistributionResponse['stats']>([]);
const localLoading = ref<boolean>(false);
const currentInterval = ref<TimeDistributionParams['interval']>('week');

// 检查是否有数据
const hasData = computed(() => {
  return timeStats.value && timeStats.value.length > 0;
});

// 接收props
const props = defineProps<{
  loading?: boolean,
  interval?: TimeDistributionParams['interval']
}>();

// 设置默认值
if (!props.interval) {
  currentInterval.value = 'week';
} else {
  currentInterval.value = props.interval;
}

// 获取时间分布统计数据
const fetchTimeDistribution = async () => {
  localLoading.value = true;
  try {
    const response = await getTimeDistribution({
      interval: currentInterval.value,
      limit: 24
    });
    if (response.success && response.data) {
      timeStats.value = response.data.stats;
      renderChart();
    }
  } catch (error) {
    console.error('获取时间分布统计失败:', error);
    message.error('获取时间分布统计失败');
  } finally {
    localLoading.value = false;
  }
};

// 准备X轴数据
const prepareXAxisData = () => {
  return timeStats.value.map(item => item.time_period);
};

// 准备Y轴数据
const prepareYAxisData = () => {
  return timeStats.value.map(item => item.count);
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
      text: '记录时间分布',
      left: 'center',
      show: false
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
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
      boundaryGap: false,
      data: prepareXAxisData(),
      axisLabel: {
        rotate: currentInterval.value === 'day' ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '记录数量'
    },
    series: [
      {
        name: '记录数量',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: prepareYAxisData()
      }
    ],
    // 添加缩放工具，在数据量大时更易于查看
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
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

// 在interval变化时重新获取数据
watch(() => props.interval, (newVal) => {
  if (newVal) {
    currentInterval.value = newVal;
    fetchTimeDistribution();
  }
});

// 在加载状态改变时重新渲染
watch(() => props.loading, (newVal) => {
  if (!newVal && timeStats.value.length > 0) {
    setTimeout(() => {
      renderChart();
    }, 50);
  }
});

// 组件挂载时获取数据并初始化图表
onMounted(() => {
  fetchTimeDistribution();
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