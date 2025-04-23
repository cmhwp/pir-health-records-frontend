<template>
  <div class="record-detail-content">
    <a-page-header
      title="健康记录详情"
      :sub-title="record?.title || '加载中...'"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-tag v-if="record && 'is_encrypted' in record && record.is_encrypted" color="purple">加密记录</a-tag>
          <a-tag v-if="record && 'visibility' in record && record.visibility === 'researcher'" color="green">研究可见</a-tag>
          <a-tag v-if="record?.record_type" color="blue">{{ getRecordTypeLabel(record.record_type) }}</a-tag>
        </a-space>
      </template>
    </a-page-header>

    <a-divider />

    <a-spin :spinning="loading">
      <div v-if="record" class="record-detail">
        <a-descriptions title="基本信息" bordered :column="{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }">
          <a-descriptions-item label="记录ID">{{ record._id }}</a-descriptions-item>
          <a-descriptions-item label="记录标题">{{ record.title }}</a-descriptions-item>
          <a-descriptions-item label="记录类型">{{ getRecordTypeLabel(record.record_type) }}</a-descriptions-item>
          <a-descriptions-item label="创建日期">{{ formatDate(record.created_at) }}</a-descriptions-item>
          <a-descriptions-item label="更新日期" span="2">{{ record.updated_at ? formatDate(record.updated_at) : '无更新' }}</a-descriptions-item>
          <a-descriptions-item label="医生姓名">{{ record.doctor_name || '未知' }}</a-descriptions-item>
          <a-descriptions-item label="患者姓名">匿名患者</a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <a-card title="记录内容" class="content-card">
          <a-descriptions bordered :column="1">
            <a-descriptions-item label="描述">{{ record.description || '无描述' }}</a-descriptions-item>
            
            <!-- 根据记录类型显示不同内容 -->
            <template v-if="record.record_type === 'medical_visit'">
              <a-descriptions-item label="就诊科室">{{ record.data?.department || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="主诉">{{ record.data?.chief_complaint || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="就诊结果">{{ record.data?.conclusion || '未记录' }}</a-descriptions-item>
            </template>
            
            <template v-else-if="record.record_type === 'diagnosis'">
              <a-descriptions-item label="诊断结果">{{ record.data?.diagnosis || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="严重程度">{{ record.data?.severity || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="诊断依据">{{ record.data?.basis || '未记录' }}</a-descriptions-item>
            </template>
            
            <template v-else-if="record.record_type === 'lab_test'">
              <a-descriptions-item label="检验项目">{{ record.data?.test_name || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="检验结果">{{ record.data?.result || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="参考范围">{{ record.data?.reference_range || '未记录' }}</a-descriptions-item>
              <a-descriptions-item label="异常标记">{{ record.data?.is_abnormal ? '异常' : '正常' }}</a-descriptions-item>
            </template>
            
            <template v-else-if="record.record_type === 'prescription'">
              <a-descriptions-item label="药物清单">
                <a-list
                  v-if="record.data?.medications && record.data.medications.length > 0"
                  size="small"
                  bordered
                  :data-source="record.data.medications"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-descriptions size="small" :column="1">
                        <a-descriptions-item label="药品名称">{{ item.name }}</a-descriptions-item>
                        <a-descriptions-item label="规格">{{ item.specification }}</a-descriptions-item>
                        <a-descriptions-item label="用法用量">{{ item.dosage }}</a-descriptions-item>
                        <a-descriptions-item label="频次">{{ item.frequency }}</a-descriptions-item>
                        <a-descriptions-item label="疗程">{{ item.duration }}</a-descriptions-item>
                      </a-descriptions>
                    </a-list-item>
                  </template>
                </a-list>
                <span v-else>无处方记录</span>
              </a-descriptions-item>
            </template>
            
            <!-- 生命体征数据展示 -->
            <template v-else-if="record.record_type === 'VITAL_SIGN' || (record.vital_signs && record.vital_signs.length > 0)">
              <a-descriptions-item label="生命体征数据">
                <a-table
                  v-if="record.vital_signs && record.vital_signs.length > 0"
                  :dataSource="record.vital_signs"
                  :columns="vitalSignColumns"
                  size="small"
                  :pagination="false"
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
                <span v-else>无生命体征数据</span>
              </a-descriptions-item>
            </template>
          </a-descriptions>
        </a-card>

        <a-divider />

        <!-- 附件列表 -->
        <a-card v-if="record.files && record.files.length > 0" title="附件资料" class="files-card">
          <a-list
            :data-source="record.files"
            :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 6 }"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-card hoverable>
                  <template #cover v-if="isImageFile(item.file_type)">
                    <div class="file-preview">
                      <img alt="文件预览" :src="item.url" />
                    </div>
                  </template>
                  <template #cover v-else>
                    <div class="file-icon">
                      <file-pdf-outlined v-if="item.file_type === 'pdf'" />
                      <file-word-outlined v-else-if="item.file_type === 'doc' || item.file_type === 'docx'" />
                      <file-excel-outlined v-else-if="item.file_type === 'xls' || item.file_type === 'xlsx'" />
                      <file-outlined v-else />
                    </div>
                  </template>
                  <a-card-meta :title="item.file_name">
                    <template #description>
                      <div>{{ formatFileSize(item.file_size) }}</div>
                      <a-button type="link" size="small" @click="downloadFile(item)">
                        <download-outlined /> 下载
                      </a-button>
                    </template>
                  </a-card-meta>
                </a-card>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <!-- 标签信息 -->
        <a-card v-if="record.tags" title="标签" class="tags-card" :bordered="false">
          <div class="tags-container">
            <template v-if="Array.isArray(record.tags)">
              <a-tag v-for="tag in record.tags" :key="tag" color="blue" class="tag-item">{{ tag }}</a-tag>
            </template>
            <template v-else>
              <a-tag color="blue" class="tag-item">{{ record.tags }}</a-tag>
            </template>
          </div>
        </a-card>
      </div>

      <a-empty v-else-if="!loading" description="未找到记录或无权限访问" />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import { getRecordDetails } from '@/api/researcher';
import type { HealthRecord } from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';
const route = useRoute();
const router = useRouter();
const loading = ref<boolean>(true);
const record = ref<HealthRecord | null>(null);

// 记录类型定义
const { recordTypeOptions } = useRecordTypes();

// 生命体征表格列定义
const vitalSignColumns = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: '25%'
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
    width: '25%'
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
    width: '15%'
  },
  {
    title: '测量时间',
    dataIndex: 'measured_at',
    key: 'measured_at',
    width: '35%'
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
  return typeMap[type] || type;
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

// 获取记录详情
const fetchRecordDetails = async () => {
  const recordId = route.params.id as string;
  if (!recordId) {
    message.error('记录ID无效');
    goBack();
    return;
  }
  
  loading.value = true;
  try {
    const response = await getRecordDetails(recordId);
    console.log(response);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      message.error(response.message || '获取记录详情失败');
    }
  } catch (error) {
    console.error('获取记录详情失败:', error);
    message.error('获取记录详情失败');
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 获取记录类型标签
const getRecordTypeLabel = (type: string): string => {
  // 检查是否是内置记录类型
  const recordType = recordTypeOptions.value.find(t => t.value === type);
  if (recordType) {
    return recordType.label;
  }
  
  // 转换内部枚举类型为可读格式
  if (type) {
    // 将下划线格式转换为空格分隔的首字母大写格式
    return type.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return type || '未知类型';
};

// 判断是否为图片文件
const isImageFile = (fileType: string): boolean => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageTypes.includes(fileType.toLowerCase());
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// 下载文件
const downloadFile = (file: any) => {
  if (!file.url) {
    message.error('文件链接不存在');
    return;
  }
  
  const link = document.createElement('a');
  link.href = file.url;
  link.target = '_blank';
  link.download = file.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchRecordDetails();
});
</script>

<style scoped>
.record-detail-content {
  padding: 16px;
  background-color: #f5f5f5;
}

.content-card,
.files-card,
.tags-card {
  margin-bottom: 24px;
}

.json-data {
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}

.file-preview {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #f0f0f0;
}

.file-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.file-icon {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  font-size: 48px;
  color: #1890ff;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style> 