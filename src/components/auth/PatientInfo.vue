<template>
  <div class="patient-info">
    <a-row :gutter="24">
      <a-col :span="16">
        <a-card title="个人医疗信息" :loading="loading">
          <a-form
            :model="patientForm"
            @finish="handleUpdate"
            layout="vertical"
          >
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="gender" label="性别">
                  <a-select v-model:value="patientForm.gender" placeholder="请选择性别">
                    <a-select-option value="male">男</a-select-option>
                    <a-select-option value="female">女</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="date_of_birth" label="出生日期">
                  <a-date-picker 
                    v-model:value="patientForm.date_of_birth" 
                    style="width: 100%" 
                    :disabledDate="disabledFutureDate"
                    format="YYYY-MM-DD"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-form-item name="address" label="地址">
              <a-textarea v-model:value="patientForm.address" placeholder="请输入地址" />
            </a-form-item>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="emergency_contact" label="紧急联系人">
                  <a-input v-model:value="patientForm.emergency_contact" placeholder="请输入紧急联系人姓名" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="emergency_phone" label="紧急联系人电话">
                  <a-input v-model:value="patientForm.emergency_phone" placeholder="请输入紧急联系人电话" />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-form-item name="medical_history" label="病史">
              <a-textarea v-model:value="patientForm.medical_history" placeholder="请输入病史" rows="4" />
            </a-form-item>
            
            <a-form-item name="allergies" label="过敏史">
              <a-textarea v-model:value="patientForm.allergies" placeholder="请输入过敏史" rows="4" />
            </a-form-item>
            
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="submitting">
                保存信息
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <a-card title="我的健康概况" :loading="loading">
          <a-statistic 
            title="健康记录" 
            :value="userStatistics.records_count || 0" 
            style="margin-bottom: 20px"
          >
            <template #prefix>
              <file-outlined />
            </template>
          </a-statistic>
          
          <a-statistic 
            title="处方记录" 
            :value="userStatistics.prescriptions_count || 0"
          >
            <template #prefix>
              <medicine-box-outlined />
            </template>
          </a-statistic>
          
          <a-divider />
          
          <a-space direction="vertical" style="width: 100%">
            <a-button type="primary" block @click="$router.push('/patient/records')">
              查看我的健康记录
            </a-button>
            <a-button block @click="$router.push('/patient/prescriptions')">
              查看我的处方
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { getCurrentUser, updateUser } from '@/api/auth';
import type { PatientInfo } from '@/types/auth';
import dayjs from 'dayjs';
import { FileOutlined, MedicineBoxOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  userId: number
}>();

const loading = ref(false);
const submitting = ref(false);
const userData = ref<any>(null);

// 使用计算属性获取统计信息
const userStatistics = computed(() => {
  if (userData.value?.stats) {
    return userData.value.stats;
  }
  return {
    records_count: 0,
    prescriptions_count: 0
  };
});

const patientForm = reactive<Partial<PatientInfo>>({
  user_id: props.userId,
  gender: '',
  date_of_birth: undefined,
  address: '',
  emergency_contact: '',
  emergency_phone: '',
  medical_history: '',
  allergies: ''
});

// 禁用未来日期
const disabledFutureDate = (current: dayjs.Dayjs) => {
  return current && current > dayjs().endOf('day');
};

// 获取患者信息
const fetchPatientInfo = async () => {
  loading.value = true;
  try {
    const response = await getCurrentUser();
    console.log('API响应:', response);
    
    if (response.success && response.data) {
      userData.value = response.data;
      
      // 更新表单数据
      if (userData.value.patient_info) {
        // 使用解构赋值确保所有字段都被处理
        const {
          id,
          gender,
          date_of_birth,
          address,
          emergency_contact,
          emergency_phone,
          medical_history,
          allergies
        } = userData.value.patient_info;
        
        // 更新表单
        patientForm.gender = gender || '';
        patientForm.address = address || '';
        patientForm.emergency_contact = emergency_contact || '';
        patientForm.emergency_phone = emergency_phone || '';
        patientForm.medical_history = medical_history || '';
        patientForm.allergies = allergies || '';
        
        // 处理日期格式
        if (date_of_birth) {
          patientForm.date_of_birth = dayjs(date_of_birth);
        } else {
          patientForm.date_of_birth = undefined;
        }
      }
    } else {
      message.error(response.message || '获取患者信息失败');
    }
  } catch (error: any) {
    console.error('获取患者信息失败:', error);
    message.error(error.message || '获取患者信息失败');
  } finally {
    loading.value = false;
  }
};

// 更新患者信息
const handleUpdate = async () => {
  submitting.value = true;
  try {
    // 创建一个新对象以避免修改原始表单
    const formData: Partial<PatientInfo> = { ...patientForm };
    
    // 处理日期数据
    if (formData.date_of_birth && dayjs.isDayjs(formData.date_of_birth)) {
      formData.date_of_birth = formData.date_of_birth.format('YYYY-MM-DD');
    }
    
    // 确保user_id存在
    formData.user_id = props.userId;
    
    console.log('提交的数据:', formData);
    
    // 通过API更新患者信息
    const response = await updateUser({ 
      patient_info: formData as PatientInfo 
    });
    
    if (response.success) {
      message.success('患者信息更新成功');
      // 重新获取更新后的信息
      fetchPatientInfo();
    } else {
      message.error(response.message || '更新失败');
    }
  } catch (error: any) {
    console.error('更新请求失败:', error);
    message.error(error.message || '更新请求失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchPatientInfo();
});
</script>

<style scoped>
.patient-info {
  margin-top: 16px;
}
</style> 