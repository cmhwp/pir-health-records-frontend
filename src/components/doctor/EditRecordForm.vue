<template>
  <div>
    <a-form
      :model="formState"
      :rules="rules"
      layout="vertical"
      ref="formRef"
      @finish="handleSubmit"
    >
      <!-- 基本信息 -->
      <a-divider orientation="left">基本信息</a-divider>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item name="title" label="记录标题" required>
            <a-input v-model:value="formState.title" placeholder="请输入记录标题" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="record_type" label="记录类型" required>
            <a-select v-model:value="formState.record_type" placeholder="选择记录类型" disabled>
              <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item name="record_date" label="记录日期">
            <a-date-picker 
              v-model:value="formState.record_date" 
              style="width: 100%" 
              :disabledDate="disabledDate"
              placeholder="选择记录日期"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="visibility" label="记录可见性">
            <a-select v-model:value="formState.visibility" placeholder="选择记录可见性">
              <a-select-option v-for="type in visibilityOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item name="description" label="记录描述">
        <a-textarea v-model:value="formState.description" rows="4" placeholder="请输入记录描述" />
      </a-form-item>
      
      <a-form-item name="tags" label="标签">
        <a-input v-model:value="formState.tags" placeholder="多个标签用逗号分隔" />
      </a-form-item>
      
      <!-- 记录类型特定字段 -->
      <template v-if="formState.record_type === 'medication'">
        <a-divider orientation="left">药物治疗详情</a-divider>
        
        <a-form-item name="medication_name" label="药物名称">
          <a-input v-model:value="formState.data.medication_name" placeholder="请输入药物名称" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item name="dosage" label="剂量">
              <a-input v-model:value="formState.data.dosage" placeholder="例如: 100mg" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item name="frequency" label="频率">
              <a-input v-model:value="formState.data.frequency" placeholder="例如: 每日三次" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item name="duration" label="持续时间">
              <a-input v-model:value="formState.data.duration" placeholder="例如: 7天" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item name="instructions" label="用药说明">
          <a-textarea v-model:value="formState.data.instructions" rows="3" placeholder="请输入用药说明" />
        </a-form-item>
      </template>

      <template v-else-if="formState.record_type === 'laboratory'">
        <a-divider orientation="left">实验室检查详情</a-divider>
        
        <a-form-item label="检测项目">
          <a-button type="dashed" block @click="addLabItem">
            <plus-outlined /> 添加检测项目
          </a-button>
          
          <div v-for="(item, index) in labItems" :key="index" style="margin-top: 16px; border: 1px dashed #d9d9d9; padding: 16px; border-radius: 2px;">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item :label="`项目名称 ${index + 1}`" :name="['items', index, 'item']">
                  <a-input v-model:value="item.item" placeholder="例如: 血红蛋白" />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item :label="`结果值 ${index + 1}`" :name="['items', index, 'value']">
                  <a-input v-model:value="item.value" placeholder="例如: 125" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item :label="`单位 ${index + 1}`" :name="['items', index, 'unit']">
                  <a-input v-model:value="item.unit" placeholder="例如: g/L" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item :label="`状态 ${index + 1}`" :name="['items', index, 'status']">
                  <a-select v-model:value="item.status" placeholder="选择状态">
                    <a-select-option value="normal">正常</a-select-option>
                    <a-select-option value="high">偏高</a-select-option>
                    <a-select-option value="low">偏低</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="2" style="display: flex; align-items: flex-end;">
                <a-button type="danger" @click="removeLabItem(index)" style="margin-bottom: 24px;">
                  <delete-outlined />
                </a-button>
              </a-col>
            </a-row>
          </div>
        </a-form-item>
      </template>
      
      <!-- 加密选项 -->
      <a-divider orientation="left">加密选项</a-divider>
      
      <a-alert 
        v-if="recordIsEncrypted" 
        message="记录已加密" 
        description="若要更新加密记录，请提供原加密密钥。若要更改密钥，请同时填写新密钥。" 
        type="info" 
        show-icon 
        style="margin-bottom: 16px"
      />
      
      <a-form-item name="encryption_key" label="加密密钥" :required="recordIsEncrypted">
        <a-input-password v-model:value="formState.encryption_key" placeholder="请输入加密密钥" />
        <div class="form-help-text">如果记录已加密，必须提供原密钥才能更新记录</div>
      </a-form-item>

      <a-form-item name="new_encryption_key" label="新加密密钥">
        <a-input-password v-model:value="formState.new_encryption_key" placeholder="如需更改密钥，请输入新密钥" />
        <div class="form-help-text">如需更改加密密钥，请在此输入新密钥；若保持为空，则使用原密钥</div>
      </a-form-item>
      
      <!-- 提交按钮 -->
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">保存记录</a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { updateDoctorRecord } from '@/api/doctor';
import type { UpdateDoctorRecordRequest } from '@/types/doctor';
import type { RecordVisibility } from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';

// 组件属性
const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

// 组件事件
const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 记录是否已加密
const recordIsEncrypted = computed(() => props.record?.is_encrypted || false);

// 实验室检查项目
const labItems = ref<any[]>([]);

// 使用记录类型钩子
const recordTypesHook = useRecordTypes();

// 表单状态
const formState = reactive({
  title: '',
  record_type: undefined as string | undefined,
  record_date: null as Dayjs | null,
  description: '',
  visibility: undefined as RecordVisibility | undefined,
  tags: '',
  encryption_key: '',
  new_encryption_key: '',
  data: {
    // 药物记录特有字段
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    // 实验室记录特有字段
    results: [] as any[]
  }
});

// 其他状态
const submitting = ref(false);
const isEncrypted = ref(false);
const fileList = ref<any[]>([]);

// 选项数据
const recordTypeOptions = computed(() => recordTypesHook.recordTypeOptions.value);

const visibilityOptions = [
  { label: '私密', value: 'private' },
  { label: '医生可见', value: 'doctor' },
  { label: '公开', value: 'public' },
  { label: '研究人员可见', value: 'researcher' },
];

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入记录标题!' }],
  encryption_key: [{ 
    required: recordIsEncrypted, 
    message: '记录已加密，请提供原密钥!',
    validator: (_rule: any, value: string) => {
      if (recordIsEncrypted.value && !value) {
        return Promise.reject('记录已加密，请提供原密钥!');
      }
      return Promise.resolve();
    }
  }],
};

// 禁用日期选择 - 不能选择未来日期
const disabledDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day');
};

// 初始化表单数据
const initFormData = () => {
  const record = props.record;
  
  // 基本信息
  formState.title = record.title || '';
  formState.record_type = record.record_type;
  
  if (record.record_date) {
    formState.record_date = dayjs(record.record_date);
  }
  
  formState.description = record.description || '';
  formState.visibility = record.visibility || 'private';
  formState.tags = record.tags || '';
  
  // 根据记录类型初始化特定字段
  if (record.record_type === 'medication' && record.data) {
    formState.data.medication_name = record.data.medication_name || '';
    formState.data.dosage = record.data.dosage || '';
    formState.data.frequency = record.data.frequency || '';
    formState.data.duration = record.data.duration || '';
    formState.data.instructions = record.data.instructions || '';
  } else if (record.record_type === 'laboratory' && record.data && record.data.results) {
    // 初始化实验室检查项目
    labItems.value = [...(record.data.results || [])];
  }
};

// 添加实验室检查项目
const addLabItem = () => {
  labItems.value.push({
    item: '',
    value: '',
    unit: '',
    reference: '',
    status: 'normal'
  });
};

// 移除实验室检查项目
const removeLabItem = (index: number) => {
  labItems.value.splice(index, 1);
};

// 加载记录类型
const loadRecordTypes = async () => {
  try {
    await recordTypesHook.loadRecordTypes();
  } catch (error) {
    console.error('获取记录类型失败:', error);
    message.error('获取记录类型失败');
  }
};

// 处理表单提交
const handleSubmit = async () => {
  submitting.value = true;
  
  try {
    // 构建更新请求数据
    const requestData: UpdateDoctorRecordRequest = {
      record_data: {
        title: formState.title,
        description: formState.description,
        visibility: formState.visibility
      }
    };
    
    // 添加记录日期（如果有）
    if (formState.record_date) {
      requestData.record_data!.record_date = formState.record_date.format('YYYY-MM-DD');
    }
    
    // 添加标签（如果有）
    if (formState.tags) {
      requestData.record_data!.tags = formState.tags;
    }
    
    // 添加特定类型的数据
    if (formState.record_type === 'medication') {
      requestData.record_data!.data = {
        medication_name: formState.data.medication_name,
        dosage: formState.data.dosage,
        frequency: formState.data.frequency,
        duration: formState.data.duration,
        instructions: formState.data.instructions
      };
    } else if (formState.record_type === 'laboratory') {
      requestData.record_data!.data = {
        results: labItems.value
      };
    }
    
    // 如果记录已加密或需要加密，添加加密密钥
    if (formState.encryption_key) {
      requestData.encryption_key = formState.encryption_key;
    }
    
    // 如果需要更新密钥，添加新密钥
    if (formState.new_encryption_key) {
      requestData.encryption_key = formState.new_encryption_key; // 使用已有的加密密钥字段
    }
    
    // 发送更新请求
    const response = await updateDoctorRecord(props.record.mongo_id, requestData);
    
    if (response.success) {
      message.success('记录更新成功');
      emit('success');
    } else {
      message.error(response.message || '更新记录失败');
    }
  } catch (error: any) {
    console.error('更新记录失败:', error);
    message.error(error.message || '更新记录失败');
  } finally {
    submitting.value = false;
  }
};

// 取消编辑
const handleCancel = () => {
  emit('cancel');
};

// 在实验室检查类型和其他类型间切换时，更新数据字段
watch(
  () => formState.record_type,
  (newType) => {
    if (newType === 'laboratory') {
      // 如果新类型是实验室检查，初始化结果列表
      if (labItems.value.length === 0) {
        addLabItem();
      }
    }
  }
);

// 组件挂载时初始化数据
onMounted(() => {
  initFormData();
  loadRecordTypes();
});
</script>

<style scoped>
.form-help-text {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}
</style> 