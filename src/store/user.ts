import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/api/auth';
import type { User, LoginRequest } from '@/types/auth';
import { message } from 'ant-design-vue';
import router from '@/router';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const initialized = ref<boolean>(false);

  // Getters
  const isLoggedIn = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || '');
  const userId = computed(() => user.value?.id || 0);
  const username = computed(() => user.value?.username || '');
  const userAvatar = computed(() => user.value?.avatar || '');

  // Actions
  /**
   * 用户登录
   */
  async function login(loginData: LoginRequest, remember: boolean = false) {
    loading.value = true;
    try {
      const response = await apiLogin(loginData);
      if (response.success && response.data) {
        token.value = response.data.token;
        user.value = response.data.user;
        
        // 保存token和用户信息
        if (remember) {
          // 使用localStorage长期保存
          localStorage.setItem('token', token.value);
          localStorage.setItem('user', JSON.stringify(user.value));
          // 保存用户名，优先使用full_name，如果没有则使用username
          const displayName = user.value.full_name || user.value.username;
          localStorage.setItem('userName', displayName);
        } else {
          // 使用sessionStorage仅在当前会话保存
          sessionStorage.setItem('token', token.value);
          sessionStorage.setItem('user', JSON.stringify(user.value));
          // 同样保存用户名到localStorage，保证Dashboard页面可以访问
          const displayName = user.value.full_name || user.value.username;
          localStorage.setItem('userName', displayName);
          // 确保localStorage中没有残留token和user信息
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        // 根据用户角色导航到不同的首页
        if (user.value.role === 'patient') {
          router.push('/patient');
        } else if (user.value.role === 'doctor') {
          router.push('/doctor');
        } else if (user.value.role === 'researcher') {
          router.push('/researcher');
        } else if (user.value.role === 'admin') {
          router.push('/admin');
        }
        
        return true;
      } else {
        message.error(response.message || '登录失败');
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 用户退出登录
   */
  async function logout(skipApi: boolean = false) {
    loading.value = true;
    try {
      if (!skipApi) {
        await apiLogout();
      }
      // 无论API调用是否成功，都清除本地状态
      token.value = null;
      user.value = null;
      
      // 清除所有存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userName');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      router.push('/auth/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 从本地存储恢复用户会话
   */
  async function restoreSession() {
    // 优先从sessionStorage获取（当前会话），其次从localStorage获取（记住我）
    const sessionToken = sessionStorage.getItem('token');
    const localToken = localStorage.getItem('token');
    const sessionUser = sessionStorage.getItem('user');
    const localUser = localStorage.getItem('user');
    
    if (sessionToken) {
      token.value = sessionToken;
      if (sessionUser) {
        try {
          user.value = JSON.parse(sessionUser);
        } catch (e) {
          // 如果解析失败，尝试重新获取用户信息
          await fetchUserInfo();
        }
      } else {
        await fetchUserInfo();
      }
    } else if (localToken) {
      token.value = localToken;
      if (localUser) {
        try {
          user.value = JSON.parse(localUser);
        } catch (e) {
          // 如果解析失败，尝试重新获取用户信息
          await fetchUserInfo();
        }
      } else {
        await fetchUserInfo();
      }
    }
    
    initialized.value = true;
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    if (!token.value) return;
    
    loading.value = true;
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        user.value = response.data;
        return true;
      } else {
        message.error(response.message || '获取用户信息失败');
        return false;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(newUserInfo: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...newUserInfo };
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    initialized,
    
    // Getters
    isLoggedIn,
    userRole,
    userId,
    username,
    userAvatar,
    
    // Actions
    login,
    logout,
    restoreSession,
    fetchUserInfo,
    updateUserInfo
  };
}); 