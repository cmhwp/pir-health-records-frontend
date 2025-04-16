<template>
  <div class="edit-record-container">
    <a-page-header
      title="编辑健康记录"
      @back="goBack"
    />
    
    <a-spin :spinning="loading">
      <a-form
        v-if="record"
        :model="formState"
        :rules="rules"
        layout="vertical"
        ref="formRef"
      >
        <a-row :gutter="16">
          <a-col :span="16">
            <a-card title="基本信息">
              <a-form-item name="title" label="记录标题" required>
                <a-input
                  v-model:value="formState.title"
                  placeholder="请输入记录标题"
                  :maxLength="100"
                  show-count
                />
              </a-form-item>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item name="record_date" label="记录日期" required>
                    <a-date-picker
                      v-model:value="recordDate"
                      style="width: 100%"
                      :disabledDate="disabledDate"
                      @change="handleDateChange"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item name="visibility" label="可见性">
                    <a-select
                      v-model:value="formState.visibility"
                      placeholder="请选择记录可见性"
                    >
                      <a-select-option :value="RecordVisibility.PRIVATE">
                        <span style="font-weight: bold">仅自己可见</span>
                        <span style="display: block; font-size: 12px; color: #888">（最高级别隐私保护，只有您自己可以访问）</span>
                      </a-select-option>
                      <a-select-option :value="RecordVisibility.DOCTOR">
                        <span style="font-weight: bold">医生可见</span>
                        <span style="display: block; font-size: 12px; color: #888">（您和具有医生角色的用户可以访问）</span>
                      </a-select-option>
                      <a-select-option :value="RecordVisibility.RESEARCHER">
                        <span style="font-weight: bold">研究人员可见</span>
                        <span style="display: block; font-size: 12px; color: #888">（您、医生和研究人员可以访问）</span>
                      </a-select-option>
                      <a-select-option :value="RecordVisibility.PUBLIC">
                        <span style="font-weight: bold">所有人可见</span>
                        <span style="display: block; font-size: 12px; color: #888">（最低级别隐私保护，所有系统用户可以访问）</span>
                      </a-select-option>
                    </a-select>
                    <a-alert v-if="formState.visibility === RecordVisibility.PUBLIC" 
                      type="warning" 
                      message="您选择了最低级别的隐私保护，所有用户将可以看到此记录" 
                      style="margin-top: 8px"
                      show-icon />
                    <a-alert v-if="visibilityChanged" 
                      type="info" 
                      message="更改可见性将影响哪些人可以访问此记录" 
                      style="margin-top: 8px"
                      show-icon />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item name="institution" label="医疗机构">
                    <a-select
                      v-model:value="formState.institution"
                      placeholder="请选择医疗机构"
                      style="width: 100%"
                      showSearch
                      :filterOption="filterInstitution"
                      :loading="loadingInstitutions"
                    >
                      <a-select-option v-for="inst in institutionOptions" :key="inst.id" :value="inst.name">
                        {{ inst.name }}
                        <span v-if="inst.address" style="color: #999; font-size: 12px;"> ({{ inst.address }})</span>
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item name="doctor_name" label="医生姓名">
                    <a-input
                      v-model:value="formState.doctor_name"
                      placeholder="请输入医生姓名"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-form-item name="description" label="记录描述">
                <a-textarea
                  v-model:value="formState.description"
                  placeholder="请输入记录描述"
                  :rows="4"
                  :maxLength="500"
                  show-count
                />
              </a-form-item>
              
              <a-form-item name="tags" label="标签">
                <a-select
                  v-model:value="tags"
                  mode="tags"
                  style="width: 100%"
                  placeholder="输入标签，回车确认"
                  @change="handleTagsChange"
                >
                  <a-select-option v-for="tag in tagOptions" :key="tag" :value="tag">
                    {{ tag }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-card>
            
            <!-- 用药记录特定字段 -->
            <a-card v-if="record.record_type === 'medication'" title="用药信息" style="margin-top: 16px">
              <a-form-item name="medication_name" label="药物名称" required>
                <a-input
                  v-model:value="formState.medication.medication_name"
                  placeholder="请输入药物名称"
                />
              </a-form-item>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item name="dosage" label="剂量">
                    <a-input
                      v-model:value="formState.medication.dosage"
                      placeholder="请输入剂量，如100mg"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item name="frequency" label="频率">
                    <a-input
                      v-model:value="formState.medication.frequency"
                      placeholder="请输入用药频率，如每日三次"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item name="start_date" label="开始日期">
                    <a-date-picker
                      v-model:value="medicationStartDate"
                      style="width: 100%"
                      @change="handleMedicationStartDateChange"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item name="end_date" label="结束日期">
                    <a-date-picker
                      v-model:value="medicationEndDate"
                      style="width: 100%"
                      :disabled-date="disabledEndDate"
                      @change="handleMedicationEndDateChange"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-form-item name="instructions" label="用药说明">
                <a-textarea
                  v-model:value="formState.medication.instructions"
                  placeholder="请输入用药说明"
                  :rows="3"
                />
              </a-form-item>
              
              <a-form-item name="side_effects" label="副作用">
                <a-textarea
                  v-model:value="formState.medication.side_effects"
                  placeholder="请输入可能的副作用"
                  :rows="3"
                />
              </a-form-item>
            </a-card>
          </a-col>
          
          <a-col :span="8">
            <a-card title="文件">
              <a-list v-if="record.files && record.files.length > 0" size="small" bordered>
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
                      <download-outlined />
                    </a-button>
                  </template>
                </a-list-item>
              </a-list>
              <a-empty v-else description="无附件文件" />
              
              <a-divider />
              
              <p>保存后无法修改附件，如需更改请创建新版本</p>
            </a-card>
            
            <a-card title="版本控制" style="margin-top: 16px">
              <p>当前版本: v{{ record.version }}</p>
              
              <a-form-item label="版本说明" name="version_description">
                <a-textarea
                  v-model:value="versionDescription"
                  placeholder="请输入此次修改的说明（可选）"
                  :rows="3"
                />
              </a-form-item>
              
              <a-divider />
              
              <a-space style="width: 100%; justify-content: space-between">
                <a-button @click="handleCreateVersion">
                  <template #icon><branches-outlined /></template>
                  创建新版本
                </a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                  <template #icon><save-outlined /></template>
                  保存修改
                </a-button>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </a-form>
      <a-empty v-else description="记录不存在或无法加载" />
    </a-spin>
    
    <!-- 创建新版本确认 -->
    <a-modal
      v-model:visible="createVersionModalVisible"
      title="创建新版本"
      @ok="confirmCreateVersion"
      :confirm-loading="creatingVersion"
    >
      <p>创建新版本将保留当前版本并基于当前记录创建新版本。</p>
      <a-form-item label="版本说明" required>
        <a-textarea
          v-model:value="newVersionDescription"
          placeholder="请输入新版本的说明"
          :rows="3"
        />
      </a-form-item>
      <a-form-item label="变更概要">
        <a-select
          v-model:value="versionChanges"
          mode="tags"
          style="width: 100%"
          placeholder="输入变更内容，回车确认"
        />
      </a-form-item>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Form } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  BranchesOutlined,
  SaveOutlined,
  DownloadOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import {
  getHealthRecord,
  updateHealthRecord,
  createRecordVersion,
  getRecordFileUrl,
  getInstitutions
} from '@/api/health';
import {
  RecordVisibility,
  type HealthRecord,
  type UpdateRecordRequest,
  type InstitutionInfo
} from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const recordId = computed(() => route.params.id as string);

// 使用hook获取记录类型
const { getRecordTypeName } = useRecordTypes();

// 记录数据
const loading = ref(true);
const record = ref<HealthRecord | null>(null);
const saving = ref(false);

// 表单状态
const formState = reactive({
  title: '',
  description: '',
  record_date: '',
  institution: '',
  doctor_name: '',
  visibility: RecordVisibility.PRIVATE,
  tags: '',
  medication: {
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    instructions: '',
    side_effects: ''
  }
});

// 日期选择器值
const recordDate = ref<dayjs.Dayjs | null>(null);
const medicationStartDate = ref<dayjs.Dayjs | null>(null);
const medicationEndDate = ref<dayjs.Dayjs | null>(null);

// 标签
const tags = ref<string[]>([]);
const tagOptions = ref<string[]>([]);

// 版本控制
const versionDescription = ref('');
const createVersionModalVisible = ref(false);
const creatingVersion = ref(false);
const newVersionDescription = ref('');
const versionChanges = ref<string[]>([]);

// 医疗机构
const institutionOptions = ref<InstitutionInfo[]>([]);
const loadingInstitutions = ref(false);

// 监听可见性变化
const originalVisibility = ref('');
const visibilityChanged = ref(false);

// 监听表单变化
watch(() => formState.visibility, (newVal, oldVal) => {
  if (originalVisibility.value && newVal !== originalVisibility.value) {
    visibilityChanged.value = true;
  } else {
    visibilityChanged.value = false;
  }
}, { deep: true });

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入记录标题', trigger: 'blur' }],
  record_date: [{ required: true, message: '请选择记录日期', trigger: 'change' }],
  medication_name: [{ required: true, message: '请输入药物名称', trigger: 'blur' }]
};

// 过滤医疗机构选项
const filterInstitution = (input: string, option: any) => {
  return option.children[0].toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 加载医疗机构
const loadInstitutions = async () => {
  loadingInstitutions.value = true;
  try {
    const response = await getInstitutions();
    if (response.success && response.data) {
      institutionOptions.value = response.data.institutions;
    } else {
      message.error(response.message || '获取医疗机构列表失败');
    }
  } catch (error) {
    console.error('获取医疗机构列表失败:', error);
    message.error('获取医疗机构列表失败');
  } finally {
    loadingInstitutions.value = false;
  }
};

// 获取记录详情
const fetchRecordDetail = async () => {
  loading.value = true;
  try {
    const response = await getHealthRecord(recordId.value);
    if (response.success && response.data) {
      record.value = response.data.record;
      sqlId.value = response.data.sql_id;
      
      // 初始化表单值
      formState.title = record.value.title;
      formState.description = record.value.description || '';
      formState.institution = record.value.institution || '';
      formState.doctor_name = record.value.doctor_name || '';
      formState.visibility = record.value.visibility;
      formState.tags = record.value.tags || '';
      formState.record_date = record.value.record_date;
      
      // 设置原始可见性，用于比较
      originalVisibility.value = record.value.visibility;
      
      if (record.value.medication) {
        formState.medication = { ...record.value.medication };
      }
      
      // 转换标签为数组
      if (formState.tags) {
        tags.value = formState.tags.split(',').filter(tag => tag.trim().length > 0);
      }
      
      // 设置日期
      if (formState.record_date) {
        recordDate.value = dayjs(formState.record_date);
      }
      
      // 设置用药相关日期
      if (formState.medication?.start_date) {
        medicationStartDate.value = dayjs(formState.medication.start_date);
      }
      
      if (formState.medication?.end_date) {
        medicationEndDate.value = dayjs(formState.medication.end_date);
      }
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败');
  } finally {
    loading.value = false;
  }
};

// 处理日期变化
const handleDateChange = (date: dayjs.Dayjs | null) => {
  formState.record_date = date ? date.format('YYYY-MM-DD') : '';
};

// 禁用未来日期
const disabledDate = (current: dayjs.Dayjs) => {
  return current && current > dayjs().endOf('day');
};

// 处理用药开始日期变化
const handleMedicationStartDateChange = (date: dayjs.Dayjs | null) => {
  formState.medication.start_date = date ? date.format('YYYY-MM-DD') : '';
};

// 处理用药结束日期变化
const handleMedicationEndDateChange = (date: dayjs.Dayjs | null) => {
  formState.medication.end_date = date ? date.format('YYYY-MM-DD') : '';
};

// 禁用早于开始日期的结束日期
const disabledEndDate = (current: dayjs.Dayjs) => {
  return medicationStartDate.value ? current < medicationStartDate.value : false;
};

// 处理标签变化
const handleTagsChange = (values: string[]) => {
  tags.value = values;
  formState.tags = values.join(',');
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 保存记录修改
const handleSave = async () => {
  formRef.value?.validate().then(async () => {
    saving.value = true;
    try {
      // 准备更新数据
      const updateData: UpdateRecordRequest = {
        title: formState.title,
        description: formState.description,
        record_date: formState.record_date,
        institution: formState.institution,
        doctor_name: formState.doctor_name,
        visibility: formState.visibility,
        tags: formState.tags
      };
      
      // 如果是用药记录，添加用药信息
      if (record.value?.record_type === 'medication') {
        updateData.medication = formState.medication;
      }
      
      const response = await updateHealthRecord(recordId.value, updateData);
      
      if (response.success) {
        message.success('记录已成功更新');
        
        // 如果有版本说明，创建版本历史记录
        if (versionDescription.value) {
          try {
            await createRecordVersion(recordId.value, {
              description: versionDescription.value
            });
          } catch (error) {
            console.error('创建版本历史失败:', error);
            message.warning('记录已更新，但版本历史创建失败');
          }
        }
        
        // 返回记录详情页
        router.push(`/patient/record/${recordId.value}`);
      } else {
        message.error(response.message || '更新记录失败');
      }
    } catch (error) {
      console.error('更新记录失败:', error);
      message.error('更新记录失败');
    } finally {
      saving.value = false;
    }
  });
};

// 准备创建新版本
const handleCreateVersion = () => {
  newVersionDescription.value = '';
  versionChanges.value = [];
  createVersionModalVisible.value = true;
};

// 确认创建新版本
const confirmCreateVersion = async () => {
  if (!newVersionDescription.value) {
    message.warn('请输入版本说明');
    return;
  }
  
  creatingVersion.value = true;
  try {
    const response = await createRecordVersion(recordId.value, {
      description: newVersionDescription.value,
      changes: versionChanges.value.length > 0 ? versionChanges.value : undefined,
      data: {
        title: formState.title,
        description: formState.description,
        record_date: formState.record_date,
        institution: formState.institution,
        doctor_name: formState.doctor_name,
        visibility: formState.visibility,
        tags: formState.tags,
        ...(record.value?.record_type === 'medication' ? { medication: formState.medication } : {})
      }
    });
    
    if (response.success) {
      message.success('成功创建新版本');
      createVersionModalVisible.value = false;
      
      // 返回记录详情页，并显示版本标签页
      router.push(`/patient/record/${recordId.value}?tab=versions`);
    } else {
      message.error(response.message || '创建版本失败');
    }
  } catch (error) {
    console.error('创建版本失败:', error);
    message.error('创建版本失败');
  } finally {
    creatingVersion.value = false;
  }
};

// 返回记录详情页
const goBack = () => {
  router.push(`/patient/record/${recordId.value}`);
};

// 初始化
onMounted(() => {
  fetchRecordDetail();
  loadInstitutions();
});
</script>

<style scoped>
.edit-record-container {
  width: 100%;
}
</style> 