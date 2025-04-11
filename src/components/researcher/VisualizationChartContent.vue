<template>
  <div>
    <h1>图表分析</h1>
    
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card>
          <a-form layout="inline">
            <a-form-item label="数据集">
              <a-select v-model:value="selectedDataset" style="width: 200px">
                <a-select-option value="patient_data">患者数据</a-select-option>
                <a-select-option value="treatment_data">治疗数据</a-select-option>
                <a-select-option value="disease_data">疾病数据</a-select-option>
                <a-select-option value="regional_data">地区数据</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="图表类型">
              <a-select v-model:value="chartType" style="width: 150px">
                <a-select-option value="bar">柱状图</a-select-option>
                <a-select-option value="line">折线图</a-select-option>
                <a-select-option value="pie">饼图</a-select-option>
                <a-select-option value="scatter">散点图</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="时间范围">
              <a-range-picker v-model:value="dateRange" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="generateChart">
                <template #icon><bar-chart-outlined /></template>
                生成图表
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card title="数据可视化" :bordered="false" style="margin-bottom: 16px; height: 500px; display: flex; justify-content: center; align-items: center;">
          <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column;">
            <!-- 实际项目中这里应该使用真实的图表组件，如ECharts, Chart.js等 -->
            <div style="width: 80%; height: 80%; border: 1px dashed #ccc; display: flex; justify-content: center; align-items: center; margin-bottom: 16px;">
              <div style="text-align: center;">
                <h3>{{ chartTitle }}</h3>
                <p>图表类型: {{ getChartTypeName() }}</p>
                <p>图表区域（示例）</p>
              </div>
            </div>
            <a-space>
              <a-button>
                <template #icon><download-outlined /></template>
                导出图表
              </a-button>
              <a-button>
                <template #icon><share-alt-outlined /></template>
                分享
              </a-button>
              <a-button>
                <template #icon><setting-outlined /></template>
                图表设置
              </a-button>
            </a-space>
          </div>
        </a-card>
        
        <a-card title="数据表" :bordered="false">
          <a-table :columns="columns" :data-source="tableData" :pagination="{ pageSize: 5 }" size="small">
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="图表库" :bordered="false" style="margin-bottom: 16px;">
          <a-list
            :data-source="savedCharts"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="`${item.type} | ${item.createdAt}`">
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.color }">
                      {{ getChartIcon(item.type) }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #extra>
                  <a-button size="small" @click="loadChart(item.id)">
                    加载
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
        
        <a-card title="数据分析" :bordered="false">
          <a-descriptions layout="vertical" bordered>
            <a-descriptions-item label="数据点总数">1,452</a-descriptions-item>
            <a-descriptions-item label="平均值">37.5</a-descriptions-item>
            <a-descriptions-item label="中位数">35.2</a-descriptions-item>
            <a-descriptions-item label="最大值">89.7</a-descriptions-item>
            <a-descriptions-item label="最小值">12.3</a-descriptions-item>
            <a-descriptions-item label="标准差">8.4</a-descriptions-item>
          </a-descriptions>
          
          <a-divider style="margin: 16px 0" />
          
          <h4>主要观察</h4>
          <a-typography-paragraph>
            <ul>
              <li>数据在30-45岁区间内的分布最为集中</li>
              <li>男性组与女性组在治疗响应上存在显著差异</li>
              <li>城市地区的患者数据与农村地区存在明显差异</li>
            </ul>
          </a-typography-paragraph>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { 
  BarChartOutlined, 
  DownloadOutlined,
  ShareAltOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';

// 表单数据
const selectedDataset = ref('patient_data');
const chartType = ref('bar');
const dateRange = ref<[Date, Date] | null>(null);

// 图表标题
const chartTitle = computed(() => {
  const datasetNames: Record<string, string> = {
    patient_data: '患者数据',
    treatment_data: '治疗数据',
    disease_data: '疾病数据',
    regional_data: '地区数据'
  };
  
  return `${datasetNames[selectedDataset.value]}分析图表`;
});

// 表格列定义
const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '百分比',
    dataIndex: 'percentage',
    key: 'percentage',
  },
  {
    title: '变化趋势',
    dataIndex: 'trend',
    key: 'trend',
  },
];

// 表格数据
const tableData = [
  {
    key: '1',
    name: '北京',
    value: 356,
    percentage: '24.5%',
    trend: '上升',
  },
  {
    key: '2',
    name: '上海',
    value: 289,
    percentage: '19.9%',
    trend: '上升',
  },
  {
    key: '3',
    name: '广州',
    value: 212,
    percentage: '14.6%',
    trend: '稳定',
  },
  {
    key: '4',
    name: '深圳',
    value: 176,
    percentage: '12.1%',
    trend: '上升',
  },
  {
    key: '5',
    name: '武汉',
    value: 125,
    percentage: '8.6%',
    trend: '下降',
  },
  {
    key: '6',
    name: '其他',
    value: 294,
    percentage: '20.3%',
    trend: '稳定',
  },
];

// 保存的图表
const savedCharts = [
  {
    id: 1,
    title: '年龄分布分析',
    type: '柱状图',
    createdAt: '2023-05-10',
    color: '#1890ff',
  },
  {
    id: 2,
    title: '治疗效果对比',
    type: '折线图',
    createdAt: '2023-05-12',
    color: '#52c41a',
  },
  {
    id: 3,
    title: '疾病类型占比',
    type: '饼图',
    createdAt: '2023-05-15',
    color: '#fa8c16',
  },
  {
    id: 4,
    title: '地区相关性分析',
    type: '散点图',
    createdAt: '2023-05-18',
    color: '#722ed1',
  },
];

// 获取图表类型名称
const getChartTypeName = () => {
  switch (chartType.value) {
    case 'bar':
      return '柱状图';
    case 'line':
      return '折线图';
    case 'pie':
      return '饼图';
    case 'scatter':
      return '散点图';
    default:
      return '柱状图';
  }
};

// 获取图表图标
const getChartIcon = (type: string) => {
  switch (type) {
    case '柱状图':
      return 'B';
    case '折线图':
      return 'L';
    case '饼图':
      return 'P';
    case '散点图':
      return 'S';
    default:
      return 'C';
  }
};

// 生成图表
const generateChart = () => {
  console.log('生成图表', {
    dataset: selectedDataset.value,
    chartType: chartType.value,
    dateRange: dateRange.value,
  });
};

// 加载保存的图表
const loadChart = (id: number) => {
  console.log('加载图表ID:', id);
};
</script>

<style scoped>
</style> 