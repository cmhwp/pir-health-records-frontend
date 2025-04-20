<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="800px"
    :footer="null"
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <div v-if="record" class="record-detail">
        <a-descriptions bordered :column="2">
          <a-descriptions-item label="记录ID" :span="2">
            {{ record._id }}
          </a-descriptions-item>
          <a-descriptions-item label="标题" :span="2">
            {{ record.title || '无标题' }}
          </a-descriptions-item>
          <a-descriptions-item label="记录类型">
            <a-tag>{{ recordTypeLabel }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="记录日期">
            {{ formatDate(record.record_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="机构">
            {{ record.institution || '未指定' }}
          </a-descriptions-item>
          <a-descriptions-item label="医生">
            {{ record.doctor_name || '未指定' }}
          </a-descriptions-item>
          <a-descriptions-item label="可见性">
            <a-tag :color="visibilityColor">{{ visibilityLabel }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(record.created_at) }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 记录描述 -->
        <div v-if="record.description" class="description-section">
          <h3>记录描述</h3>
          <div class="description-content">{{ record.description }}</div>
        </div>

        <!-- 用药记录 -->
        <div v-if="record.medication" class="medication-section">
          <h3>用药信息</h3>
          <a-descriptions bordered :column="2">
            <a-descriptions-item label="药物名称" :span="2">
              {{ record.medication.medication_name }}
            </a-descriptions-item>
            <a-descriptions-item label="剂量">
              {{ record.medication.dosage || '未指定' }}
            </a-descriptions-item>
            <a-descriptions-item label="频率">
              {{ record.medication.frequency || '未指定' }}
            </a-descriptions-item>
            <a-descriptions-item label="开始日期">
              {{ formatDate(record.medication.start_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="结束日期">
              {{ formatDate(record.medication.end_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="用药说明" :span="2">
              {{ record.medication.instructions || '无' }}
            </a-descriptions-item>
            <a-descriptions-item label="副作用" :span="2">
              {{ record.medication.side_effects || '无' }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 生命体征 -->
        <div v-if="record.vital_signs && record.vital_signs.length > 0" class="vital-signs-section">
          <h3>生命体征</h3>
          <a-table :dataSource="record.vital_signs" :columns="vitalSignsColumns" rowKey="type" :pagination="false">
            <template #bodyCell="{ column, text, record: vitalSign }">
              <template v-if="column.dataIndex === 'type'">
                <a-tag :color="getVitalSignColor(vitalSign.type)">
                  {{ getVitalSignTypeName(vitalSign.type) }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'measured_at'">
                {{ formatDate(text) }}
              </template>
              <template v-else-if="column.dataIndex === 'value'">
                {{ vitalSign.value }} {{ vitalSign.unit }}
              </template>
            </template>
          </a-table>
        </div>

        <!-- 标签 -->
        <div v-if="record.tags && record.tags.length > 0" class="tags-section">
          <h3>标签</h3>
          <div class="tags-content">
            <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
          </div>
        </div>

        <!-- 图表可视化 -->
        <div v-if="showChart" class="chart-section">
          <h3>数据可视化</h3>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </div>
      
      <div v-else-if="error" class="error-message">
        <a-alert type="error" :message="error" show-icon />
      </div>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { getPIRRecordDetail } from '@/api/researcher';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
]);

const props = defineProps<{
  visible: boolean;
  recordId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'close'): void;
}>();

// 状态
const loading = ref(false);
const record = ref<any>(null);
const error = ref<string>('');
const chartRef = ref<HTMLElement | null>(null);
const chartInstance = ref<echarts.ECharts | null>(null);

// 生命体征表格列定义
const vitalSignsColumns = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: '测量时间',
    dataIndex: 'measured_at',
    key: 'measured_at',
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
  }
];

// 计算属性
const title = computed(() => record.value ? `记录详情: ${record.value.title || record.value._id}` : '记录详情');

const recordTypeLabel = computed(() => {
  if (!record.value) return '';
  
  const typeMap: Record<string, string> = {
    'medical_history': '病史',
    'examination': '检查',
    'medication': '用药',
    'vital_signs': '生命体征',
    'treatment': '治疗',
    'surgery': '手术',
    'other': '其他'
  };
  
  return typeMap[record.value.record_type] || record.value.record_type;
});

const visibilityLabel = computed(() => {
  if (!record.value) return '';
  
  const visibilityMap: Record<string, string> = {
    'private': '私密',
    'public': '公开',
    'shared': '共享',
    'researcher': '研究员可见'
  };
  
  return visibilityMap[record.value.visibility] || record.value.visibility;
});

const visibilityColor = computed(() => {
  if (!record.value) return '';
  
  const colorMap: Record<string, string> = {
    'private': 'red',
    'public': 'green',
    'shared': 'blue',
    'researcher': 'purple'
  };
  
  return colorMap[record.value.visibility] || '';
});

const showChart = computed(() => {
  if (!record.value) return false;
  
  // 判断是否有可视化的数据
  if (record.value.vital_signs && record.value.vital_signs.length > 0) {
    return true;
  }
  
  if (record.value.data && typeof record.value.data === 'object') {
    return true;
  }
  
  return false;
});

// 方法
const fetchRecordDetail = async () => {
  if (!props.recordId) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await getPIRRecordDetail(props.recordId);
    
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      error.value = response.message || '获取记录失败';
    }
  } catch (err: any) {
    error.value = err.message || '获取记录时发生错误';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '未设置';
  return new Date(date).toLocaleString();
};

const getVitalSignTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'BLOOD_PRESSURE': '血压',
    'HEART_RATE': '心率',
    'TEMPERATURE': '体温',
    'BLOOD_OXYGEN': '血氧',
    'BLOOD_GLUCOSE': '血糖',
    'WEIGHT': '体重',
    'HEIGHT': '身高',
    'BMI': '体重指数',
    'RESPIRATORY_RATE': '呼吸率',
    'OTHER': '其他'
  };
  return typeMap[type] || type;
};

const getVitalSignColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'BLOOD_PRESSURE': 'red',
    'HEART_RATE': 'orange',
    'TEMPERATURE': 'gold',
    'BLOOD_OXYGEN': 'blue',
    'BLOOD_GLUCOSE': 'purple',
    'WEIGHT': 'cyan',
    'HEIGHT': 'green',
    'BMI': 'lime',
    'RESPIRATORY_RATE': 'magenta',
    'OTHER': 'default'
  };
  return colorMap[type] || 'default';
};

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const initChart = () => {
  if (!chartRef.value || !record.value) return;
  
  // 销毁之前的图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
  
  // 初始化图表
  chartInstance.value = echarts.init(chartRef.value);
  
  // 根据记录类型生成不同的图表
  if (record.value.vital_signs && record.value.vital_signs.length > 0) {
    // 生命体征数据可视化
    const vitalSigns = record.value.vital_signs;
    const option = {
      title: {
        text: '生命体征数据'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: vitalSigns.map((vs: any) => vs.type)
      },
      xAxis: {
        type: 'category',
        data: vitalSigns.map((vs: any) => formatDate(vs.measured_at))
      },
      yAxis: {
        type: 'value'
      },
      series: vitalSigns.map((vs: any) => ({
        name: vs.type,
        type: 'bar',
        data: [vs.value]
      }))
    };
    
    chartInstance.value.setOption(option);
  } else if (record.value.data && typeof record.value.data === 'object') {
    // 其他数据可视化
    const data = record.value.data;
    const keys = Object.keys(data).filter(key => typeof data[key] === 'number');
    
    if (keys.length > 0) {
      const option = {
        title: {
          text: '记录数据'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '数据',
            type: 'pie',
            radius: '50%',
            data: keys.map(key => ({
              name: key,
              value: data[key]
            })),
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
      
      chartInstance.value.setOption(option);
    }
  }
};

// 监听
watch(() => props.visible, (newVal) => {
  if (newVal && props.recordId) {
    fetchRecordDetail();
  }
});

watch(() => props.recordId, (newVal) => {
  if (props.visible && newVal) {
    fetchRecordDetail();
  }
});

watch([record, chartRef], () => {
  if (record.value && chartRef.value) {
    nextTick(() => {
      initChart();
    });
  }
});

// 生命周期
onMounted(() => {
  if (props.visible && props.recordId) {
    fetchRecordDetail();
  }
});
</script>

<style scoped>
.record-detail {
  padding: 16px 0;
}

.description-section,
.medication-section,
.vital-signs-section,
.tags-section,
.chart-section {
  margin-top: 24px;
}

.description-content {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  white-space: pre-wrap;
}

.tags-content {
  margin: 8px 0;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin: 16px 0;
}

.error-message {
  padding: 24px 0;
}
</style> 