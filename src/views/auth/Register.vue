<template>
  <div class="register-container">
    <a-card title="用户注册" class="register-card">
      <a-form
        :model="registerForm"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名">
          <a-input v-model:value="registerForm.username" placeholder="请输入用户名" />
        </a-form-item>
        
        <a-form-item name="email" label="邮箱">
          <a-input v-model:value="registerForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        
        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="registerForm.password" placeholder="请输入密码" />
        </a-form-item>
        
        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password v-model:value="confirmPassword" placeholder="请再次输入密码" />
        </a-form-item>
        
        <a-form-item name="full_name" label="姓名">
          <a-input v-model:value="registerForm.full_name" placeholder="请输入您的姓名" />
        </a-form-item>
        
        <a-form-item name="phone" label="联系电话">
          <a-input v-model:value="registerForm.phone" placeholder="请输入联系电话" />
        </a-form-item>
        
        <a-form-item name="role" label="注册角色">
          <a-radio-group v-model:value="registerForm.role">
            <a-radio :value="'patient'">患者</a-radio>
            <a-radio :value="'doctor'">医生</a-radio>
            <a-radio :value="'researcher'">研究人员</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>
            注册
          </a-button>
        </a-form-item>
        
        <div class="register-form-footer">
          <router-link to="/auth/login">已有账号？前往登录</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { register } from '@/api/auth';
import type { RegisterRequest } from '@/types/auth';
import { Role } from '@/types/auth';

export default defineComponent({
  name: 'Register',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const confirmPassword = ref('');
    
    const registerForm = reactive<RegisterRequest>({
      username: '',
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: Role.PATIENT
    });
    
    const validateConfirmPassword = async (_rule: any, value: string) => {
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
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      full_name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
      ]
    };
    
    const handleSubmit = async () => {
      loading.value = true;
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
        loading.value = false;
      }
    };
    
    return {
      registerForm,
      confirmPassword,
      rules,
      loading,
      handleSubmit
    };
  }
});
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.register-card {
  width: 450px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-form-footer {
  text-align: center;
  margin-top: 16px;
}
</style> 