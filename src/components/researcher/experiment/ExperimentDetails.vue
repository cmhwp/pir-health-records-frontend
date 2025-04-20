<template>
  <div class="experiment-details">
    <a-page-header
      :title="experiment ? `实验: ${experiment.id}` : '实验详情'"
      @back="handleBack"
    >
      <template #tags>
        <a-tag v-if="experiment?.protocol_config?.protocol_type" :color="getProtocolColor(experiment.protocol_config.protocol_type)">
          {{ experiment?.protocol_config?.protocol_type }}
        </a-tag>
        <a-tag v-if="experiment?.experiment_type" :color="getExperimentTypeColor(experiment.experiment_type)">
          {{ getExperimentTypeText(experiment.experiment_type) }}
        </a-tag>
      </template>
      <template #extra>
        <a-space>
          <a-button @click="refreshDetails">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
          <a-dropdown v-if="experiment">
            <a-button type="primary">
              操作
              <down-outlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="configure" @click="showConfigureModal" :disabled="!!experiment?.protocol_config">
                  <setting-outlined />
                  配置协议
                </a-menu-item>
                <a-menu-item key="execute" @click="showExecuteModal" :disabled="!experiment?.protocol_config">
                  <play-circle-outlined />
                  执行查询
                </a-menu-item>
                <a-menu-item key="metrics" @click="showMetricsModal" :disabled="!experiment?.results">
                  <bar-chart-outlined />
                  查看指标
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div v-if="experiment" class="experiment-content">
        <!-- 基本信息 -->
        <a-row :gutter="16">
          <a-col :span="24">
            <a-card title="基本信息" class="detail-card">
              <a-descriptions bordered :column="{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }">
                <a-descriptions-item label="实验ID">{{ experiment.id }}</a-descriptions-item>
                <a-descriptions-item label="实验类型">{{ getExperimentTypeText(experiment.experiment_type) }}</a-descriptions-item>
                <a-descriptions-item label="数据量">{{ experiment.data_count }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ formatDateTime(experiment.created_at) }}</a-descriptions-item>
                <a-descriptions-item label="更新时间">{{ formatDateTime(experiment.updated_at) || '-' }}</a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-badge 
                    :status="experiment.results ? 'success' : (experiment.protocol_config ? 'processing' : 'default')" 
                    :text="experiment.results ? '已完成' : (experiment.protocol_config ? '已配置' : '初始化')" 
                  />
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
        </a-row>

        <!-- 数据示例和协议配置 -->
        <a-row :gutter="16" style="margin-top: 16px">
          <!-- 数据示例 -->
          <a-col :span="12">
            <a-card title="数据示例" class="detail-card">
              <a-empty v-if="!experiment.data_samples || experiment.data_samples.length === 0" description="无数据示例" />
              <div v-else>
                <a-tabs>
                  <a-tab-pane v-for="(sample, index) in experiment.data_samples" :key="index" :tab="`示例 ${index + 1}`">
                    <pre class="code-block">{{ JSON.stringify(sample, null, 2) }}</pre>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </a-card>
          </a-col>
          
          <!-- 协议配置 -->
          <a-col :span="12">
            <a-card title="协议配置" class="detail-card">
              <a-empty v-if="!experiment.protocol_config" description="未配置协议" v-slot:description>
                <span>
                  尚未配置PIR协议参数
                  <a @click="showConfigureModal">立即配置</a>
                </span>
              </a-empty>
              <div v-else>
                <a-descriptions bordered :column="1">
                  <a-descriptions-item label="协议类型">
                    <a-tag :color="getProtocolColor(experiment.protocol_config.protocol_type)">
                      {{ experiment.protocol_config.protocol_type }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item v-for="(value, key) in getProtocolParams()" :key="key" :label="formatParamName(key)">
                    {{ value }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 执行结果 -->
        <a-row :gutter="16" style="margin-top: 16px">
          <a-col :span="24">
            <a-card title="执行结果" class="detail-card">
              <a-empty v-if="!experiment.results" description="尚未执行查询" v-slot:description>
                <span>
                  尚未执行PIR查询测试
                  <a @click="showExecuteModal" :disabled="!experiment.protocol_config">立即执行</a>
                </span>
              </a-empty>
              <div v-else>
                <a-tabs>
                  <a-tab-pane key="metrics" tab="性能指标">
                    <a-descriptions bordered :column="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }">
                      <a-descriptions-item v-for="(value, key) in experiment.results.metrics" :key="key" :label="formatMetricName(key)">
                        <a-statistic 
                          :value="formatMetricValue(key, value)" 
                          :precision="key === 'query_time' || key === 'accuracy' ? 3 : 0"
                          :suffix="getMetricUnit(key)"
                        />
                      </a-descriptions-item>
                    </a-descriptions>
                    <div class="metrics-action">
                      <a-button type="primary" @click="showMetricsModal">
                        <template #icon><bar-chart-outlined /></template>
                        查看详细指标
                      </a-button>
                    </div>
                  </a-tab-pane>
                  <a-tab-pane key="results" tab="查询结果">
                    <a-empty v-if="!experiment.results.sample_results || experiment.results.sample_results.length === 0" description="无查询结果样例" />
                    <div v-else>
                      <a-collapse accordion>
                        <a-collapse-panel v-for="(result, index) in experiment.results.sample_results" :key="index" :header="`结果 ${index + 1}`">
                          <pre class="code-block">{{ JSON.stringify(result, null, 2) }}</pre>
                        </a-collapse-panel>
                      </a-collapse>
                    </div>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
      
      <a-empty v-else description="未找到实验数据" />
    </a-spin>

    <!-- 配置协议模态框 -->
    <configure-protocol-modal
      v-if="experiment"
      v-model:visible="configureModalVisible"
      :experiment-id="experimentId"
      @success="handleConfigureSuccess"
    />

    <!-- 执行查询模态框 -->
    <execute-query-modal
      v-if="experiment?.protocol_config"
      v-model:visible="executeModalVisible"
      :experiment-id="experimentId"
      @success="handleExecuteSuccess"
    />

    <!-- 性能指标模态框 -->
    <metrics-detail-modal
      v-if="experiment?.results"
      v-model:visible="metricsModalVisible"
      :experiment-id="experimentId"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { ReloadOutlined, DownOutlined, SettingOutlined, PlayCircleOutlined, BarChartOutlined } from '@ant-design/icons-vue';
import { getExperimentDetails } from '@/api/researcher';
import { PIRProtocolType, PIRPerformanceMetric } from '@/types/researcher';
import type { ExperimentDetailResponse } from '@/types/researcher';
import ConfigureProtocolModal from './ConfigureProtocolModal.vue';
import ExecuteQueryModal from './ExecuteQueryModal.vue';
import MetricsDetailModal from './MetricsDetailModal.vue';

const props = defineProps<{
  experimentId: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// 状态变量
const loading = ref(false);
const experiment = ref<ExperimentDetailResponse | null>(null);
const configureModalVisible = ref(false);
const executeModalVisible = ref(false);
const metricsModalVisible = ref(false);

// 获取实验详情
const fetchExperimentDetails = async () => {
  loading.value = true;
  try {
    const response = await getExperimentDetails(props.experimentId);
    if (response.success) {
      experiment.value = response.data || null;
    } else {
      message.error(response.message || '获取实验详情失败');
    }
  } catch (error) {
    console.error('获取实验详情出错:', error);
    message.error('获取实验详情出错');
  } finally {
    loading.value = false;
  }
};

// 刷新实验详情
const refreshDetails = () => {
  fetchExperimentDetails();
};

// 返回按钮处理
const handleBack = () => {
  emit('back');
};

// 格式化日期时间
const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 获取实验类型颜色
const getExperimentTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'mock_data_generation': 'blue',
    'pir_query': 'green',
    'protocol_test': 'purple'
  };
  return colorMap[type] || 'default';
};

// 获取实验类型显示文本
const getExperimentTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'mock_data_generation': '模拟数据',
    'pir_query': 'PIR查询',
    'protocol_test': '协议测试'
  };
  return textMap[type] || type;
};

// 获取协议类型颜色
const getProtocolColor = (type: PIRProtocolType) => {
  const colorMap: Record<string, string> = {
    [PIRProtocolType.BASIC]: 'cyan',
    [PIRProtocolType.HOMOMORPHIC]: 'green',
    [PIRProtocolType.HYBRID]: 'purple',
    [PIRProtocolType.ONION]: 'orange'
  };
  return colorMap[type] || 'default';
};

// 获取协议参数
const getProtocolParams = () => {
  if (!experiment.value?.protocol_config) return {};
  
  const { protocol_type, ...params } = experiment.value.protocol_config;
  return params;
};

// 格式化参数名称
const formatParamName = (paramName: string | number) => {
  return String(paramName)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// 格式化指标名称
const formatMetricName = (metricName: string) => {
  const nameMap: Record<string, string> = {
    [PIRPerformanceMetric.QUERY_TIME]: '查询时间',
    [PIRPerformanceMetric.ACCURACY]: '准确率',
    [PIRPerformanceMetric.COMM_COST]: '通信成本',
    [PIRPerformanceMetric.SERVER_LOAD]: '服务器负载',
    [PIRPerformanceMetric.CLIENT_LOAD]: '客户端负载',
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '隐私保护级别'
  };
  return nameMap[metricName] || formatParamName(metricName);
};

// 格式化指标值
const formatMetricValue = (metricName: string, value: any) => {
  if (metricName === PIRPerformanceMetric.QUERY_TIME) {
    return parseFloat(String(value)).toFixed(3);
  }
  return value;
};

// 获取指标单位
const getMetricUnit = (metricName: string) => {
  const unitMap: Record<string, string> = {
    [PIRPerformanceMetric.QUERY_TIME]: '秒',
    [PIRPerformanceMetric.ACCURACY]: '',
    [PIRPerformanceMetric.COMM_COST]: 'KB',
    [PIRPerformanceMetric.SERVER_LOAD]: '%',
    [PIRPerformanceMetric.CLIENT_LOAD]: '%',
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '级'
  };
  return unitMap[metricName] || '';
};

// 显示配置协议弹窗
const showConfigureModal = () => {
  configureModalVisible.value = true;
};

// 显示执行查询弹窗
const showExecuteModal = () => {
  if (!experiment.value?.protocol_config) {
    message.warning('请先配置协议参数');
    return;
  }
  executeModalVisible.value = true;
};

// 显示指标详情弹窗
const showMetricsModal = () => {
  if (!experiment.value?.results) {
    message.warning('请先执行查询');
    return;
  }
  metricsModalVisible.value = true;
};

// 处理配置协议成功
const handleConfigureSuccess = () => {
  message.success('协议配置成功');
  refreshDetails();
};

// 处理执行查询成功
const handleExecuteSuccess = () => {
  message.success('查询执行成功');
  refreshDetails();
};

// 在组件挂载时获取实验详情
onMounted(() => {
  fetchExperimentDetails();
});
</script>

<style scoped>
.experiment-details {
  background-color: #fff;
}

.detail-card {
  margin-bottom: 16px;
}

.code-block {
  max-height: 300px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.metrics-action {
  margin-top: 16px;
  text-align: center;
}
</style> 