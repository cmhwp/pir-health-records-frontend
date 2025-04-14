<template>
  <div>
    <a-descriptions title="记录详情" bordered :column="2">
      <a-descriptions-item label="记录标题">{{ record.title }}</a-descriptions-item>
      <a-descriptions-item label="记录类型">
        <a-tag :color="getRecordTypeColor(record.record_type)">
          {{ getRecordTypeLabel(record.record_type) }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="患者姓名">{{ record.patient_name }}</a-descriptions-item>
      <a-descriptions-item label="创建日期">{{ formatDate(record.created_at) }}</a-descriptions-item>
      <a-descriptions-item label="记录日期">{{ formatDate(record.record_date) }}</a-descriptions-item>
      <a-descriptions-item label="更新日期">{{ formatDate(record.updated_at) }}</a-descriptions-item>
      <a-descriptions-item label="记录医生">{{ record.doctor_name || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="科室">{{ record.department || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="医院">{{ record.hospital || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="加密状态">
        <a-tag :color="record.is_encrypted ? 'green' : 'blue'">
          {{ record.is_encrypted ? '已加密' : '未加密' }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="可见性" :span="2">
        <a-tag :color="getVisibilityColor(record.visibility)">
          {{ getVisibilityLabel(record.visibility) }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="描述" :span="2">
        {{ record.description || '无描述' }}
      </a-descriptions-item>
      <a-descriptions-item label="标签" :span="2">
        <template v-if="record.tags">
          <a-tag 
            v-for="(tag, index) in record.tags.split(',')" 
            :key="index"
            color="blue"
            style="margin-bottom: 4px;"
          >
            {{ tag.trim() }}
          </a-tag>
        </template>
        <template v-else>无标签</template>
      </a-descriptions-item>
    </a-descriptions>

    <!-- 文件列表 -->
    <template v-if="record.files && record.files.length > 0">
      <a-divider />
      <h3>相关文件</h3>
      <a-list
        item-layout="horizontal"
        :data-source="record.files"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="item.file_name"
              :description="`类型: ${item.file_type} | 大小: ${formatFileSize(item.file_size)} | 上传时间: ${formatDate(item.uploaded_at)}`"
            >
              <template #avatar>
                <a-avatar :icon="getFileIcon(item.file_type)" />
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-button 
                type="primary" 
                size="small" 
                :disabled="record.is_encrypted" 
                @click="downloadFile(item)"
              >
                <download-outlined /> 下载
              </a-button>
            </template>
            <div v-if="item.description" class="file-description">
              <a-typography-paragraph>
                <info-circle-outlined /> 描述: {{ item.description }}
              </a-typography-paragraph>
            </div>
          </a-list-item>
        </template>
      </a-list>
      <a-alert
        v-if="record.is_encrypted"
        message="文件已加密"
        description="这些文件已加密存储，需要解密记录后才能下载和查看。"
        type="info"
        show-icon
        style="margin-top: 16px"
      />
    </template>

    <!-- 记录具体内容 -->
    <template v-if="record.data">
      <a-divider />
      <h3>记录内容</h3>
      
      <!-- 如果是药物记录，显示药物信息 -->
      <template v-if="record.record_type === 'medication' && record.medication">
        <a-descriptions bordered :column="2">
          <a-descriptions-item label="药物名称">{{ record.medication.medication_name }}</a-descriptions-item>
          <a-descriptions-item label="剂量">{{ record.medication.dosage || '未指定' }}</a-descriptions-item>
          <a-descriptions-item label="频率">{{ record.medication.frequency || '未指定' }}</a-descriptions-item>
          <a-descriptions-item label="开始日期">{{ formatDate(record.medication.start_date) }}</a-descriptions-item>
          <a-descriptions-item label="结束日期" :span="2">{{ formatDate(record.medication.end_date) }}</a-descriptions-item>
          <a-descriptions-item label="说明" :span="2">{{ record.medication.instructions || '无说明' }}</a-descriptions-item>
          <a-descriptions-item label="副作用" :span="2">{{ record.medication.side_effects || '无副作用记录' }}</a-descriptions-item>
        </a-descriptions>
      </template>
      
      <!-- 如果是生命体征记录，显示体征数据 -->
      <template v-else-if="record.record_type === 'vital_signs' && record.vital_signs">
        <a-table
          :columns="vitalSignColumns"
          :data-source="record.vital_signs"
          :pagination="false"
          bordered
        />
      </template>
      
      <!-- 其它记录类型，显示通用数据 -->
      <template v-else>
        <a-collapse ghost>
          <a-collapse-panel key="1" header="记录数据详情">
            <pre class="data-container">{{ JSON.stringify(record.data, null, 2) }}</pre>
          </a-collapse-panel>
        </a-collapse>
      </template>
    </template>

    <div class="action-footer">
      <a-button @click="$emit('close')">关闭</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import dayjs from 'dayjs';
import { 
  DownloadOutlined, 
  InfoCircleOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileUnknownOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

// 生命体征表格列定义
const vitalSignColumns = [
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
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
];

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '未设置';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 获取记录类型颜色
const getRecordTypeColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    general: 'blue',
    laboratory: 'cyan',
    medication: 'orange',
    imaging: 'purple',
    vital_signs: 'green',
    surgery: 'red',
    vaccination: 'gold',
    allergy: 'magenta',
    diagnosis: 'volcano',
    other: 'default'
  };
  return colorMap[type] || 'default';
};

// 获取记录类型标签
const getRecordTypeLabel = (type: string) => {
  const labelMap: { [key: string]: string } = {
    general: '一般记录',
    laboratory: '实验室检查',
    medication: '药物治疗',
    imaging: '影像检查',
    vital_signs: '生命体征',
    surgery: '手术记录',
    vaccination: '疫苗接种',
    allergy: '过敏记录',
    diagnosis: '诊断记录',
    other: '其他'
  };
  return labelMap[type] || type;
};

// 获取可见性颜色
const getVisibilityColor = (visibility: string) => {
  const colorMap: { [key: string]: string } = {
    private: 'red',
    doctor: 'green',
    public: 'blue',
    researcher: 'purple'
  };
  return colorMap[visibility] || 'default';
};

// 获取可见性标签
const getVisibilityLabel = (visibility: string) => {
  const labelMap: { [key: string]: string } = {
    private: '私密',
    doctor: '医生可见',
    public: '公开',
    researcher: '研究人员可见'
  };
  return labelMap[visibility] || visibility;
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 KB';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// 获取文件图标
const getFileIcon = (fileType: string) => {
  if (!fileType) return FileUnknownOutlined;
  
  const iconMap: { [key: string]: any } = {
    'doc': FileWordOutlined,
    'docx': FileWordOutlined,
    'xls': FileExcelOutlined,
    'xlsx': FileExcelOutlined,
    'pdf': FilePdfOutlined,
    'jpg': FileImageOutlined,
    'jpeg': FileImageOutlined,
    'png': FileImageOutlined,
    'txt': FileTextOutlined,
  };
  
  return iconMap[fileType.toLowerCase()] || FileUnknownOutlined;
};

// 下载文件（实际应用中通过调用API获取文件链接）
const downloadFile = (file: any) => {
  if (props.record.is_encrypted) {
    message.warning('记录已加密，请先解密后再下载文件');
    return;
  }
  
  message.info(`正在请求下载: ${file.file_name}`);
  // 实际应用中应调用后端API获取文件链接
  // window.open(getFileDownloadUrl(file.file_path));
};
</script>

<style scoped>
.data-container {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}

.action-footer {
  margin-top: 24px;
  text-align: right;
}

.file-description {
  margin-left: 16px;
  max-width: 400px;
  color: rgba(0, 0, 0, 0.45);
}
</style> 