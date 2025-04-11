<template>
  <div>
    <a-page-header
      title="添加健康记录"
      sub-title="录入您的健康数据"
    />
    <a-card style="margin-top: 16px">
      <a-form
        :model="formState"
        name="addRecordForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
        @finish="onFinish"
        @finishFailed="onFinishFailed"
      >
        <!-- 记录类型选择 -->
        <a-form-item
          label="记录类型"
          name="record_type"
          :rules="[{ required: true, message: '请选择记录类型' }]"
        >
          <a-select
            v-model:value="formState.record_type"
            placeholder="请选择记录类型"
            @change="handleRecordTypeChange"
          >
            <a-select-option value="general">一般体检</a-select-option>
            <a-select-option value="blood_test">血液检查</a-select-option>
            <a-select-option value="imaging">影像检查</a-select-option>
            <a-select-option value="chronic_disease">慢性病监测</a-select-option>
            <a-select-option value="treatment">治疗记录</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>

        <!-- 动态表单项 - 根据记录类型改变 -->
        <template v-if="formState.record_type === 'general'">
          <a-form-item
            label="身高 (cm)"
            name="height"
            :rules="[{ required: true, message: '请输入身高' }]"
          >
            <a-input-number v-model:value="formState.height" :min="50" :max="250" style="width: 100%" />
          </a-form-item>
          <a-form-item
            label="体重 (kg)"
            name="weight"
            :rules="[{ required: true, message: '请输入体重' }]"
          >
            <a-input-number v-model:value="formState.weight" :min="20" :max="200" :precision="1" style="width: 100%" />
          </a-form-item>
          <a-form-item
            label="血压 (mmHg)"
            name="blood_pressure"
          >
            <a-input-group compact>
              <a-input-number 
                v-model:value="formState.systolic" 
                style="width: 45%" 
                :min="50" 
                :max="250"
                placeholder="收缩压"
              />
              <span style="width: 10%; text-align: center; line-height: 32px">/</span>
              <a-input-number 
                v-model:value="formState.diastolic" 
                style="width: 45%" 
                :min="30" 
                :max="150" 
                placeholder="舒张压" 
              />
            </a-input-group>
          </a-form-item>
          <a-form-item
            label="心率 (bpm)"
            name="heart_rate"
          >
            <a-input-number v-model:value="formState.heart_rate" :min="30" :max="220" style="width: 100%" />
          </a-form-item>
        </template>

        <template v-else-if="formState.record_type === 'blood_test'">
          <a-form-item
            label="血红蛋白 (g/L)"
            name="hemoglobin"
          >
            <a-input-number v-model:value="formState.hemoglobin" :min="0" :max="300" style="width: 100%" />
          </a-form-item>
          <a-form-item
            label="白细胞 (×10^9/L)"
            name="white_blood_cells"
          >
            <a-input-number v-model:value="formState.white_blood_cells" :min="0" :max="100" :precision="2" style="width: 100%" />
          </a-form-item>
          <a-form-item
            label="血小板 (×10^9/L)"
            name="platelets"
          >
            <a-input-number v-model:value="formState.platelets" :min="0" :max="1000" style="width: 100%" />
          </a-form-item>
          <a-form-item
            label="血糖 (mmol/L)"
            name="glucose"
          >
            <a-input-number v-model:value="formState.glucose" :min="0" :max="50" :precision="1" style="width: 100%" />
          </a-form-item>
        </template>

        <template v-else-if="formState.record_type === 'chronic_disease'">
          <a-form-item
            label="疾病类型"
            name="disease_type"
          >
            <a-select v-model:value="formState.disease_type" placeholder="请选择慢性病类型">
              <a-select-option value="diabetes">糖尿病</a-select-option>
              <a-select-option value="hypertension">高血压</a-select-option>
              <a-select-option value="heart_disease">心脏病</a-select-option>
              <a-select-option value="respiratory">呼吸系统疾病</a-select-option>
              <a-select-option value="other">其他</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item
            label="测量结果"
            name="measurement"
          >
            <a-input v-model:value="formState.measurement" placeholder="请输入测量结果" />
          </a-form-item>
          <a-form-item
            label="药物治疗"
            name="medication"
          >
            <a-textarea v-model:value="formState.medication" placeholder="请输入正在服用的药物" :rows="2" />
          </a-form-item>
        </template>

        <!-- 通用字段 -->
        <a-form-item
          label="检查日期"
          name="exam_date"
          :rules="[{ required: true, message: '请选择检查日期' }]"
        >
          <a-date-picker v-model:value="formState.exam_date" style="width: 100%" />
        </a-form-item>

        <a-form-item
          label="医疗机构"
          name="institution"
        >
          <a-input v-model:value="formState.institution" placeholder="请输入医疗机构名称" />
        </a-form-item>

        <a-form-item
          label="医生姓名"
          name="doctor_name"
        >
          <a-input v-model:value="formState.doctor_name" placeholder="请输入医生姓名" />
        </a-form-item>

        <a-form-item
          label="备注"
          name="notes"
        >
          <a-textarea v-model:value="formState.notes" placeholder="其他备注信息" :rows="3" />
        </a-form-item>

        <a-form-item
          label="隐私级别"
          name="privacy_level"
          :rules="[{ required: true, message: '请选择隐私级别' }]"
        >
          <a-radio-group v-model:value="formState.privacy_level">
            <a-radio :value="1">公开(医生可见)</a-radio>
            <a-radio :value="2">半私密(仅特定医生可见)</a-radio>
            <a-radio :value="3">私密(仅自己可见)</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item
          label="添加文件"
          name="attachments"
        >
          <a-upload
            v-model:fileList="fileList"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :before-upload="beforeUpload"
            @change="handleUploadChange"
          >
            <a-button>
              <upload-outlined />
              上传文件
            </a-button>
            <a-text style="margin-left: 8px; color: #999">支持PDF、图片等格式</a-text>
          </a-upload>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 14 }">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              保存记录
            </a-button>
            <a-button @click="resetForm">
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import type { UploadProps } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { addHealthRecord } from '@/api/health-records';
import dayjs from 'dayjs';

// 表单状态
const formState = reactive({
  record_type: undefined,
  height: undefined,
  weight: undefined,
  systolic: undefined,
  diastolic: undefined,
  heart_rate: undefined,
  hemoglobin: undefined,
  white_blood_cells: undefined,
  platelets: undefined,
  glucose: undefined,
  disease_type: undefined,
  measurement: '',
  medication: '',
  exam_date: null,
  institution: '',
  doctor_name: '',
  notes: '',
  privacy_level: 1,
  attachments: []
});

// 文件上传相关
const fileList = ref([]);
const submitting = ref(false);
const uploadUrl = '/api/health-records/upload';
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
};

// 处理记录类型变更
const handleRecordTypeChange = (value: string) => {
  // 根据记录类型可以执行一些逻辑
  console.log('记录类型已更改:', value);
};

// 上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = 
    file.type === 'application/pdf' || 
    file.type.startsWith('image/');
  
  if (!isValidType) {
    message.error('只能上传PDF或图片文件!');
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过10MB!');
  }
  
  return isValidType && isLt10M;
};

// 处理上传状态变化
const handleUploadChange: UploadProps['onChange'] = (info) => {
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 上传成功`);
    // 将上传成功的文件ID添加到表单数据中
    formState.attachments.push(info.file.response.fileId);
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};

// 提交表单
const onFinish = async (values: any) => {
  submitting.value = true;
  try {
    // 组织数据
    const recordData: any = {
      record_type: formState.record_type,
      exam_date: formState.exam_date ? dayjs(formState.exam_date).format('YYYY-MM-DD') : null,
      institution: formState.institution,
      doctor_name: formState.doctor_name,
      notes: formState.notes,
      privacy_level: formState.privacy_level,
      attachments: formState.attachments,
    };

    // 根据记录类型添加对应的数据
    if (formState.record_type === 'general') {
      recordData.metrics = {
        height: formState.height,
        weight: formState.weight,
        blood_pressure: formState.systolic && formState.diastolic 
          ? `${formState.systolic}/${formState.diastolic}` 
          : null,
        heart_rate: formState.heart_rate
      };
    } else if (formState.record_type === 'blood_test') {
      recordData.metrics = {
        hemoglobin: formState.hemoglobin,
        white_blood_cells: formState.white_blood_cells,
        platelets: formState.platelets,
        glucose: formState.glucose
      };
    } else if (formState.record_type === 'chronic_disease') {
      recordData.metrics = {
        disease_type: formState.disease_type,
        measurement: formState.measurement,
        medication: formState.medication
      };
    }

    const response = await addHealthRecord(recordData);
    if (response.success) {
      message.success('健康记录添加成功!');
      resetForm();
    } else {
      message.error(response.message || '添加记录失败，请重试');
    }
  } catch (error) {
    console.error('添加健康记录失败:', error);
    message.error('添加记录失败，请检查网络连接');
  } finally {
    submitting.value = false;
  }
};

// 提交失败
const onFinishFailed = (errorInfo: any) => {
  console.log('表单验证失败:', errorInfo);
  message.error('请检查表单填写是否正确');
};

// 重置表单
const resetForm = () => {
  for (const key in formState) {
    formState[key] = Array.isArray(formState[key]) ? [] : undefined;
  }
  formState.privacy_level = 1;
  formState.notes = '';
  formState.institution = '';
  formState.doctor_name = '';
  fileList.value = [];
};
</script>

<style scoped>
.ant-upload-list {
  max-height: 300px;
  overflow-y: auto;
}
</style> 