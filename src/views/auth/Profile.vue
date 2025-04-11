<template>
  <div class="profile-container">
    <a-card class="profile-card">
      <a-tabs>
        <a-tab-pane key="basic" tab="基本信息">
          <a-form
            :model="userForm"
            :rules="basicRules"
            @finish="handleUpdateBasic"
            layout="vertical"
          >
            <a-form-item name="username" label="用户名">
              <a-input v-model:value="userForm.username" disabled />
            </a-form-item>
            
            <a-form-item name="email" label="邮箱">
              <a-input v-model:value="userForm.email" disabled />
            </a-form-item>
            
            <a-form-item name="full_name" label="姓名">
              <a-input v-model:value="userForm.full_name" placeholder="请输入您的姓名" />
            </a-form-item>
            
            <a-form-item name="phone" label="联系电话">
              <a-input v-model:value="userForm.phone" placeholder="请输入联系电话" />
            </a-form-item>
            
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="loading">
                保存基本信息
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="password" tab="修改密码">
          <a-form
            :model="passwordForm"
            :rules="passwordRules"
            @finish="handleUpdatePassword"
            layout="vertical"
          >
            <a-form-item name="current_password" label="当前密码">
              <a-input-password v-model:value="passwordForm.current_password" placeholder="请输入当前密码" />
            </a-form-item>
            
            <a-form-item name="new_password" label="新密码">
              <a-input-password v-model:value="passwordForm.new_password" placeholder="请输入新密码" />
            </a-form-item>
            
            <a-form-item name="confirm_password" label="确认新密码">
              <a-input-password v-model:value="confirmPassword" placeholder="请再次输入新密码" />
            </a-form-item>
            
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="passwordLoading">
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane v-if="showRoleSpecificInfo" key="role_info" tab="角色信息">
          <component :is="roleInfoComponent" :user-id="userId as number" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getCurrentUser, updateUser, changePassword } from '@/api/auth';
import type { User, ChangePasswordRequest } from '@/types/auth';
import { Role } from '@/types/auth';

// 导入角色特定信息组件
import PatientInfo from '@/components/auth/PatientInfo.vue';
import DoctorInfo from '@/components/auth/DoctorInfo.vue';
import ResearcherInfo from '@/components/auth/ResearcherInfo.vue';

const loading = ref(false);
const passwordLoading = ref(false);
const confirmPassword = ref('');
const userId = ref<number | null>(null);

const userForm = reactive<Partial<User>>({
  username: '',
  email: '',
  full_name: '',
  phone: '',
  role: Role.PATIENT
});

const passwordForm = reactive<ChangePasswordRequest>({
  current_password: '',
  new_password: ''
});

// 载入用户信息
const fetchUserInfo = async () => {
  loading.value = true;
  try {
    const response = await getCurrentUser();
    if (response.success) {
      Object.assign(userForm, response.data);
      userId.value = response.data?.id || null;
    } else {
      message.error(response.message || '获取用户信息失败');
    }
  } catch (error: any) {
    message.error(error.message || '获取用户信息请求失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserInfo();
});

// 更新基本信息
const handleUpdateBasic = async () => {
  loading.value = true;
  try {
    const updateData = {
      full_name: userForm.full_name,
      phone: userForm.phone
    };
    
    const response = await updateUser(updateData);
    if (response.success) {
      message.success('基本信息更新成功');
    } else {
      message.error(response.message || '更新失败');
    }
  } catch (error: any) {
    message.error(error.message || '更新请求失败');
  } finally {
    loading.value = false;
  }
};

// 验证确认密码
const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== passwordForm.new_password) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

// 更新密码
const handleUpdatePassword = async () => {
  passwordLoading.value = true;
  try {
    const response = await changePassword(passwordForm);
    if (response.success) {
      message.success('密码修改成功');
      // 清空密码表单
      passwordForm.current_password = '';
      passwordForm.new_password = '';
      confirmPassword.value = '';
    } else {
      message.error(response.message || '密码修改失败');
    }
  } catch (error: any) {
    message.error(error.message || '密码修改请求失败');
  } finally {
    passwordLoading.value = false;
  }
};

// 表单验证规则
const basicRules = {
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ]
};

const passwordRules = {
  current_password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

// 根据用户角色决定是否显示角色特定信息
const showRoleSpecificInfo = computed(() => {
  return userForm.role !== Role.ADMIN; // 假设管理员没有特定的角色信息
});

// 根据角色动态指定组件
const roleInfoComponent = computed(() => {
  switch (userForm.role) {
    case Role.PATIENT:
      return PatientInfo;
    case Role.DOCTOR:
      return DoctorInfo;
    case Role.RESEARCHER:
      return ResearcherInfo;
    default:
      return null;
  }
});
</script>

<style scoped>
.profile-container {
  padding: 24px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}
</style> 