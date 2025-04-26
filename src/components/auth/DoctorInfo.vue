<template>
  <div class="doctor-info">
    <a-form
      :model="doctorForm"
      @finish="handleUpdate"
      layout="vertical"
    >
      <a-form-item name="specialty" label="专业领域">
        <a-input v-model:value="doctorForm.specialty" placeholder="请输入专业领域" />
      </a-form-item>
      
      <a-form-item name="license_number" label="执业证号">
        <a-input v-model:value="doctorForm.license_number" placeholder="请输入执业证号" />
      </a-form-item>
      
      <a-form-item name="years_of_experience" label="从业年限">
        <a-input-number v-model:value="doctorForm.years_of_experience" :min="0" :max="100" placeholder="请输入从业年限" />
      </a-form-item>
      
      <a-form-item name="education" label="学历背景">
        <a-textarea v-model:value="doctorForm.education" placeholder="请输入学历背景" rows="3" />
      </a-form-item>
      
      <a-form-item name="hospital" label="所属医院">
        <a-input v-model:value="doctorForm.hospital" placeholder="请输入所属医院" />
      </a-form-item>
      
      <a-form-item name="department" label="所属科室">
        <a-input v-model:value="doctorForm.department" placeholder="请输入所属科室" />
      </a-form-item>
      
      <a-form-item name="bio" label="个人简介">
        <a-textarea v-model:value="doctorForm.bio" placeholder="请输入个人简介" rows="4" />
      </a-form-item>
      
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">
          保存信息
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import type { DoctorInfo, User } from '@/types/auth';

const props = defineProps<{
  userId: number,
  userData?: User
}>();

const loading = ref(false);

const doctorForm = reactive<Partial<DoctorInfo>>({
  user_id: props.userId,
  specialty: '',
  license_number: '',
  years_of_experience: undefined,
  education: '',
  hospital: '',
  department: '',
  bio: ''
});

// 监听userData变化，更新表单
watch(() => props.userData, (newUserData) => {
  if (newUserData?.doctor_info) {
    Object.assign(doctorForm, newUserData.doctor_info);
  }
}, { immediate: true });

// 获取医生信息
const fetchDoctorInfo = async () => {
  // 如果父组件已经提供了用户数据，则无需再次获取
  if (props.userData?.doctor_info) {
    Object.assign(doctorForm, props.userData.doctor_info);
    return;
  }
  
  loading.value = true;
  try {
    const response = await axios.get(`/api/doctor/info/${props.userId}`);
    if (response.data.success) {
      Object.assign(doctorForm, response.data.data);
    }
  } catch (error) {
    console.error('获取医生信息失败', error);
  } finally {
    loading.value = false;
  }
};

// 更新医生信息
const handleUpdate = async () => {
  loading.value = true;
  try {
    const response = await axios.put('/api/doctor/info', doctorForm);
    if (response.data.success) {
      message.success('医生信息更新成功');
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
  if (!props.userData) {
    fetchDoctorInfo();
  }
});
</script>

<style scoped>
.doctor-info {
  margin-top: 16px;
}
</style> 