<template>
  <div class="experiments-list">
    <a-card>
      <a-table
        :loading="loading"
        :dataSource="experiments"
        :columns="columns"
        rowKey="id"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 项`
        }"
      >
        <!-- 实验类型列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'experiment_type'">
            <a-tag :color="getExperimentTypeColor(record.experiment_type)">
              {{ getExperimentTypeText(record.experiment_type) }}
            </a-tag>
          </template>
          
          <!-- 协议类型列 -->
          <template v-if="column.key === 'protocol_type'">
            <a-tag v-if="record.protocol_type" :color="getProtocolColor(record.protocol_type)">
              {{ PIR_TYPE_MAP[record.protocol_type as keyof typeof PIR_TYPE_MAP] }}
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
          
          <!-- 时间列 -->
          <template v-if="column.key === 'created_at'">
            {{ formatDateTime(record.created_at) }}
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleView(record)">查看</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除这个实验吗？"
                @confirm="handleDelete(record)"
                ok-text="是"
                cancel-text="否"
              >
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import dayjs from 'dayjs';
import { PIRProtocolType } from '@/types/researcher';
import { PIR_TYPE_MAP } from '@/constants/researcher';
import type { ExperimentListItem } from '@/types/researcher';

const props = defineProps<{
  loading: boolean;
  experiments: ExperimentListItem[];
}>();

const emit = defineEmits<{
  (e: 'view-experiment', experimentId: string): void;
  (e: 'delete-experiment', experimentId: string): void;
}>();

// 表格列定义
const columns: TableColumnsType = [
  {
    title: '实验ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    ellipsis: true
  },
  {
    title: '实验类型',
    dataIndex: 'experiment_type',
    key: 'experiment_type',
    width: 120
  },
  {
    title: '数据量',
    dataIndex: 'data_count',
    key: 'data_count',
    width: 80,
    align: 'center'
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
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right'
  }
];

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
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

// 查看实验
const handleView = (record: ExperimentListItem) => {
  emit('view-experiment', record.id);
};

// 删除实验
const handleDelete = (record: ExperimentListItem) => {
  emit('delete-experiment', record.id);
};
</script>

<style scoped>
.experiments-list {
  margin-bottom: 16px;
}

.danger-link {
  color: #ff4d4f;
}

.danger-link:hover {
  color: #ff7875;
}
</style> 