<template>
  <div class="register-container">
    <div class="system-title">
      <h1>PIR健康记录系统</h1>
    </div>
    <a-card title="用户注册" class="register-card">
      <a-spin :spinning="loading">
        <a-alert
          v-if="!settings.registration_enabled"
          type="error"
          message="系统注册功能已暂时关闭"
          description="请联系管理员获取账号"
          style="margin-bottom: 16px"
        />
        
        <template v-else>
          <a-form
            :model="registerForm"
            :rules="rules"
            @finish="handleSubmit"
            layout="vertical"
            ref="formRef"
          >
            <a-form-item name="username" label="用户名">
              <a-input v-model:value="registerForm.username" placeholder="请输入用户名" />
            </a-form-item>
            
            <a-form-item name="email" label="邮箱">
              <a-input v-model:value="registerForm.email" placeholder="请输入邮箱" />
            </a-form-item>
            
            <a-form-item name="password" label="密码">
              <a-input-password 
                v-model:value="registerForm.password" 
                placeholder="请输入密码" 
                @change="onPasswordChange" 
              />
              <template v-if="isPasswordPolicyVisible">
                <div class="password-policy">
                  <div class="password-policy-title">密码要求:</div>
                  <div class="password-policy-item" :class="passwordChecks.minLength ? 'success' : 'error'">
                    <check-outlined v-if="passwordChecks.minLength" />
                    <close-outlined v-else />
                    至少 {{ settings.password_policy.min_length }} 个字符
                  </div>
                  <div v-if="settings.password_policy.require_uppercase" 
                       class="password-policy-item" 
                       :class="passwordChecks.hasUppercase ? 'success' : 'error'">
                    <check-outlined v-if="passwordChecks.hasUppercase" />
                    <close-outlined v-else />
                    至少1个大写字母
                  </div>
                  <div v-if="settings.password_policy.require_lowercase" 
                       class="password-policy-item" 
                       :class="passwordChecks.hasLowercase ? 'success' : 'error'">
                    <check-outlined v-if="passwordChecks.hasLowercase" />
                    <close-outlined v-else />
                    至少1个小写字母
                  </div>
                  <div v-if="settings.password_policy.require_numbers" 
                       class="password-policy-item" 
                       :class="passwordChecks.hasNumber ? 'success' : 'error'">
                    <check-outlined v-if="passwordChecks.hasNumber" />
                    <close-outlined v-else />
                    至少1个数字
                  </div>
                  <div v-if="settings.password_policy.require_special" 
                       class="password-policy-item" 
                       :class="passwordChecks.hasSpecial ? 'success' : 'error'">
                    <check-outlined v-if="passwordChecks.hasSpecial" />
                    <close-outlined v-else />
                    至少1个特殊字符
                  </div>
                </div>
              </template>
            </a-form-item>
            
            <a-form-item name="confirmPassword" label="确认密码" :validateStatus="confirmStatus" :help="confirmHelp">
              <a-input-password v-model:value="confirmPassword" placeholder="请再次输入密码" @change="validateConfirm" />
            </a-form-item>
            
            <a-form-item name="full_name" label="姓名">
              <a-input v-model:value="registerForm.full_name" placeholder="请输入您的姓名" />
            </a-form-item>
            
            <a-form-item name="phone" label="联系电话">
              <a-input v-model:value="registerForm.phone" placeholder="请输入联系电话" />
            </a-form-item>
            
            <a-form-item name="role" label="注册角色">
              <a-radio-group v-model:value="registerForm.role">
                <template v-for="role in settings.available_roles" :key="role.value">
                  <a-radio :value="role.value">
                    {{ role.label }}
                    <a-tooltip :title="role.description">
                      <question-circle-outlined />
                    </a-tooltip>
                  </a-radio>
                </template>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item>
              <a-button 
                type="primary" 
                html-type="submit" 
                :loading="submitting" 
                :disabled="!isPasswordValid || !settings.registration_enabled"
                block
                @click="handleSubmit"
              >
                注册
              </a-button>
            </a-form-item>
            
            <div class="register-form-footer">
              <router-link to="/auth/login">已有账号？前往登录</router-link>
            </div>
          </a-form>
        </template>
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  CheckOutlined, 
  CloseOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons-vue';
import { register, getPublicSettings } from '@/api/auth';
import type { RegisterRequest, PublicSettings } from '@/types/auth';
import { Role } from '@/types/auth';

const router = useRouter();
const loading = ref(true);
const submitting = ref(false);
const confirmPassword = ref('');
const formRef = ref();
const confirmStatus = ref('');
const confirmHelp = ref('');
const isPasswordPolicyVisible = ref(false);

// 默认设置
const settings = reactive<PublicSettings>({
  password_policy: {
    min_length: 6,
    require_uppercase: false,
    require_lowercase: false,
    require_numbers: false,
    require_special: false
  },
  require_email_confirmation: true,
  system_version: '1.0.0',
  registration_enabled: true,
  available_roles: [
    { value: 'patient', label: '患者', description: '需要使用医疗服务的用户' },
    { value: 'doctor', label: '医生', description: '提供医疗服务的专业医护人员' }
  ]
});

const registerForm = reactive<RegisterRequest>({
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: Role.PATIENT
});

// 密码检查结果
const passwordChecks = reactive({
  minLength: false,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSpecial: false
});

// 计算密码是否符合所有要求
const isPasswordValid = computed(() => {
  const checks = [
    passwordChecks.minLength,
    !settings.password_policy.require_uppercase || passwordChecks.hasUppercase,
    !settings.password_policy.require_lowercase || passwordChecks.hasLowercase,
    !settings.password_policy.require_numbers || passwordChecks.hasNumber,
    !settings.password_policy.require_special || passwordChecks.hasSpecial
  ];
  return checks.every(check => check);
});

// 获取公开设置
const fetchPublicSettings = async () => {
  try {
    const response = await getPublicSettings();
    if (response.success && response.data) {
      // 更新设置
      Object.assign(settings, response.data);
      
      // 处理兼容性问题 - 确保密码策略字段一致性
      if (settings.password_policy) {
        const policy = settings.password_policy as any;
        // 如果后端返回 require_digit 而不是 require_numbers
        if ('require_digit' in policy && !('require_numbers' in policy)) {
          policy.require_numbers = policy.require_digit;
        }
        
        // 确保所有必需字段都有值
        policy.require_numbers = policy.require_numbers || false;
        policy.require_lowercase = policy.require_lowercase || false;
        policy.require_uppercase = policy.require_uppercase || false;
        policy.require_special = policy.require_special || false;
        
        settings.password_policy = policy;
      }
      
      // 更新表单验证规则
      updateFormRules();
    }
  } catch (error) {
    console.error('获取系统设置失败:', error);
    message.error('获取系统设置失败，使用默认设置');
  } finally {
    loading.value = false;
  }
};

// 更新表单验证规则
const updateFormRules = () => {
  rules.password = [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: settings.password_policy.min_length, message: `密码至少${settings.password_policy.min_length}个字符`, trigger: 'blur' },
    { validator: validatePassword, trigger: 'change' } as any
  ];
};

// 监听密码变化，如果确认密码已经输入，则重新验证
watch(() => registerForm.password, (newVal) => {
  checkPassword(newVal);
  if (confirmPassword.value) {
    validateConfirm();
  }
});

// 密码输入框获得焦点时显示密码策略
const onPasswordFocus = () => {
  isPasswordPolicyVisible.value = true;
};

// 密码输入框失去焦点时隐藏密码策略
const onPasswordBlur = () => {
  isPasswordPolicyVisible.value = false;
};

// 密码输入框变化时触发
const onPasswordChange = () => {
  isPasswordPolicyVisible.value = true;
  checkPassword(registerForm.password);
  if (confirmPassword.value) {
    validateConfirm();
  }
};

// 检查密码是否满足所有要求
const checkPassword = (password: string) => {
  passwordChecks.minLength = password.length >= settings.password_policy.min_length;
  passwordChecks.hasUppercase = /[A-Z]/.test(password);
  passwordChecks.hasLowercase = /[a-z]/.test(password);
  passwordChecks.hasNumber = /[0-9]/.test(password);
  
  // 特殊字符检查
  const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  passwordChecks.hasSpecial = specialChars.test(password);
};

// 验证密码是否符合策略
const validatePassword = async (_rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请输入密码');
  }
  
  if (value.length < settings.password_policy.min_length) {
    return Promise.reject(`密码至少${settings.password_policy.min_length}个字符`);
  }
  
  if (settings.password_policy.require_uppercase && !/[A-Z]/.test(value)) {
    return Promise.reject('密码必须包含至少一个大写字母');
  }
  
  if (settings.password_policy.require_lowercase && !/[a-z]/.test(value)) {
    return Promise.reject('密码必须包含至少一个小写字母');
  }
  
  if (settings.password_policy.require_numbers && !/[0-9]/.test(value)) {
    return Promise.reject('密码必须包含至少一个数字');
  }
  
  if (settings.password_policy.require_special) {
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (!specialChars.test(value)) {
      return Promise.reject('密码必须包含至少一个特殊字符');
    }
  }
  
  return Promise.resolve();
};

// 验证确认密码
const validateConfirm = () => {
  if (!confirmPassword.value) {
    confirmStatus.value = 'error';
    confirmHelp.value = '请确认密码';
    return;
  }
  
  if (confirmPassword.value !== registerForm.password) {
    confirmStatus.value = 'error';
    confirmHelp.value = '两次输入的密码不一致';
  } else {
    confirmStatus.value = 'success';
    confirmHelp.value = '';
  }
};

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value === '') {
    return Promise.reject('请确认密码');
  }
  if (value !== registerForm.password) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'change' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ]
};

const handleSubmit = async () => {
  // 提交前再次验证确认密码
  if (confirmPassword.value !== registerForm.password) {
    message.error('两次输入的密码不一致');
    return;
  }
  console.log(registerForm);
  submitting.value = true;
  try {
    const response = await register(registerForm);
    if (response.success) {
      message.success('注册成功，请登录');
      router.push('/auth/login');
    } else {
      message.error(response.message || '注册失败');
    }
  } catch (error: any) {
    message.error(error.message || '注册请求失败');
  } finally {
    submitting.value = false;
  }
};

// 组件挂载时获取公开设置
onMounted(() => {
  fetchPublicSettings();
});
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.system-title {
  text-align: center;
  margin-bottom: 24px;
}

.system-title h1 {
  color: #1890ff;
  font-size: 28px;
}

.register-card {
  width: 450px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-form-footer {
  text-align: center;
  margin-top: 16px;
}

.password-policy {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 12px;
}

.password-policy-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.password-policy-item {
  display: flex;
  align-items: center;
  margin: 2px 0;
  line-height: 1.6;
}

.password-policy-item.success {
  color: #52c41a;
}

.password-policy-item.error {
  color: #ff4d4f;
}

.password-policy-item .anticon {
  margin-right: 4px;
}
</style> 