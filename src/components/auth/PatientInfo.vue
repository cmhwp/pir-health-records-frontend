<template>
  <div class="patient-info">
    <a-form
      :model="patientForm"
      @finish="handleUpdate"
      layout="vertical"
    >
      <a-form-item name="gender" label="性别">
        <a-select v-model:value="patientForm.gender" placeholder="请选择性别">
          <a-select-option value="male">男</a-select-option>
          <a-select-option value="female">女</a-select-option>
          <a-select-option value="other">其他</a-select-option>
        </a-select>
      </a-form-item>
      
      <a-form-item name="address" label="地址">
        <a-textarea v-model:value="patientForm.address" placeholder="请输入地址" />
      </a-form-item>
      
      <a-form-item name="emergency_contact" label="紧急联系人">
        <a-input v-model:value="patientForm.emergency_contact" placeholder="请输入紧急联系人姓名" />
      </a-form-item>
      
      <a-form-item name="emergency_phone" label="紧急联系人电话">
        <a-input v-model:value="patientForm.emergency_phone" placeholder="请输入紧急联系人电话" />
      </a-form-item>
      
      <a-form-item name="medical_history" label="病史">
        <a-textarea v-model:value="patientForm.medical_history" placeholder="请输入病史" rows="4" />
      </a-form-item>
      
      <a-form-item name="allergies" label="过敏史">
        <a-textarea v-model:value="patientForm.allergies" placeholder="请输入过敏史" rows="4" />
      </a-form-item>
      
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">
          保存信息
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted } from 'vue';
import type { PropType } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import type { PatientInfo } from '@/types/auth';

export default defineComponent({
  name: 'PatientInfoForm',
  props: {
    userId: {
      type: Number as PropType<number>,
      required: true
    }
  },
  setup(props) {
    const loading = ref(false);
    
    const patientForm = reactive<Partial<PatientInfo>>({
      user_id: props.userId,
      gender: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      medical_history: '',
      allergies: ''
    });
    
    // 获取患者信息
    const fetchPatientInfo = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`/api/patient/info/${props.userId}`);
        if (response.data.success) {
          Object.assign(patientForm, response.data.data);
        }
      } catch (error) {
        console.error('获取患者信息失败', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 更新患者信息
    const handleUpdate = async () => {
      loading.value = true;
      try {
        const response = await axios.put('/api/patient/info', patientForm);
        if (response.data.success) {
          message.success('患者信息更新成功');
        } else {
          message.error(response.data.message || '更新失败');
        }
      } catch (error: any) {
        message.error(error.message || '更新请求失败');
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      fetchPatientInfo();
    });
    
    return {
      patientForm,
      loading,
      handleUpdate
    };
  }
});
</script>

<style scoped>
.patient-info {
  margin-top: 16px;
}
</style> 