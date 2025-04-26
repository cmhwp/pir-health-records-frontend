<template>
  <div class="experiment-details">
    <a-page-header
      :title="experiment ? `实验: ${experiment.id}` : '实验详情'"
      @back="handleBack"
    >
      <template #tags>
        <a-tag v-if="experiment?.protocol_config?.protocol_type" :color="getProtocolColor(experiment.protocol_config.protocol_type)">
          {{ PIR_TYPE_MAP[experiment?.protocol_config?.protocol_type as keyof typeof PIR_TYPE_MAP] }}
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
          <a-col :span="24">
            <a-card title="数据示例" class="detail-card">
              <a-empty v-if="getPlaintextSamples().length === 0 && getEncryptedSamples().length === 0" description="无数据示例" />
              <div v-else>
                <a-tabs>
                  <a-tab-pane key="plaintext" tab="明文数据" v-if="getPlaintextSamples().length > 0">
                    <a-collapse accordion>
                      <a-collapse-panel 
                        v-for="(sample, index) in getPlaintextSamples()" 
                        :key="index" 
                        :header="`记录 ${index + 1}: ${sample.title || sample.record_type}`"
                      >
                        <pre class="code-block">{{ JSON.stringify(sample, null, 2) }}</pre>
                      </a-collapse-panel>
                    </a-collapse>
                  </a-tab-pane>
                  <a-tab-pane key="encrypted" tab="加密数据" v-if="getEncryptedSamples().length > 0">
                    <a-collapse accordion>
                      <a-collapse-panel 
                        v-for="(sample, index) in getEncryptedSamples()" 
                        :key="index" 
                        :header="`记录 ${index + 1}: ${sample.record_type}`"
                      >
                    <pre class="code-block">{{ JSON.stringify(sample, null, 2) }}</pre>
                      </a-collapse-panel>
                    </a-collapse>
                  </a-tab-pane>
                  <a-tab-pane v-if="experiment.data_comparison" key="comparison" tab="数据对比">
                    <a-card title="加密前后数据对比" style="margin-bottom: 16px;">
                      <p>{{ experiment.data_comparison.explanation }}</p>
                      <a-row :gutter="16">
                        <a-col :span="12">
                          <a-card title="明文数据">
                            <pre class="code-block">{{ JSON.stringify(experiment.data_comparison.plaintext_example, null, 2) }}</pre>
                          </a-card>
                        </a-col>
                        <a-col :span="12">
                          <a-card title="加密数据">
                            <pre class="code-block">{{ JSON.stringify(experiment.data_comparison.encrypted_example, null, 2) }}</pre>
                          </a-card>
                        </a-col>
                      </a-row>
                    </a-card>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </a-card>
          </a-col>
        </a-row>
          
          <!-- 协议配置 -->
        <a-row :gutter="16" style="margin-top: 16px">
          <a-col :span="24">
            <a-card title="协议配置" class="detail-card">
              <a-empty v-if="!experiment.protocol_config" description="未配置协议" v-slot:description>
                <span>
                  尚未配置PIR协议参数
                  <a @click="showConfigureModal">立即配置</a>
                </span>
              </a-empty>
              <div v-else>
                <a-descriptions bordered :column="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }">
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
              
              <!-- 协议说明 -->
              <div v-if="experiment.protocol_explanation" style="margin-top: 16px;">
                <a-divider>协议说明</a-divider>
                <a-card class="protocol-explanation">
                  <p class="protocol-description">{{ experiment.protocol_explanation.description }}</p>
                  
                  <a-table 
                    :dataSource="getProtocolParamDescriptions()"
                    :columns="paramDescriptionColumns"
                    :pagination="false"
                    size="small"
                    :rowKey="(record: any) => record.key"
                  />
                </a-card>
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
                    <a-descriptions bordered :column="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" size="large">
                      <a-descriptions-item v-for="(value, key) in experiment.results.metrics" :key="key" :label="formatMetricName(key)">
                        <a-statistic 
                          :value="formatMetricValue(key, value)" 
                          :precision="key === 'query_time' || key === 'accuracy' ? 3 : 0"
                          :suffix="getMetricUnit(key)"
                          style="font-size: 16px;"
                        />
                      </a-descriptions-item>
                    </a-descriptions>
                    <div class="metrics-action">
                      <a-button type="primary" size="large" @click="showMetricsModal">
                        <template #icon><bar-chart-outlined /></template>
                        查看详细指标
                      </a-button>
                    </div>
                  </a-tab-pane>
                  <a-tab-pane key="results" tab="查询结果">
                    <a-empty v-if="!experiment.results.sample_results || experiment.results.sample_results.length === 0" description="无查询结果样例" />
                    <div v-else>
                      <a-collapse accordion>
                        <a-collapse-panel 
                          v-for="(result, index) in experiment.results.sample_results" 
                          :key="index" 
                          :header="`结果 ${index + 1}`"
                        >
                          <div v-if="result.needs_decrypt && !decryptedResults[index]" class="decrypt-action">
                            <a-alert type="info" style="margin-bottom: 16px" message="此结果需要解密才能查看完整内容" />
                            <a-button 
                              type="primary" 
                              :loading="decryptLoading[index]" 
                              @click="handleDecryptResult(result, index)"
                            >
                              <template #icon><unlock-outlined /></template>
                              解密查询结果
                            </a-button>
                          </div>
                          
                          <div v-if="decryptedResults[index]" class="decrypted-result">
                            <a-alert type="success" style="margin-bottom: 16px" message="已成功解密查询结果" />
                            <a-card title="解密结果对比" style="margin-bottom: 16px">
                              <a-tabs>
                                <a-tab-pane key="comparison" tab="数据对比">
                                  <a-row :gutter="16">
                                    <a-col :span="12">
                                      <a-card title="原始查询信息">
                                        <a-descriptions bordered size="small" :column="1">
                                          <a-descriptions-item label="目标索引">{{ result.target_index }}</a-descriptions-item>
                                          <a-descriptions-item label="查询时间">{{ result.query_time }}秒</a-descriptions-item>
                                          <a-descriptions-item label="通信成本">{{ result.comm_cost }}字节</a-descriptions-item>
                                          <a-descriptions-item label="准确率">{{ result.accuracy }}</a-descriptions-item>
                                          <a-descriptions-item label="隐私级别">{{ result.privacy_level }}</a-descriptions-item>
                                        </a-descriptions>
                                        <a-divider>查询结果</a-divider>
                                        <pre class="code-block-sm">{{ JSON.stringify(result.result, null, 2) }}</pre>
                                      </a-card>
                                    </a-col>
                                    <a-col :span="12">
                                      <a-card title="解密后数据">
                                        <a-alert 
                                          v-if="decryptedResults[index].plaintext_data?.is_encrypted" 
                                          type="warning" 
                                          style="margin-bottom: 16px"
                                          message="该记录包含加密数据，需要进一步解密" 
                                        >
                                          <template #description>
                                            <div style="margin-top: 8px;">
                                              <a-button 
                                                type="primary" 
                                                size="small"
                                                :loading="recordDecryptLoading[index]" 
                                                @click="handleDecryptRecord(decryptedResults[index], index)"
                                              >
                                                <template #icon><file-search-outlined /></template>
                                                解密健康记录
                                              </a-button>
                                            </div>
                                          </template>
                                        </a-alert>
                                        
                                        <div v-if="recordDecrypted[index]">
                                          <pre class="code-block">{{ JSON.stringify(recordDecrypted[index].decrypted_record, null, 2) }}</pre>
                                        </div>
                                        <div v-else>
                                          <pre class="code-block">{{ JSON.stringify(decryptedResults[index].plaintext_data, null, 2) }}</pre>
                                        </div>
                                      </a-card>
                                    </a-col>
                                  </a-row>
                                </a-tab-pane>
                                <a-tab-pane key="decrypted" tab="解密详情">
                                  <a-descriptions bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
                                    <a-descriptions-item label="协议类型">
                                      <a-tag :color="getProtocolColor(decryptedResults[index].protocol_type)">
                                        {{ decryptedResults[index].protocol_type }}
                                      </a-tag>
                                    </a-descriptions-item>
                                    <a-descriptions-item label="记录ID">
                                      {{ formatDecryptedValue(decryptedResults[index].plaintext_data._id) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="患者ID">
                                      {{ decryptedResults[index].plaintext_data.patient_id }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="医生ID">
                                      {{ decryptedResults[index].plaintext_data.doctor_id || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="记录类型">
                                      {{ decryptedResults[index].plaintext_data.record_type }}
                                    </a-descriptions-item>
                                  </a-descriptions>
                                  
                                  <a-divider>数据详情</a-divider>
                                  <div class="data-details">
                                    <pre class="code-block">{{ formatDecryptedDetails(decryptedResults[index].plaintext_data) }}</pre>
                                  </div>
                                </a-tab-pane>
                              </a-tabs>
                            </a-card>
                          </div>
                          
                          <div v-else>
                            <a-descriptions v-if="result.needs_decrypt" bordered size="small" :column="1" style="margin-bottom: 16px;">
                              <a-descriptions-item label="目标索引">{{ result.target_index }}</a-descriptions-item>
                              <a-descriptions-item label="查询时间">{{ result.query_time }}秒</a-descriptions-item>
                              <a-descriptions-item label="通信成本">{{ result.comm_cost }}字节</a-descriptions-item>
                              <a-descriptions-item label="准确率">{{ result.accuracy }}</a-descriptions-item>
                              <a-descriptions-item label="隐私级别">{{ result.privacy_level }}</a-descriptions-item>
                            </a-descriptions>
                            <a-divider v-if="result.needs_decrypt">查询结果</a-divider>
                            <pre class="code-block" v-if="result.needs_decrypt">{{ JSON.stringify(result.result, null, 2) }}</pre>
                            <pre class="code-block" v-else>{{ JSON.stringify(result, null, 2) }}</pre>
                          </div>
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
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { ReloadOutlined, DownOutlined, SettingOutlined, PlayCircleOutlined, BarChartOutlined, UnlockOutlined, FileSearchOutlined } from '@ant-design/icons-vue';
import { getExperimentDetails, decryptExperimentResult, decryptStructuredRecord } from '@/api/researcher';
import { PIRProtocolType, PIRPerformanceMetric } from '@/types/researcher';
import type { 
  ExperimentDetailResponse, 
  ExperimentSampleResult, 
  DecryptExperimentResultRequest,
  DecryptStructuredRecordRequest
} from '@/types/researcher';
import type { ColumnsType } from 'ant-design-vue/es/table';
import ConfigureProtocolModal from './ConfigureProtocolModal.vue';
import ExecuteQueryModal from './ExecuteQueryModal.vue';
import MetricsDetailModal from './MetricsDetailModal.vue';
import { PIR_TYPE_MAP } from '@/constants/researcher';
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
const decryptedResults = ref<Record<number, any>>({});
const decryptLoading = ref<Record<number, boolean>>({});
const recordDecryptLoading = ref<Record<number, boolean>>({});
const recordDecrypted = ref<Record<number, any>>({});

// 获取实验详情
const fetchExperimentDetails = async () => {
  loading.value = true;
  try {
    const response = await getExperimentDetails(props.experimentId);
    console.log(response);
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
  console.log('protocol_params', params);
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
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '隐私保护级别',
    [PIRPerformanceMetric.TOTAL_QUERY_TIME]: '总查询时间',
    [PIRPerformanceMetric.START_TIME]: '开始时间',
    [PIRPerformanceMetric.END_TIME]: '结束时间'
  };
  return nameMap[metricName] || formatParamName(metricName);
};

// 格式化指标值
const formatMetricValue = (metricName: string, value: any) => {
  if (metricName === PIRPerformanceMetric.QUERY_TIME) {
    // 将小值显示为微秒
    const seconds = parseFloat(String(value));
    if (seconds < 0.001) {
      return (seconds * 1000000).toFixed(2); // 转换为微秒
    }
    return seconds.toFixed(5);
  }
  if (metricName === PIRPerformanceMetric.SERVER_LOAD || metricName === PIRPerformanceMetric.CLIENT_LOAD) {
    // 对于非常小的值，调整显示格式
    const load = parseFloat(String(value));
    if (load < 0.0001) {
      return (load * 1000000).toFixed(2) + 'μ'; // 微单位
    }
    return (load * 100).toFixed(2);
  }
  if(metricName === PIRPerformanceMetric.START_TIME || metricName === PIRPerformanceMetric.END_TIME){
    return formatDateTime(value);
  }
  if (metricName === PIRPerformanceMetric.TOTAL_QUERY_TIME) {
    const seconds = parseFloat(String(value));
    return (seconds * 1000).toFixed(3); // 转换为毫秒，保留3位小数
  }
  if (metricName === PIRPerformanceMetric.ACCURACY) {
    return (parseFloat(String(value)) * 100).toFixed(1); // 转为百分比
  }
  return value;
};

// 获取指标单位
const getMetricUnit = (metricName: string) => {
  const unitMap: Record<string, string | ((value: any) => string)> = {
    [PIRPerformanceMetric.QUERY_TIME]: (value) => {
      const seconds = parseFloat(String(value));
      return seconds < 0.001 ? 'μs' : 's';
    },
    [PIRPerformanceMetric.ACCURACY]: '%',
    [PIRPerformanceMetric.COMM_COST]: 'KB',
    [PIRPerformanceMetric.SERVER_LOAD]: (value) => {
      const load = parseFloat(String(value));
      return load < 0.0001 ? '' : '%';
    },
    [PIRPerformanceMetric.CLIENT_LOAD]: (value) => {
      const load = parseFloat(String(value));
      return load < 0.0001 ? '' : '%';
    },
    [PIRPerformanceMetric.PRIVACY_LEVEL]: '级',
    [PIRPerformanceMetric.TOTAL_QUERY_TIME]: 'ms'
  };
  
  const unit = unitMap[metricName];
  // 处理动态单位
  if (typeof unit === 'function') {
    return unit(experiment.value?.results?.metrics[metricName]);
  }
  return unit || '';
};

// 获取明文数据样本
const getPlaintextSamples = () => {
  if (!experiment.value) return [];
  
  // 首先检查专门的plaintext_samples字段
  if (experiment.value.plaintext_samples && experiment.value.plaintext_samples.length > 0) {
    return experiment.value.plaintext_samples;
  }
  
  // 如果没有专门的字段，再看data_samples
  if (!experiment.value.data_samples) return [];
  
  // 如果是新版API格式（对象而非数组）
  if (experiment.value.data_samples && typeof experiment.value.data_samples === 'object' && !Array.isArray(experiment.value.data_samples)) {
    return (experiment.value.data_samples as any).plaintext || [];
  }
  
  // 兼容旧版API格式（直接是数组）
  return experiment.value.data_samples || [];
};

// 获取加密数据样本
const getEncryptedSamples = () => {
  if (!experiment.value?.data_samples) return [];
  
  // 如果是新版API格式（对象而非数组）
  if (experiment.value.data_samples && typeof experiment.value.data_samples === 'object' && !Array.isArray(experiment.value.data_samples)) {
    return (experiment.value.data_samples as any).encrypted || [];
  }
  
  return [];
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

// 获取协议参数描述
const getProtocolParamDescriptions = () => {
  if (!experiment.value?.protocol_explanation) return [];
  
  const paramDescriptions = experiment.value.protocol_explanation.parameter_descriptions || {};
  return Object.entries(paramDescriptions).map(([key, value]) => ({
    key,
    value
  }));
};

// 获取协议参数描述列
const paramDescriptionColumns: ColumnsType = [
  {
    title: '参数',
    dataIndex: 'key',
    key: 'key'
  },
  {
    title: '描述',
    dataIndex: 'value',
    key: 'value'
  }
];

// 处理解密结果
const handleDecryptResult = async (result: ExperimentSampleResult, index: number) => {
  decryptLoading.value[index] = true;
  try {
    // 构造解密请求
    const decryptRequest: DecryptExperimentResultRequest = {
      experiment_id: props.experimentId,
      result_index: result.result_index,
      encrypted_data: result.result
    };
    
    // 调用解密API
    const response = await decryptExperimentResult(decryptRequest);
    
    if (response.success) {
      decryptedResults.value[index] = response.data;
      message.success('解密成功');
    } else {
      message.error(response.message || '解密失败');
    }
  } catch (error) {
    console.error('解密结果出错:', error);
    message.error('解密结果出错');
  } finally {
    decryptLoading.value[index] = false;
  }
};

// 格式化解密后的值
const formatDecryptedValue = (value: any) => {
  if (!value) return '-';
  
  // 处理MongoDB ObjectId
  if (typeof value === 'object' && value.$oid) {
    return value.$oid;
  }
  
  return String(value);
};

// 格式化解密后的详情
const formatDecryptedDetails = (data: any) => {
  if (!data) return '';
  
  // 过滤掉常见的基本字段，只显示业务相关字段
  const { _id, patient_id, doctor_id, record_type, is_encrypted, ...details } = data;
  
  return JSON.stringify(details, null, 2);
};

// 处理解密健康记录
const handleDecryptRecord = async (decryptedResult: any, index: number) => {
  recordDecryptLoading.value[index] = true;
  try {
    // 提取加密记录数据
    const encryptedRecord = decryptedResult.plaintext_data;
    
    // 构造解密请求
    const decryptRequest: DecryptStructuredRecordRequest = {
      encrypted_record: {
        encrypted_data: encryptedRecord.encrypted_data,
        key_salt: encryptedRecord.key_salt,
        encryption_algorithm: encryptedRecord.encryption_algorithm,
        integrity_hash: decryptedResult.integrity_hash
      }
    };
    
    // 调用解密API
    const response = await decryptStructuredRecord(decryptRequest);
    
    if (response.success) {
      recordDecrypted.value[index] = response.data;
      message.success('健康记录解密成功');
    } else {
      message.error(response.message || '健康记录解密失败');
    }
  } catch (error) {
    console.error('解密健康记录出错:', error);
    message.error('解密健康记录出错');
  } finally {
    recordDecryptLoading.value[index] = false;
  }
};
</script>

<style scoped>
.experiment-details {
  background-color: #fff;
}

.detail-card {
  margin-bottom: 16px;
}

.code-block {
  max-height: 500px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.metrics-action {
  margin-top: 24px;
  margin-bottom: 16px;
  text-align: center;
}

.protocol-explanation {
  margin-top: 10px;
}

.protocol-description {
  margin-bottom: 16px;
  line-height: 1.5;
}

.decrypt-action {
  margin-bottom: 16px;
  text-align: center;
}

.decrypted-result {
  margin-bottom: 16px;
}

.data-details {
  margin-top: 16px;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 12px;
}

.code-block-sm {
  max-height: 200px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style> 