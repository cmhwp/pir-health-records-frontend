<template>
  <div>
    <a-page-header
      title="共享健康记录"
      sub-title="管理与医疗机构和医生共享的健康记录"
    />
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card>
          <template #title>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>已共享记录</span>
              <a-button type="primary" @click="showShareModal">
                <template #icon><share-alt-outlined /></template>
                共享新记录
              </a-button>
            </div>
          </template>
          
          <a-table
            :columns="columns"
            :data-source="sharedRecords"
            :loading="loading"
            :pagination="{ pageSize: 5 }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'record_type'">
                <a-tag :color="getRecordTypeColor(record.record_type)">
                  {{ getRecordTypeName(record.record_type) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'shared_with'">
                <a-tooltip v-for="person in record.shared_with" :key="person.id" :title="getPersonTitle(person)">
                  <a-avatar :style="{ backgroundColor: getAvatarColor(person.role) }">
                    {{ person.name.charAt(0) }}
                  </a-avatar>
                </a-tooltip>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="viewRecordDetails(record)">
                    查看
                  </a-button>
                  <a-popconfirm
                    title="确定要撤销共享吗?"
                    @confirm="revokeSharing(record)"
                    ok-text="确定"
                    cancel-text="取消"
                  >
                    <a-button type="link" danger size="small" :disabled="record.status === 'accessed'">
                      撤销
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 共享记录选择模态框 -->
    <a-modal
      v-model:visible="shareModalVisible"
      title="共享健康记录"
      @ok="handleShareSubmit"
      :confirm-loading="shareSubmitting"
      width="700px"
    >
      <a-form
        :model="shareForm"
        name="shareForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item
          label="选择医疗机构"
          name="institution"
          :rules="[{ required: true, message: '请选择医疗机构' }]"
        >
          <a-select
            v-model:value="shareForm.institution"
            placeholder="请选择医疗机构"
            @change="handleInstitutionChange"
          >
            <a-select-option v-for="item in institutions" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item
          label="选择医生"
          name="doctor"
          :rules="[{ required: true, message: '请选择医生' }]"
        >
          <a-select
            v-model:value="shareForm.doctor"
            placeholder="请选择医生"
            :disabled="!shareForm.institution"
          >
            <a-select-option v-for="item in doctors" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.department }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item
          label="选择记录"
          name="records"
          :rules="[{ required: true, message: '请选择至少一条记录' }]"
        >
          <a-transfer
            v-model:targetKeys="shareForm.records"
            :data-source="availableRecords"
            :titles="['可选记录', '已选记录']"
            :render="item => item.title"
            :list-style="{
              width: '250px',
              height: '300px',
            }"
          />
        </a-form-item>
        
        <a-form-item
          label="共享期限"
          name="expiry"
        >
          <a-radio-group v-model:value="shareForm.expiry">
            <a-radio :value="7">7天</a-radio>
            <a-radio :value="30">30天</a-radio>
            <a-radio :value="90">3个月</a-radio>
            <a-radio :value="180">6个月</a-radio>
            <a-radio :value="0">永久</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item
          label="授权说明"
          name="notes"
        >
          <a-textarea 
            v-model:value="shareForm.notes" 
            placeholder="请输入授权说明，例如就诊目的等" 
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 记录详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="记录详情"
      :footer="null"
      width="700px"
    >
      <template v-if="currentRecord">
        <a-descriptions bordered :column="1">
          <a-descriptions-item label="记录类型">
            {{ getRecordTypeName(currentRecord.record_type) }}
          </a-descriptions-item>
          <a-descriptions-item label="检查日期">
            {{ currentRecord.exam_date }}
          </a-descriptions-item>
          <a-descriptions-item label="医疗机构">
            {{ currentRecord.institution }}
          </a-descriptions-item>
          <a-descriptions-item label="共享对象">
            <div v-for="person in currentRecord.shared_with" :key="person.id">
              {{ person.name }} ({{ person.role === 'doctor' ? '医生' : '医疗机构' }})
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="共享状态">
            {{ getStatusText(currentRecord.status) }}
          </a-descriptions-item>
          <a-descriptions-item label="共享时间">
            {{ currentRecord.shared_at }}
          </a-descriptions-item>
          <a-descriptions-item label="访问记录" v-if="currentRecord.access_history && currentRecord.access_history.length > 0">
            <a-timeline>
              <a-timeline-item v-for="(access, index) in currentRecord.access_history" :key="index">
                {{ access.accessed_at }} - {{ access.accessor_name }} 查看了此记录
              </a-timeline-item>
            </a-timeline>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ShareAltOutlined } from '@ant-design/icons-vue';
import { 
  getSharedRecords, 
  shareHealthRecords, 
  revokeHealthRecordSharing, 
  getAvailableRecords 
} from '@/api/health-records';
import { getInstitutions, getDoctorsByInstitution } from '@/api/medical';

// 列定义
const columns = [
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
  },
  {
    title: '检查日期',
    dataIndex: 'exam_date',
    key: 'exam_date',
    sorter: (a, b) => new Date(a.exam_date) - new Date(b.exam_date)
  },
  {
    title: '医疗机构',
    dataIndex: 'institution',
    key: 'institution',
  },
  {
    title: '共享对象',
    key: 'shared_with',
  },
  {
    title: '共享状态',
    key: 'status',
  },
  {
    title: '共享时间',
    dataIndex: 'shared_at',
    key: 'shared_at',
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 数据相关
const loading = ref(false);
const sharedRecords = ref([]);
const institutions = ref([]);
const doctors = ref([]);
const availableRecords = ref([]);

// 模态框状态
const shareModalVisible = ref(false);
const shareSubmitting = ref(false);
const detailModalVisible = ref(false);
const currentRecord = ref(null);

// 共享表单
const shareForm = reactive({
  institution: undefined,
  doctor: undefined,
  records: [],
  expiry: 30,
  notes: ''
});

// 获取共享记录列表
const fetchSharedRecords = async () => {
  loading.value = true;
  try {
    const response = await getSharedRecords();
    if (response.success && response.data) {
      sharedRecords.value = response.data.records;
    }
  } catch (error) {
    console.error('获取共享记录失败:', error);
    message.error('获取共享记录失败');
  } finally {
    loading.value = false;
  }
};

// 获取机构列表
const fetchInstitutions = async () => {
  try {
    const response = await getInstitutions();
    if (response.success && response.data) {
      institutions.value = response.data.institutions;
    }
  } catch (error) {
    console.error('获取医疗机构列表失败:', error);
    message.error('获取医疗机构列表失败');
  }
};

// 获取医生列表
const handleInstitutionChange = async (institutionId) => {
  shareForm.doctor = undefined;
  doctors.value = [];
  if (!institutionId) return;
  
  try {
    const response = await getDoctorsByInstitution(institutionId);
    if (response.success && response.data) {
      doctors.value = response.data.doctors;
    }
  } catch (error) {
    console.error('获取医生列表失败:', error);
    message.error('获取医生列表失败');
  }
};

// 获取可共享记录
const fetchAvailableRecords = async () => {
  try {
    const response = await getAvailableRecords();
    if (response.success && response.data) {
      availableRecords.value = response.data.records.map(record => ({
        key: record.id,
        title: `${getRecordTypeName(record.record_type)} (${record.exam_date})`,
        description: record.institution || '未指定医疗机构',
        disabled: false
      }));
    }
  } catch (error) {
    console.error('获取可共享记录失败:', error);
    message.error('获取可共享记录失败');
  }
};

// 显示共享模态框
const showShareModal = () => {
  shareForm.institution = undefined;
  shareForm.doctor = undefined;
  shareForm.records = [];
  shareForm.expiry = 30;
  shareForm.notes = '';
  shareModalVisible.value = true;
  fetchAvailableRecords();
};

// 提交共享
const handleShareSubmit = async () => {
  if (!shareForm.institution || !shareForm.doctor || shareForm.records.length === 0) {
    message.warning('请完成所有必填项');
    return;
  }
  
  shareSubmitting.value = true;
  try {
    const response = await shareHealthRecords({
      institution_id: shareForm.institution,
      doctor_id: shareForm.doctor,
      record_ids: shareForm.records,
      expiry_days: shareForm.expiry,
      notes: shareForm.notes
    });
    
    if (response.success) {
      message.success('健康记录共享成功');
      shareModalVisible.value = false;
      fetchSharedRecords();
    } else {
      message.error(response.message || '健康记录共享失败');
    }
  } catch (error) {
    console.error('共享记录失败:', error);
    message.error('共享记录失败，请稍后重试');
  } finally {
    shareSubmitting.value = false;
  }
};

// 撤销共享
const revokeSharing = async (record) => {
  try {
    const response = await revokeHealthRecordSharing(record.id);
    if (response.success) {
      message.success('已撤销共享');
      fetchSharedRecords();
    } else {
      message.error(response.message || '撤销共享失败');
    }
  } catch (error) {
    console.error('撤销共享失败:', error);
    message.error('撤销共享失败，请稍后重试');
  }
};

// 查看记录详情
const viewRecordDetails = (record) => {
  currentRecord.value = record;
  detailModalVisible.value = true;
};

// 工具函数
const getRecordTypeName = (type) => {
  const types = {
    'general': '一般体检',
    'blood_test': '血液检查',
    'imaging': '影像检查',
    'chronic_disease': '慢性病监测',
    'treatment': '治疗记录',
    'other': '其他'
  };
  return types[type] || '未知类型';
};

const getRecordTypeColor = (type) => {
  const colors = {
    'general': 'blue',
    'blood_test': 'purple',
    'imaging': 'cyan',
    'chronic_disease': 'orange',
    'treatment': 'green',
    'other': 'default'
  };
  return colors[type] || 'default';
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '等待访问',
    'accessed': '已被访问',
    'expired': '已过期',
    'revoked': '已撤销'
  };
  return statusMap[status] || '未知状态';
};

const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'blue',
    'accessed': 'green',
    'expired': 'gray',
    'revoked': 'red'
  };
  return colorMap[status] || 'default';
};

const getPersonTitle = (person) => {
  return `${person.name} (${person.role === 'doctor' ? '医生' : '医疗机构'})`;
};

const getAvatarColor = (role) => {
  return role === 'doctor' ? '#1890ff' : '#52c41a';
};

onMounted(() => {
  fetchSharedRecords();
  fetchInstitutions();
});
</script>

<style scoped>
.ant-avatar {
  margin-right: 5px;
}
</style> 