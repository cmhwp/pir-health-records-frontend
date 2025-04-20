<template>
  <div class="protocol-comparison">
    <a-card title="协议性能比较">
      <a-alert
        type="info"
        style="margin-bottom: 16px;"
        message="选择至少两个实验进行比较，分析不同PIR协议的性能特征"
      />
      
      <a-form layout="vertical">
        <a-form-item label="选择要比较的实验">
          <a-spin :spinning="loading">
            <a-checkbox-group v-model:value="selectedExperimentIds">
              <a-table
                :dataSource="compareExperiments"
                :columns="columns"
                :pagination="false"
                :rowKey="(record: Record<string, any>) => record.id"
                size="small"
              >
                <!-- 选择列 -->
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'selected'">
                    <a-checkbox :value="record.id"></a-checkbox>
                  </template>
                  
                  <!-- 实验类型列 -->
                  <template v-if="column.key === 'experiment_type'">
                    <a-tag :color="getExperimentTypeColor(record.experiment_type)">
                      {{ getExperimentTypeText(record.experiment_type) }}
                    </a-tag>
                  </template>
                  
                  <!-- 协议类型列 -->
                  <template v-if="column.key === 'protocol_type'">
                    <a-tag v-if="record.protocol_type" :color="getProtocolColor(record.protocol_type)">
                      {{ record.protocol_type }}
                    </a-tag>
                    <span v-else>未配置</span>
                  </template>
                  
                  <!-- 实验状态列 -->
                  <template v-if="column.key === 'status'">
                    <a-badge 
                      :status="record.has_results ? 'success' : (record.protocol_type ? 'processing' : 'default')" 
                      :text="record.has_results ? '已完成' : (record.protocol_type ? '已配置' : '初始化')" 
                    />
                  </template>
                  
                  <!-- 性能指标列 -->
                  <template v-if="column.key === 'metrics'">
                    <div v-if="record.metrics_summary">
                      <div>查询时间: {{ record.metrics_summary.query_time || '-' }} 秒</div>
                      <div>隐私级别: {{ record.metrics_summary.privacy_level || '-' }}</div>
                    </div>
                    <a-empty v-else description="无指标" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                  </template>
                </template>
              </a-table>
            </a-checkbox-group>
          </a-spin>
        </a-form-item>
        
        <a-form-item>
          <a-space>
            <a-button
              type="primary"
              @click="handleCompare"
              :disabled="selectedExperimentIds.length < 2 || compareLoading"
            >
              <template #icon><bar-chart-outlined /></template>
              比较选中实验
            </a-button>
            <a-button @click="resetSelection" :disabled="selectedExperimentIds.length === 0">
              重置选择
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
      
      <!-- 比较结果 -->
      <a-divider orientation="left">比较结果</a-divider>
      
      <a-spin :spinning="compareLoading">
        <div v-if="comparisonResult">
          <a-tabs>
            <a-tab-pane key="summary" tab="比较概述">
              <a-row :gutter="16">
                <a-col :span="24">
                  <a-card class="result-card">
                    <a-descriptions title="协议比较" bordered :column="{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }">
                      <a-descriptions-item 
                        v-for="(protocol, index) in comparisonResult.protocols" 
                        :key="protocol.experiment_id"
                        :label="`协议 ${index + 1}`"
                      >
                        <a-tag :color="getProtocolColor(protocol.protocol_type)">
                          {{ protocol.protocol_type }}
                        </a-tag>
                      </a-descriptions-item>
                    </a-descriptions>
                  </a-card>
                </a-col>
              </a-row>
              
              <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="24">
                  <a-collapse v-model:activeKey="activeComparisonKeys">
                    <a-collapse-panel 
                      v-for="(comparison, index) in comparisonResult.comparisons" 
                      :key="index"
                      :header="`比较 ${index + 1}: ${comparison.baseline.protocol_type} vs ${comparison.current.protocol_type}`"
                    >
                      <a-descriptions bordered :column="1">
                        <a-descriptions-item label="基准协议">
                          <a-tag :color="getProtocolColor(comparison.baseline.protocol_type)">
                            {{ comparison.baseline.protocol_type }}
                          </a-tag>
                          (实验ID: {{ comparison.baseline.experiment_id }})
                        </a-descriptions-item>
                        <a-descriptions-item label="比较协议">
                          <a-tag :color="getProtocolColor(comparison.current.protocol_type)">
                            {{ comparison.current.protocol_type }}
                          </a-tag>
                          (实验ID: {{ comparison.current.experiment_id }})
                        </a-descriptions-item>
                      </a-descriptions>
                      
                      <a-divider orientation="left">比较报告</a-divider>
                      
                      <div class="comparison-summary">
                        <div class="summary-item" v-for="(value, key) in comparison.report.summary" :key="key">
                          <strong>{{ formatSummaryKey(key) }}:</strong> {{ value }}
                        </div>
                      </div>
                      
                      <a-divider orientation="left">详细比较</a-divider>
                      
                      <a-table
                        :dataSource="getComparisonTableData(comparison.report.comparisons)"
                        :columns="comparisonColumns"
                        :pagination="false"
                        size="small"
                      >
                        <template #bodyCell="{ column, record }">
                          <template v-if="column.key === 'diff'">
                            <a-tag :color="getDiffColor(record.diff)">{{ record.diff > 0 ? '+' : '' }}{{ record.diff }}%</a-tag>
                          </template>
                        </template>
                      </a-table>
                      
                      <a-divider orientation="left">建议</a-divider>
                      
                      <ul class="recommendation-list">
                        <li v-for="(recommendation, recIndex) in comparison.report.recommendations" :key="recIndex">
                          {{ recommendation }}
                        </li>
                      </ul>
                    </a-collapse-panel>
                  </a-collapse>
                </a-col>
              </a-row>
            </a-tab-pane>
            
            <a-tab-pane key="chart" tab="图表比较">
              <div class="chart-placeholder">
                协议性能图表比较
                <div class="chart-placeholder-text">(实际实现时集成图表库)</div>
              </div>
            </a-tab-pane>
            
            <a-tab-pane key="raw" tab="原始数据">
              <pre class="code-block">{{ JSON.stringify(comparisonResult, null, 2) }}</pre>
            </a-tab-pane>
          </a-tabs>
        </div>
        
        <a-empty v-else description="请选择至少两个已完成的实验进行比较" />
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { message, Empty } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { BarChartOutlined } from '@ant-design/icons-vue';
import { compareProtocols } from '@/api/researcher';
import { PIRProtocolType } from '@/types/researcher';
import type { ExperimentListItem, CompareProtocolsResponse } from '@/types/researcher';

const props = defineProps<{
  experiments: ExperimentListItem[];
}>();

const emit = defineEmits<{
  (e: 'compare', experimentIds: string[]): void;
}>();

// 状态变量
const loading = ref(false);
const compareLoading = ref(false);
const selectedExperimentIds = ref<string[]>([]);
const comparisonResult = ref<CompareProtocolsResponse | null>(null);
const activeComparisonKeys = ref<(string | number)[]>([0]); // 默认展开第一个比较

// 表格列定义
const columns: TableColumnsType = [
  {
    key: 'selected',
    title: '选择',
    width: 60
  },
  {
    title: '实验ID',
    dataIndex: 'id',
    key: 'id',
    width: 100,
    ellipsis: true
  },
  {
    title: '协议类型',
    dataIndex: 'protocol_type',
    key: 'protocol_type',
    width: 120
  },
  {
    title: '状态',
    key: 'status',
    width: 100
  },
  {
    title: '性能指标',
    key: 'metrics',
    width: 150
  }
];

// 比较结果表格列定义
const comparisonColumns: TableColumnsType = [
  {
    title: '指标',
    dataIndex: 'metric',
    key: 'metric',
    width: 150
  },
  {
    title: '基准值',
    dataIndex: 'baseline',
    key: 'baseline',
    width: 120
  },
  {
    title: '比较值',
    dataIndex: 'current',
    key: 'current',
    width: 120
  },
  {
    title: '差异',
    dataIndex: 'diff',
    key: 'diff',
    width: 120
  }
];

// 计算属性：有效的比较实验（已配置协议的实验）
const compareExperiments = computed(() => {
  return props.experiments.filter(exp => exp.protocol_type);
});

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

// 获取差异颜色
const getDiffColor = (diff: number) => {
  if (diff > 10) return 'green';
  if (diff < -10) return 'red';
  return 'blue';
};

// 格式化摘要键
const formatSummaryKey = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// 获取比较表格数据
const getComparisonTableData = (comparisons: Record<string, any>) => {
  const result = [];
  for (const [metric, values] of Object.entries(comparisons)) {
    result.push({
      metric: formatSummaryKey(metric),
      baseline: values.baseline,
      current: values.current,
      diff: values.percentage_diff
    });
  }
  return result;
};

// 重置选择
const resetSelection = () => {
  selectedExperimentIds.value = [];
  comparisonResult.value = null;
};

// 处理比较
const handleCompare = async () => {
  if (selectedExperimentIds.value.length < 2) {
    message.warning('请至少选择两个实验进行比较');
    return;
  }
  
  compareLoading.value = true;
  
  try {
    const response = await compareProtocols({
      experiment_ids: selectedExperimentIds.value
    });
    
    if (response.success) {
      comparisonResult.value = response.data || null;
      message.success('协议比较完成');
      // 发送比较事件
      emit('compare', selectedExperimentIds.value);
    } else {
      message.error(response.message || '协议比较失败');
    }
  } catch (error) {
    console.error('协议比较出错:', error);
    message.error('协议比较请求出错');
  } finally {
    compareLoading.value = false;
  }
};
</script>

<style scoped>
.protocol-comparison {
  margin-bottom: 16px;
}

.result-card {
  margin-bottom: 16px;
}

.code-block {
  max-height: 400px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.comparison-summary {
  margin: 16px 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.summary-item {
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.recommendation-list {
  margin: 16px 0;
  padding-left: 20px;
}

.recommendation-list li {
  margin-bottom: 8px;
}

.chart-placeholder {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #1890ff;
  font-size: 18px;
  font-weight: bold;
}

.chart-placeholder-text {
  font-size: 14px;
  color: #999;
  font-weight: normal;
  margin-top: 8px;
}
</style> 