<template>
  <div>
    <a-card class="card-container">
      <template #title>
        <div class="card-title">
          <medicine-box-outlined /> 医疗记录管理
        </div>
      </template>
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <plus-outlined /> 创建加密记录
        </a-button>
      </template>

      <!-- 筛选和搜索区域 -->
      <a-form layout="inline" class="search-form">
        <a-form-item label="记录类型">
          <a-select
            v-model:value="filterParams.record_type"
            style="width: 150px"
            placeholder="选择记录类型"
            allow-clear
          >
            <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时间范围">
          <a-range-picker 
            v-model:value="dateRange" 
            format="YYYY-MM-DD" 
            @change="handleDateRangeChange"
            style="width: 240px"
          />
        </a-form-item>
        <a-form-item label="患者查询">
          <a-select
            v-model:value="filterParams.patient_id"
            style="width: 180px"
            placeholder="选择患者"
            allow-clear
            show-search
            :filter-option="filterPatientOption"
          >
            <a-select-option v-for="patient in patientsList" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="loadRecords">
            <search-outlined /> 查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">
            <reload-outlined /> 重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 医疗记录表格 -->
      <a-table
        :dataSource="records"
        :columns="columns"
        :loading="loading"
        rowKey="id"
        :pagination="false"
        :scroll="{ x: 1100 }"
      >
        <!-- 记录类型 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'record_type'">
            <a-tag :color="getRecordTypeColor(record.record_type)">
              {{ getRecordTypeLabel(record.record_type) }}
            </a-tag>
          </template>
          
          <!-- 加密状态 -->
          <template v-if="column.dataIndex === 'is_encrypted'">
            <a-tag :color="record.is_encrypted ? 'green' : 'blue'">
              {{ record.is_encrypted ? '已加密' : '未加密' }}
            </a-tag>
          </template>
          
          <!-- 可见性 -->
          <template v-if="column.dataIndex === 'visibility'">
            <a-tag :color="getVisibilityColor(record.visibility)">
              {{ getVisibilityLabel(record.visibility) }}
            </a-tag>
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewRecord(record)">
                <eye-outlined /> 查看
              </a-button>
              <a-button type="link" size="small" @click="editRecord(record)">
                <edit-outlined /> 编辑
              </a-button>
              <a-button v-if="record.is_encrypted" type="link" size="small" @click="showDecryptModal(record)">
                <unlock-outlined /> 解密
              </a-button>
              <a-button type="link" size="small" @click="showVerifyModal(record)">
                <safety-outlined /> 验证合规
              </a-button>
              <a-button type="link" size="small" @click="showAuditLogs(record)">
                <history-outlined /> 审计日志
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <a-pagination
          v-model:current="currentPage"
          :total="pagination.total"
          :pageSize="filterParams.per_page"
          show-size-changer
          show-quick-jumper
          @change="handlePageChange"
          @showSizeChange="handleSizeChange"
        />
      </div>

      <!-- 创建记录模态框 -->
      <a-modal
        v-model:visible="createModalVisible"
        title="创建加密健康记录"
        width="700px"
        :footer="null"
      >
        <create-record-form @success="handleCreateSuccess" @cancel="createModalVisible = false" />
      </a-modal>

      <!-- 查看记录模态框 -->
      <a-modal
        v-model:visible="viewModalVisible"
        title="查看健康记录"
        width="700px"
        :footer="null"
      >
        <view-record-detail 
          :record="currentRecord" 
          @close="viewModalVisible = false" 
        />
      </a-modal>

      <!-- 编辑记录模态框 -->
      <a-modal
        v-model:visible="editModalVisible"
        title="编辑健康记录"
        width="700px"
        :footer="null"
      >
        <edit-record-form 
          :record="currentRecord" 
          @success="handleEditSuccess" 
          @cancel="editModalVisible = false" 
        />
      </a-modal>

      <!-- 解密记录模态框 -->
      <a-modal
        v-model:visible="decryptModalVisible"
        title="解密健康记录"
        :footer="null"
      >
        <a-form layout="vertical">
          <a-form-item label="解密密钥" required>
            <a-input-password v-model:value="decryptKey" placeholder="请输入解密密钥" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="decrypting" @click="handleDecryptRecord">解密</a-button>
            <a-button style="margin-left: 8px" @click="decryptModalVisible = false">取消</a-button>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 验证合规性模态框 -->
      <a-modal
        v-model:visible="verifyModalVisible"
        title="验证记录合规性"
        :footer="null"
      >
        <a-spin :spinning="verifying">
          <div v-if="verificationResult">
            <a-result
              :status="verificationResult.verification.compliance ? 'success' : 'error'"
              :title="verificationResult.verification.compliance ? '记录符合合规要求' : '记录不符合合规要求'"
            >
              <template #extra>
                <a-button type="primary" @click="verifyModalVisible = false">确定</a-button>
              </template>
              <div class="result-content">
                <a-descriptions title="合规性检查结果" bordered>
                  <a-descriptions-item label="完整性验证">
                    <a-tag :color="verificationResult.verification.integrity ? 'success' : 'error'">
                      {{ verificationResult.verification.integrity ? '通过' : '失败' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="必填字段">
                    <a-tag :color="verificationResult.verification.has_required_fields ? 'success' : 'error'">
                      {{ verificationResult.verification.has_required_fields ? '通过' : '失败' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="医生信息">
                    <a-tag :color="verificationResult.verification.has_doctor_info ? 'success' : 'error'">
                      {{ verificationResult.verification.has_doctor_info ? '通过' : '失败' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="隐私合规">
                    <a-tag :color="verificationResult.verification.privacy_compliance ? 'success' : 'error'">
                      {{ verificationResult.verification.privacy_compliance ? '通过' : '失败' }}
                    </a-tag>
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </a-result>
          </div>
          <div v-else-if="!verifying">
            <p>对于加密的记录，需要提供解密密钥进行验证：</p>
            <a-form layout="vertical">
              <a-form-item label="解密密钥">
                <a-input-password v-model:value="verifyKey" placeholder="请输入解密密钥（如记录未加密可不填）" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="verifyCompliance">验证合规性</a-button>
                <a-button style="margin-left: 8px" @click="verifyModalVisible = false">取消</a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-spin>
      </a-modal>

      <!-- 审计日志模态框 -->
      <a-modal
        v-model:visible="auditLogsModalVisible"
        title="健康记录审计日志"
        width="800px"
        :footer="null"
      >
        <a-spin :spinning="loadingAuditLogs">
          <div v-if="auditLogs.length > 0">
            <a-timeline>
              <a-timeline-item 
                v-for="(log, index) in auditLogs" 
                :key="index"
                :color="getLogTypeColor(log.type, log.action)"
              >
                <template #dot>
                  <component :is="getLogTypeIcon(log.type, log.action)" style="font-size: 16px;" />
                </template>
                <div class="log-item">
                  <div class="log-title">{{ log.action }}</div>
                  <div class="log-meta">
                    <span>{{ formatDate(log.timestamp) }}</span>
                    <a-tag>{{ log.user_name || '系统' }}</a-tag>
                    <a-tag color="blue">{{ log.user_role || '-' }}</a-tag>
                    <a-tag v-if="log.is_anonymous" color="green">匿名访问</a-tag>
                  </div>
                  <div v-if="log.details" class="log-details">
                    <a-collapse ghost>
                      <a-collapse-panel key="1" header="详细信息">
                        <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
                      </a-collapse-panel>
                    </a-collapse>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>
          <a-empty v-else description="暂无审计日志" />
          <div class="modal-footer">
            <a-button type="primary" @click="auditLogsModalVisible = false">关闭</a-button>
          </div>
        </a-spin>
      </a-modal>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlusOutlined, EyeOutlined, EditOutlined, UnlockOutlined, 
  SafetyOutlined, HistoryOutlined, MedicineBoxOutlined,
  SearchOutlined, ReloadOutlined, FileSearchOutlined,
  EditFilled, EyeFilled, FileFilled, WarningFilled
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { 
  getDoctorRecords, 
  decryptRecord, 
  verifyRecordCompliance,
  getRecordAuditLogs
} from '@/api/doctor';
import type { 
  GetDoctorRecordsParams, 
  GetDoctorRecordsResponse,
  DecryptRecordRequest,
  VerifyComplianceRequest,
  VerifyComplianceResponse,
  AuditLog
} from '@/types/doctor';
import type { RecordType, RecordVisibility } from '@/types/health';
// Assume these components are created in separate files
// import CreateRecordForm from './CreateRecordForm.vue';
// import ViewRecordDetail from './ViewRecordDetail.vue';
// import EditRecordForm from './EditRecordForm.vue';

// Record type options
const recordTypeOptions = [
  { label: '一般记录', value: 'general' },
  { label: '实验室检查', value: 'laboratory' },
  { label: '药物治疗', value: 'medication' },
  { label: '影像检查', value: 'imaging' },
  { label: '生命体征', value: 'vital_signs' },
  { label: '手术记录', value: 'surgery' },
  { label: '疫苗接种', value: 'vaccination' },
  { label: '过敏记录', value: 'allergy' },
  { label: '诊断记录', value: 'diagnosis' },
  { label: '其他', value: 'other' },
];

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    fixed: 'left',
    width: 200,
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
    width: 120,
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patient_name',
    width: 120,
  },
  {
    title: '记录日期',
    dataIndex: 'record_date',
    key: 'record_date',
    width: 120,
    sorter: true,
  },
  {
    title: '加密状态',
    dataIndex: 'is_encrypted',
    key: 'is_encrypted',
    width: 100,
  },
  {
    title: '可见性',
    dataIndex: 'visibility',
    key: 'visibility',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150,
    sorter: true,
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    fixed: 'right',
    width: 300,
  }
];

// 状态变量
const loading = ref(false);
const records = ref<any[]>([]);
const patientsList = ref<any[]>([]);
const currentPage = ref(1);
const filterParams = reactive<GetDoctorRecordsParams>({
  page: 1,
  per_page: 10,
  sort_by: 'created_at',
  sort_order: 'desc'
});
const pagination = reactive({
  total: 0,
  pages: 0,
  has_next: false,
  has_prev: false
});
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

// 模态框状态
const createModalVisible = ref(false);
const viewModalVisible = ref(false);
const editModalVisible = ref(false);
const decryptModalVisible = ref(false);
const verifyModalVisible = ref(false);
const auditLogsModalVisible = ref(false);
const currentRecord = ref<any>(null);
const decryptKey = ref('');
const verifyKey = ref('');
const decrypting = ref(false);
const verifying = ref(false);
const verificationResult = ref<VerifyComplianceResponse | null>(null);
const loadingAuditLogs = ref(false);
const auditLogs = ref<AuditLog[]>([]);

// 初始化
onMounted(() => {
  loadRecords();
  loadPatients();
});

// 加载医疗记录列表
const loadRecords = async () => {
  loading.value = true;
  try {
    const response = await getDoctorRecords(filterParams);
    if (response.success) {
      records.value = response.data.records;
      pagination.total = response.data.pagination.total;
      pagination.pages = response.data.pagination.pages;
      pagination.has_next = response.data.pagination.has_next;
      pagination.has_prev = response.data.pagination.has_prev;
    } else {
      message.error(response.message || '获取记录失败');
    }
  } catch (error: any) {
    message.error(error.message || '获取记录发生错误');
  } finally {
    loading.value = false;
  }
};

// 加载患者列表（模拟数据，实际应从API获取）
const loadPatients = () => {
  // 在实际应用中应该从API获取患者列表
  patientsList.value = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' }
  ];
};

// 过滤患者选项
const filterPatientOption = (input: string, option: any) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 处理日期范围变化
const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates) {
    filterParams.start_date = dates[0].format('YYYY-MM-DD');
    filterParams.end_date = dates[1].format('YYYY-MM-DD');
  } else {
    filterParams.start_date = undefined;
    filterParams.end_date = undefined;
  }
};

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filterParams).forEach(key => {
    if (key !== 'page' && key !== 'per_page' && key !== 'sort_by' && key !== 'sort_order') {
      (filterParams as any)[key] = undefined;
    }
  });
  dateRange.value = null;
  filterParams.page = 1;
  loadRecords();
};

// 处理页码变化
const handlePageChange = (page: number) => {
  filterParams.page = page;
  loadRecords();
};

// 处理每页数量变化
const handleSizeChange = (current: number, size: number) => {
  filterParams.page = 1;
  filterParams.per_page = size;
  loadRecords();
};

// 显示创建记录模态框
const showCreateModal = () => {
  createModalVisible.value = true;
};

// 创建记录成功回调
const handleCreateSuccess = () => {
  createModalVisible.value = false;
  message.success('记录创建成功');
  loadRecords();
};

// 查看记录
const viewRecord = (record: any) => {
  currentRecord.value = record;
  viewModalVisible.value = true;
};

// 编辑记录
const editRecord = (record: any) => {
  currentRecord.value = record;
  editModalVisible.value = true;
};

// 编辑成功回调
const handleEditSuccess = () => {
  editModalVisible.value = false;
  message.success('记录更新成功');
  loadRecords();
};

// 显示解密模态框
const showDecryptModal = (record: any) => {
  currentRecord.value = record;
  decryptKey.value = '';
  decryptModalVisible.value = true;
};

// 解密记录
const handleDecryptRecord = async () => {
  if (!decryptKey.value) {
    message.error('请输入解密密钥');
    return;
  }
  
  decrypting.value = true;
  try {
    const response = await decryptRecord(currentRecord.value.mongo_id, { encryption_key: decryptKey.value });
    if (response.success) {
      message.success('解密成功');
      decryptModalVisible.value = false;
      // 显示解密后的记录
      currentRecord.value = response.data.record;
      viewModalVisible.value = true;
    } else {
      message.error(response.message || '解密失败');
    }
  } catch (error: any) {
    message.error(error.message || '解密过程发生错误');
  } finally {
    decrypting.value = false;
  }
};

// 显示验证合规性模态框
const showVerifyModal = (record: any) => {
  currentRecord.value = record;
  verifyKey.value = '';
  verificationResult.value = null;
  verifyModalVisible.value = true;
};

// 验证记录合规性
const verifyCompliance = async () => {
  verifying.value = true;
  
  const request: VerifyComplianceRequest = {};
  if (verifyKey.value) {
    request.encryption_key = verifyKey.value;
  }
  
  try {
    const response = await verifyRecordCompliance(currentRecord.value.mongo_id, request);
    if (response.success) {
      verificationResult.value = response.data;
      message.success('合规性验证完成');
    } else {
      message.error(response.message || '验证失败');
    }
  } catch (error: any) {
    message.error(error.message || '验证过程发生错误');
  } finally {
    verifying.value = false;
  }
};

// 显示审计日志
const showAuditLogs = async (record: any) => {
  currentRecord.value = record;
  auditLogsModalVisible.value = true;
  loadingAuditLogs.value = true;
  auditLogs.value = [];
  
  try {
    const response = await getRecordAuditLogs(record.mongo_id);
    if (response.success) {
      auditLogs.value = response.data.audit_logs;
    } else {
      message.error(response.message || '获取审计日志失败');
    }
  } catch (error: any) {
    message.error(error.message || '获取审计日志发生错误');
  } finally {
    loadingAuditLogs.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
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
  const option = recordTypeOptions.find(opt => opt.value === type);
  return option ? option.label : type;
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

// 获取日志类型颜色
const getLogTypeColor = (type: string, action: string) => {
  if (type === 'system_log') {
    if (action.includes('创建')) return 'green';
    if (action.includes('更新')) return 'blue';
    if (action.includes('验证')) return 'orange';
    if (action.includes('解密')) return 'purple';
    return 'blue';
  }
  return type === 'query' ? 'cyan' : 'gray';
};

// 获取日志类型图标
const getLogTypeIcon = (type: string, action: string) => {
  if (type === 'system_log') {
    if (action.includes('创建')) return EditFilled;
    if (action.includes('更新')) return EditFilled;
    if (action.includes('验证')) return FileFilled;
    if (action.includes('解密')) return EyeFilled;
    return FileSearchOutlined;
  }
  if (type === 'query') {
    return SearchOutlined;
  }
  return WarningFilled;
};
</script>

<style scoped>
.card-container {
  margin-bottom: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-title .anticon {
  margin-right: 8px;
  font-size: 18px;
}

.search-form {
  margin-bottom: 24px;
}

.pagination-container {
  margin-top: 16px;
  text-align: right;
}

.log-item {
  margin-bottom: 16px;
}

.log-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.log-meta {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-bottom: 8px;
}

.log-details {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
}

.modal-footer {
  text-align: right;
  margin-top: 16px;
}

.result-content {
  margin-top: 24px;
}
</style> 