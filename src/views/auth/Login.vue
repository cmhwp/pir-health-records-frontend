<template>
  <div class="login-container">
    <div class="system-title">
      <h1>PIR健康记录系统</h1>
    </div>
    <a-card title="用户登录" class="login-card">
      <a-form
        :model="loginForm"
        :rules="rules"
        @finish="handleSubmit"
        @finishFailed="onFinishFailed"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名/邮箱">
          <a-input v-model:value="loginForm.username" placeholder="请输入用户名或邮箱" />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="loginForm.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="loginForm.remember">记住我</a-checkbox>
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

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { message } from 'ant-design-vue';
import type { LoginRequest } from '@/types/auth';

interface LoginFormState extends LoginRequest {
  remember: boolean;
}

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);

const loginForm = reactive<LoginFormState>({
  username: '',
  password: '',
  remember: true
});

const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const success = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    }, loginForm.remember);
    
    if (success) {
      message.success('登录成功');
      // 登录成功后的路由跳转已在store中处理
    }
  } catch (error) {
    console.error('登录失败:', error);
    message.error('登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
  message.error('表单验证失败，请检查输入');
};

const toRegister = () => {
  router.push('/auth/register');
};
</script>

<style scoped>
.login-container {
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

.login-card {
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-form-footer {
  text-align: center;
  margin-top: 16px;
}
</style> 