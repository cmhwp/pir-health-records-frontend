<template>
  <div class="login-container">
    <a-card title="用户登录" class="login-card">
      <a-form
        :model="loginForm"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名/邮箱">
          <a-input v-model:value="loginForm.username" placeholder="请输入用户名或邮箱" />
        </a-form-item>
        
        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="loginForm.password" placeholder="请输入密码" />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>
            登录
          </a-button>
        </a-form-item>
        
        <div class="login-form-footer">
          <router-link to="/auth/register">没有账号？前往注册</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { login } from '@/api/auth';
import type { LoginRequest } from '@/types/auth';

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    
    const loginForm = reactive<LoginRequest>({
      username: '',
      password: ''
    });
    
    const rules = {
      username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    };
    
    const handleSubmit = async (values: LoginRequest) => {
      loading.value = true;
      try {
        const response = await login(values);
        if (response.success) {
          // 保存token到localStorage
          localStorage.setItem('token', response.data?.token || '');
          
          // 保存用户信息
          localStorage.setItem('user', JSON.stringify(response.data?.user));
          
          message.success('登录成功');
          
          // 根据用户角色重定向到不同页面
          const role = response.data?.user?.role;
          switch (role) {
            case 'admin':
              router.push('/admin/dashboard');
              break;
            case 'doctor':
              router.push('/doctor/dashboard');
              break;
            case 'researcher':
              router.push('/researcher/dashboard');
              break;
            default:
              router.push('/patient/dashboard');
          }
        } else {
          message.error(response.message || '登录失败');
        }
      } catch (error: any) {
        message.error(error.message || '登录请求失败');
      } finally {
        loading.value = false;
      }
    };
    
    return {
      loginForm,
      rules,
      loading,
      handleSubmit
    };
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-form-footer {
  text-align: center;
  margin-top: 16px;
}
</style> 