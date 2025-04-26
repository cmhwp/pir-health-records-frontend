<template>
  <div class="profile-container">
    <a-row :gutter="24">
      <a-col :span="24">
        <a-page-header
          title="个人资料"
          :backIcon="false"
          style="padding: 16px 0"
        />
      </a-col>
    </a-row>
    
    <a-row :gutter="24">
      <a-col :md="8" :sm="24">
        <a-card class="profile-sidebar">
          <div class="avatar-wrapper">
            <a-upload
              name="avatar"
              list-type="picture-card"
              class="avatar-uploader"
              :show-upload-list="false"
              :before-upload="beforeUpload"
              :customRequest="customUpload"
              @change="handleAvatarChange"
            >
              <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" class="avatar-image" />
              <div v-else class="upload-placeholder">
                <user-outlined v-if="!avatarLoading" />
                <loading-outlined v-else />
                <div class="ant-upload-text">{{ avatarLoading ? '上传中...' : '更换头像' }}</div>
              </div>
            </a-upload>
          </div>
          
          <div class="user-info">
            <h2>{{ userForm.full_name || userForm.username }}</h2>
            <p class="user-role">{{ roleText }}</p>
            <a-divider />
            <p class="info-item">
              <mail-outlined />
              <span>{{ userForm.email }}</span>
            </p>
            <p class="info-item" v-if="userForm.phone">
              <phone-outlined />
              <span>{{ userForm.phone }}</span>
            </p>
            <p class="info-item">
              <calendar-outlined />
              <span>加入时间: {{ formatDate(userForm.created_at) }}</span>
            </p>
          </div>
        </a-card>
      </a-col>
      
      <a-col :md="16" :sm="24">
        <a-card class="profile-card">
          <a-tabs default-active-key="basic">
            <a-tab-pane key="basic" tab="基本信息">
              <a-form
                :model="userForm"
                :rules="basicRules"
                @finish="handleUpdateBasic"
                layout="vertical"
              >
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item name="username" label="用户名">
                      <a-input v-model:value="userForm.username" disabled>
                        <template #prefix><user-outlined /></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item name="email" label="邮箱">
                      <a-input v-model:value="userForm.email" disabled>
                        <template #prefix><mail-outlined /></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                </a-row>
                
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item name="full_name" label="姓名">
                      <a-input 
                        v-model:value="userForm.full_name" 
                        placeholder="请输入您的姓名" 
                      >
                        <template #prefix><user-outlined /></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item name="phone" label="联系电话">
                      <a-input 
                        v-model:value="userForm.phone" 
                        placeholder="请输入联系电话" 
                      >
                        <template #prefix><phone-outlined /></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                </a-row>
                
                <a-form-item>
                  <a-space>
                    <a-button type="primary" html-type="submit" :loading="loading">
                      保存信息
                    </a-button>
                    <a-button @click="resetBasicForm">
                      重置
                    </a-button>
                  </a-space>
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
                  <a-input-password 
                    v-model:value="passwordForm.current_password" 
                    placeholder="请输入当前密码"
                  >
                    <template #prefix><lock-outlined /></template>
                  </a-input-password>
                </a-form-item>
                
                <a-form-item name="new_password" label="新密码">
                  <a-input-password 
                    v-model:value="passwordForm.new_password" 
                    placeholder="请输入新密码"
                  >
                    <template #prefix><lock-outlined /></template>
                  </a-input-password>
                </a-form-item>
                
                <a-form-item name="confirm_password" label="确认新密码">
                  <a-input-password 
                    v-model:value="confirmPassword" 
                    placeholder="请再次输入新密码"
                  >
                    <template #prefix><check-outlined /></template>
                  </a-input-password>
                </a-form-item>
                
                <a-form-item>
                  <a-space>
                    <a-button type="primary" html-type="submit" :loading="passwordLoading">
                      修改密码
                    </a-button>
                    <a-button @click="resetPasswordForm">
                      重置
                    </a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-tab-pane>
            
            <a-tab-pane v-if="showRoleSpecificInfo" key="role_info" tab="角色信息">
              <component 
                :is="roleInfoComponent" 
                :user-id="userId as number" 
                :user-data="originalUserData" 
              />
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getCurrentUser, updateUser, changePassword, uploadAvatar, getAvatarUrl } from '@/api/auth';
import type { User, ChangePasswordRequest } from '@/types/auth';
import { Role } from '@/types/auth';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined, 
  CheckOutlined,
  CalendarOutlined,
  LoadingOutlined 
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

// 导入角色特定信息组件
import PatientInfo from '@/components/auth/PatientInfo.vue';
import DoctorInfo from '@/components/auth/DoctorInfo.vue';
import ResearcherInfo from '@/components/auth/ResearcherInfo.vue';

// 扩展 User 类型以包含 avatar_url 字段
interface ExtendedUser extends Omit<User, 'created_at'> {
  avatar_url?: string;
  created_at?: string;
}

const loading = ref(false);
const passwordLoading = ref(false);
const confirmPassword = ref('');
const userId = ref<number | null>(null);
const avatarUrl = ref<string>('');
const avatarLoading = ref(false);
const originalUserData = ref<Partial<ExtendedUser>>({});

const userForm = reactive<Partial<ExtendedUser>>({
  username: '',
  email: '',
  full_name: '',
  phone: '',
  role: Role.PATIENT,
  created_at: undefined,
  avatar_url: undefined
});

const passwordForm = reactive<ChangePasswordRequest>({
  current_password: '',
  new_password: ''
});

// 角色文本显示
const roleText = computed(() => {
  switch (userForm.role) {
    case Role.PATIENT:
      return '患者';
    case Role.DOCTOR:
      return '医生';
    case Role.RESEARCHER:
      return '研究人员';
    case Role.ADMIN:
      return '管理员';
    default:
      return '用户';
  }
});

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return '未知';
  return dayjs(date).format('YYYY年MM月DD日');
};

// 载入用户信息
const fetchUserInfo = async () => {
  loading.value = true;
  try {
    const response = await getCurrentUser();
    console.log(response)
    if (response.success) {
      Object.assign(userForm, response.data);
      userId.value = response.data?.id || null;
      avatarUrl.value = response.data?.avatar ? getAvatarUrl(response.data.avatar) : '';
      
      // 保存原始数据用于重置
      originalUserData.value = { ...response.data };
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

// 头像上传前验证
const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传JPG或PNG格式的图片!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片必须小于2MB!');
  }
  return isJpgOrPng && isLt2M;
};

// 自定义上传方法
const customUpload = async ({ file, onSuccess, onError }: any) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await uploadAvatar(formData);
    if (response.success) {
      onSuccess(response, file);
    } else {
      onError(new Error(response.message || '上传失败'));
    }
  } catch (error) {
    onError(error);
  }
};

// 处理头像变更
const handleAvatarChange = async (info: any) => {
  if (info.file.status === 'uploading') {
    avatarLoading.value = true;
    return;
  }
  
  if (info.file.status === 'done') {
    // 获取上传的头像URL
    avatarLoading.value = false;
    if (info.file.response?.success) {
      avatarUrl.value = getAvatarUrl(info.file.response.data.avatar);
      message.success('头像上传成功!');
    } else {
      message.error(info.file.response?.message || '头像上传失败!');
    }
  } else if (info.file.status === 'error') {
    avatarLoading.value = false;
    message.error('头像上传失败!');
  }
};

// 重置基本信息表单
const resetBasicForm = () => {
  userForm.full_name = originalUserData.value.full_name || '';
  userForm.phone = originalUserData.value.phone || '';
  message.info('已重置为原始信息');
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.current_password = '';
  passwordForm.new_password = '';
  confirmPassword.value = '';
  message.info('已清空密码表单');
};

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
      // 更新原始数据
      originalUserData.value = { ...userForm };
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
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.profile-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02);
}

.profile-sidebar {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02);
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-uploader {
  display: block;
  width: 128px;
  height: 128px;
  margin: 0 auto;
}

.avatar-uploader :deep(.ant-upload) {
  width: 128px;
  height: 128px;
  background-color: #fafafa;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  transition: border-color 0.3s;
}

.avatar-uploader :deep(.ant-upload:hover) {
  border-color: #1890ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.upload-placeholder :deep(svg) {
  font-size: 36px;
  margin-bottom: 8px;
}

.ant-upload-text {
  font-size: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-info {
  text-align: center;
  padding: 0 16px 16px;
}

.user-info h2 {
  font-size: 18px;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.85);
}

.user-role {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  margin-bottom: 20px;
}

.info-item {
  text-align: left;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
}

.info-item :deep(svg) {
  margin-right: 8px;
}
</style> 