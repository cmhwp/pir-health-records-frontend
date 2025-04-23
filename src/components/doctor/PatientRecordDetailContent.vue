<template>
  <div class="record-detail-container">
    <a-page-header
      :title="loading ? '加载中...' : record?.title || '健康记录详情'"
      @back="goBack"
    >
      <template #tags>
        <a-tag v-if="record" :color="getRecordTypeColor(record.record_type)">
          {{ getRecordTypeName(record.record_type) }}
        </a-tag>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-card v-if="record">
        <a-descriptions bordered>
          <a-descriptions-item label="记录标题" :span="3">
            {{ record.title }}
          </a-descriptions-item>
          <a-descriptions-item label="记录类型">
            <a-tag :color="getRecordTypeColor(record.record_type)">
              {{ getRecordTypeName(record.record_type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="记录日期">
            {{ formatDate(record.record_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(record.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="可见性">
            <a-tag :color="getVisibilityColor(record.visibility)">
              {{ getVisibilityName(record.visibility) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="患者">{{ record.patient_name }}</a-descriptions-item>
          <a-descriptions-item label="版本" v-if="record.version">
            {{ record.version }}
          </a-descriptions-item>
          <a-descriptions-item label="加密状态" :span="record.version ? 1 : 2">
            <a-tag :color="record.is_encrypted ? 'purple' : 'green'">
              {{ record.is_encrypted ? '已加密' : '未加密' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="3" v-if="record.tags">
            <a-tag v-for="tag in recordTags" :key="tag" color="blue">{{ tag }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <div v-if="record.description">
          <h3>记录描述</h3>
          <p>{{ record.description }}</p>
        </div>

        <!-- 患者信息 -->
        <div v-if="record.patient_info" style="margin-top: 20px">
          <h3>患者基本信息</h3>
          <a-descriptions bordered>
            <a-descriptions-item label="性别" :span="1">
              {{ record.patient_info.gender || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="出生日期" :span="2">
              {{ formatDate(record.patient_info.date_of_birth) || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="过敏史" :span="3" v-if="record.patient_info.allergies">
              {{ record.patient_info.allergies }}
            </a-descriptions-item>
            <a-descriptions-item label="病史" :span="3" v-if="record.patient_info.medical_history">
              {{ record.patient_info.medical_history }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 用药记录特定字段 -->
        <div v-if="record.data && record.data.medication" style="margin-top: 20px">
          <h3>用药信息</h3>
          <a-descriptions bordered>
            <a-descriptions-item label="药物名称" :span="3">
              {{ record.data.medication.medication_name }}
            </a-descriptions-item>
            <a-descriptions-item label="剂量">
              {{ record.data.medication.dosage || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="频率">
              {{ record.data.medication.frequency || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="用药期间">
              {{ formatDateRange(record.data.medication.start_date, record.data.medication.end_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="用药说明" :span="3" v-if="record.data.medication.instructions">
              {{ record.data.medication.instructions }}
            </a-descriptions-item>
            <a-descriptions-item label="副作用" :span="3" v-if="record.data.medication.side_effects">
              {{ record.data.medication.side_effects }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <!-- 生命体征特定字段 -->
        <div v-if="record.data && record.data.vital_signs && record.data.vital_signs.length > 0" style="margin-top: 20px">
          <h3>生命体征数据</h3>
          <a-table
            :dataSource="record.data.vital_signs"
            :columns="vitalSignColumns"
            :pagination="{ pageSize: 5 }"
            size="middle"
            bordered
          >
            <template #bodyCell="{ column, text, record: vitalSign }">
              <template v-if="column.dataIndex === 'type'">
                <a-tag :color="getVitalSignColor(vitalSign.type)">
                  {{ getVitalSignTypeName(vitalSign.type) }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'measured_at'">
                {{ formatDate(vitalSign.measured_at) }}
              </template>
              <template v-else-if="column.dataIndex === 'value'">
                {{ vitalSign.value }} {{ vitalSign.unit }}
              </template>
            </template>
          </a-table>
        </div>

        <!-- 相关文件列表 -->
        <div v-if="record.files && record.files.length > 0" style="margin-top: 20px">
          <h3>相关文件</h3>
          <a-list size="small" bordered>
            <a-list-item v-for="file in record.files" :key="file.file_path">
              <a-list-item-meta>
                <template #title>{{ file.file_name }}</template>
                <template #description>{{ formatFileSize(file.file_size) }} · {{ formatDate(file.uploaded_at) }}</template>
                <template #avatar>
                  <file-outlined />
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button type="link" @click="downloadFile(file.file_path)">
                  <template #icon><download-outlined /></template>
                  下载
                </a-button>
              </template>
            </a-list-item>
          </a-list>
        </div>
      </a-card>
      <a-empty v-else description="未找到记录数据" />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue';

import { getPatientRecordDetail } from '@/api/doctor';
import { getRecordFileUrl } from '@/api/health';
import type { PatientRecordDetailResponse } from '@/types/doctor';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const route = useRoute();
const router = useRouter();
const recordId = computed(() => route.params.id as string);
const { getRecordTypeName, getRecordTypeColor } = useRecordTypes();

// 状态变量
const loading = ref(false);
const record = ref<PatientRecordDetailResponse | null>(null);

// 记录标签
const recordTags = computed(() => {
  if (!record.value?.tags) return [];
  
  // 确保tags是字符串类型
  const tagsValue = record.value.tags;
  if (typeof tagsValue !== 'string') {
    console.warn('Record tags is not a string:', tagsValue);
    return [];
  }
  
  return tagsValue.split(',').filter(tag => tag && tag.trim().length > 0);
});

// 获取记录详情
const fetchRecordDetail = async () => {
  loading.value = true;
  try {
    const response = await getPatientRecordDetail(recordId.value);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error: any) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 返回上一页
const goBack = () => {
  router.push('/doctor/patient-records');
};

// 获取可见性名称
const getVisibilityName = (visibility: string): string => {
  const visibilityMap: Record<string, string> = {
    private: '仅自己可见',
    public: '所有人可见',
    doctor: '医生可见',
    researcher: '研究人员可见'
  };
  return visibilityMap[visibility] || '未知';
};

// 获取可见性颜色
const getVisibilityColor = (visibility: string): string => {
  const colorMap: Record<string, string> = {
    private: 'red',
    public: 'green',
    doctor: 'blue',
    researcher: 'purple'
  };
  return colorMap[visibility] || 'default';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化日期范围
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return '未记录';
  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '无起始日期';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '持续中';
  return `${start} 至 ${end}`;
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 生命体征相关
// 表格列定义
const vitalSignColumns = [
  {
    title: '测量类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '测量值',
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

// 获取生命体征类型名称
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
  return typeMap[type] || '未知类型';
};

// 获取生命体征颜色
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

// 组件挂载时获取数据
onMounted(() => {
  fetchRecordDetail();
});
</script>

<style scoped>
.record-detail-container {
  width: 100%;
}
</style> 