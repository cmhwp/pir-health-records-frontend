<template>
  <div>
    <a-spin :spinning="loading">
      <template v-if="recordData">
        <a-descriptions bordered :column="1" size="middle">
          <a-descriptions-item label="记录标题">{{ recordData.title }}</a-descriptions-item>
          <a-descriptions-item label="记录类型">
            <a-tag :color="getRecordTypeColor(recordData.record_type)">
              {{ getRecordTypeLabel(recordData.record_type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="患者信息">{{ recordData.patient_name }}</a-descriptions-item>
          <a-descriptions-item label="记录日期">{{ formatDate(recordData.record_date) }}</a-descriptions-item>
          <a-descriptions-item label="记录描述">{{ recordData.description || '无' }}</a-descriptions-item>
          <a-descriptions-item label="可见性">
            <a-tag :color="getVisibilityColor(recordData.visibility)">
              {{ getVisibilityLabel(recordData.visibility) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标签">
            <template v-if="recordData.tags">
              <a-tag v-for="tag in recordData.tags.split(',')" :key="tag" color="blue">
                {{ tag.trim() }}
              </a-tag>
            </template>
            <template v-else>无</template>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(recordData.created_at) }}</a-descriptions-item>
          <a-descriptions-item label="加密状态">
            <a-tag :color="recordData.is_encrypted ? 'green' : 'blue'">
              {{ recordData.is_encrypted ? '已加密' : '未加密' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 记录内容区域 -->
        <a-divider>记录内容</a-divider>

        <a-alert 
          v-if="recordData.is_encrypted && !decrypted" 
          message="此记录已加密" 
          description="请输入解密密钥以查看完整内容" 
          type="info" 
          show-icon 
          style="margin-bottom: 16px"
        />

        <template v-if="recordData.is_encrypted && !decrypted">
          <a-form layout="inline">
            <a-form-item label="解密密钥">
              <a-input-password v-model:value="decryptKey" placeholder="请输入解密密钥" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" :loading="decrypting" @click="handleDecrypt">解密</a-button>
            </a-form-item>
          </a-form>
        </template>

        <template v-else>
          <!-- 根据记录类型显示不同的内容 -->
          <div v-if="recordData.record_type === 'laboratory'">
            <a-card title="检验结果" style="margin-bottom: 16px">
              <template v-if="recordData.data && recordData.data.results">
                <a-table 
                  :dataSource="recordData.data.results" 
                  :pagination="false"
                  :columns="labResultColumns"
                />
              </template>
              <a-empty v-else description="无检验结果数据" />
            </a-card>
          </div>

          <div v-else-if="recordData.record_type === 'PRESCRIPTION'">
            <a-card title="用药信息" style="margin-bottom: 16px">
              <a-descriptions bordered :column="1">
                <a-descriptions-item v-if="recordData.data?.medication_name" label="药物名称">
                  {{ recordData.data.medication_name }}
                </a-descriptions-item>
                <a-descriptions-item v-if="recordData.data?.dosage" label="剂量">
                  {{ recordData.data.dosage }}
                </a-descriptions-item>
                <a-descriptions-item v-if="recordData.data?.frequency" label="频率">
                  {{ recordData.data.frequency }}
                </a-descriptions-item>
                <a-descriptions-item v-if="recordData.data?.duration" label="用药时长">
                  {{ recordData.data.duration }}
                </a-descriptions-item>
                <a-descriptions-item v-if="recordData.data?.instructions" label="用药说明">
                  {{ recordData.data.instructions }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </div>

          <div v-else-if="recordData.record_type === 'imaging'">
            <a-card title="影像信息" style="margin-bottom: 16px">
              <div v-if="recordData.data?.findings" class="content-section">
                <h4>诊断发现:</h4>
                <p>{{ recordData.data.findings }}</p>
              </div>
              <div v-if="recordData.data?.impression" class="content-section">
                <h4>总体印象:</h4>
                <p>{{ recordData.data.impression }}</p>
              </div>
            </a-card>
          </div>

          <!-- 生命体征数据 -->
          <div v-else-if="recordData.record_type === 'VITAL_SIGN' || (recordData.vital_signs && recordData.vital_signs.length > 0)">
            <a-card title="生命体征数据" style="margin-bottom: 16px">
              <a-table
                v-if="recordData.vital_signs && recordData.vital_signs.length > 0"
                :dataSource="recordData.vital_signs"
                :columns="vitalSignColumns"
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
              <a-empty v-else description="无生命体征数据" />
            </a-card>
          </div>

          <!-- 附件文件列表 -->
          <a-divider>附件文件</a-divider>
          <a-list 
            v-if="recordData.files && recordData.files.length > 0" 
            :dataSource="recordData.files"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <template #actions>
                  <a-button type="link" @click="downloadFile(item)">
                    <download-outlined /> 下载
                  </a-button>
                  <a-button v-if="canPreviewFile(item)" type="link" @click="previewFile(item)">
                    <eye-outlined /> 预览
                  </a-button>
                </template>
                <a-list-item-meta>
                  <template #title>{{ item.filename }}</template>
                  <template #description>
                    <span>{{ formatFileSize(item.size) }} | {{ item.mime_type }}</span>
                  </template>
                  <template #avatar>
                    <file-outlined />
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
          <a-empty v-else description="无附件文件" />
        </template>

        <!-- 底部按钮 -->
        <div style="margin-top: 24px; text-align: right;">
          <a-button type="primary" @click="handleClose">关闭</a-button>
        </div>
      </template>

      <a-empty v-else-if="!loading" description="无法加载记录详情" />
    </a-spin>

    <!-- 文件预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="文件预览"
      width="800px"
      footer={null}
      @cancel="previewVisible = false"
    >
      <div v-if="previewType === 'image'" class="preview-container">
        <img :src="previewUrl" style="max-width: 100%; max-height: 80vh;" />
      </div>
      <div v-else-if="previewType === 'pdf'" class="preview-container">
        <iframe :src="previewUrl" style="width: 100%; height: 80vh; border: none;"></iframe>
      </div>
      <div v-else class="preview-container">
        <p>无法预览该类型文件，请下载后查看</p>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, defineProps, defineEmits, h } from 'vue';
import { message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import { FileOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import { decryptRecord } from '@/api/doctor';
import type { RecordType, RecordVisibility } from '@/types/health';

// 组件属性
const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

// 组件事件
const emit = defineEmits(['close']);

// 状态变量
const loading = ref(false);
const recordData = ref<any>(null);
const decrypted = ref(false);
const decryptKey = ref('');
const decrypting = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewType = ref('');

// 实验室结果列定义
const labResultColumns = [
  {
    title: '检验项目',
    dataIndex: 'item',
    key: 'item',
  },
  {
    title: '结果',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '参考值',
    dataIndex: 'reference',
    key: 'reference',
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: { text: string }) => {
      const color = text === 'normal' ? 'green' : text === 'high' ? 'red' : text === 'low' ? 'orange' : 'blue';
      const label = text === 'normal' ? '正常' : text === 'high' ? '偏高' : text === 'low' ? '偏低' : text;
      return h(Tag, { color }, label);
    },
  },
];

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

// 记录数据
const initRecordData = () => {
  recordData.value = props.record;
  // 检查记录是否已解密
  decrypted.value = !recordData.value.is_encrypted || (recordData.value.data && Object.keys(recordData.value.data).length > 0);
};

// 解密记录
const handleDecrypt = async () => {
  if (!decryptKey.value) {
    message.error('请输入解密密钥');
    return;
  }

  decrypting.value = true;
  try {
    const response = await decryptRecord(recordData.value.mongo_id, { encryption_key: decryptKey.value });
    if (response.success && response.data) {
      recordData.value = response.data.record;
      decrypted.value = true;
      message.success('解密成功');
      decryptKey.value = '';
    } else {
      message.error(response.message || '解密失败');
    }
  } catch (error: any) {
    message.error(error.message || '解密过程发生错误');
  } finally {
    decrypting.value = false;
  }
};

// 下载文件
const downloadFile = async (file: any) => {
  try {
    // 模拟下载实现
    message.success(`正在下载文件: ${file.filename}`);
    // 实际项目中应该调用API获取下载链接
    // const response = await getRecordFileUrl(recordData.value.mongo_id, file.id);
    // if (response.success && response.data?.download_url) {
    //   window.open(response.data.download_url, '_blank');
    // } else {
    //   message.error(response.message || '获取下载链接失败');
    // }
  } catch (error: any) {
    message.error(error.message || '下载文件失败');
  }
};

// 预览文件
const previewFile = async (file: any) => {
  if (!canPreviewFile(file)) {
    message.warning('该文件类型不支持在线预览');
    return;
  }

  try {
    // 模拟预览实现
    previewUrl.value = 'https://example.com/preview';
    
    if (file.mime_type.startsWith('image/')) {
      previewType.value = 'image';
    } else if (file.mime_type === 'application/pdf') {
      previewType.value = 'pdf';
    } else {
      previewType.value = 'other';
    }
    
    previewVisible.value = true;
    // 实际项目中应该调用API获取预览链接
    // const response = await getRecordFileUrl(recordData.value.mongo_id, file.id);
    // if (response.success && response.data?.download_url) {
    //   previewUrl.value = response.data.download_url;
    //   ...
  } catch (error: any) {
    message.error(error.message || '预览文件失败');
  }
};

// 检查文件是否可预览
const canPreviewFile = (file: any) => {
  const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  return previewableTypes.includes(file.mime_type);
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取记录类型颜色
const getRecordTypeColor = (type: RecordType) => {
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
const getRecordTypeLabel = (type: RecordType) => {
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
const getVisibilityColor = (visibility: RecordVisibility) => {
  const colorMap: { [key: string]: string } = {
    private: 'red',
    doctor: 'green',
    public: 'blue',
    researcher: 'purple'
  };
  return colorMap[visibility] || 'default';
};

// 获取可见性标签
const getVisibilityLabel = (visibility: RecordVisibility) => {
  const labelMap: { [key: string]: string } = {
    private: '私密',
    doctor: '医生可见',
    public: '公开',
    researcher: '研究人员可见'
  };
  return labelMap[visibility] || visibility;
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '未设置';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 关闭详情
const handleClose = () => {
  emit('close');
};

// 组件挂载时初始化数据
onMounted(() => {
  initRecordData();
});
</script>

<style scoped>
.content-section {
  margin-bottom: 16px;
}

.content-section h4 {
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style> 