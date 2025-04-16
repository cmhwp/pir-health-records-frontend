<template>
  <div class="shared-record-container">
    <a-card class="shared-header" :loading="loading">
      <template #title>
        <div class="shared-title">
          <a-avatar :size="48" style="background-color: #87d068">
            <template #icon><user-outlined /></template>
          </a-avatar>
          <div class="shared-title-text">
            <h2>共享健康记录</h2>
            <p>您正在查看一份共享的健康记录</p>
          </div>
        </div>
      </template>
      <template #extra>
        <a-button type="primary" @click="handleSignIn">
          登录系统
        </a-button>
      </template>
    </a-card>

    <a-card v-if="error" style="margin-top: 20px">
      <a-result
        status="error"
        :title="error.title"
        :sub-title="error.message"
      >
        <template #extra>
          <a-button type="primary" @click="handleSignIn">
            登录系统
          </a-button>
        </template>
      </a-result>
    </a-card>

    <template v-else>
      <a-spin :spinning="loading">
        <a-card v-if="record" style="margin-top: 20px">
          <a-descriptions title="基本信息" bordered>
            <a-descriptions-item label="标题" :span="3">
              {{ record.title }}
            </a-descriptions-item>
            <a-descriptions-item label="记录类型">
              <a-tag :color="getRecordTypeColor(record.record_type)">
                {{ getRecordTypeName(record.record_type) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="记录日期">
              {{ formatDate(record.record_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(record.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="医疗机构" :span="2">
              {{ record.institution || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="医生姓名">
              {{ record.doctor_name || '未记录' }}
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div v-if="record.description">
            <h3>记录描述</h3>
            <p>{{ record.description }}</p>
          </div>

          <div v-if="record.medication && record.medication.medication_name" style="margin-top: 20px">
            <h3>用药信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="药物名称" :span="3">
                {{ record.medication.medication_name }}
              </a-descriptions-item>
              <a-descriptions-item label="剂量">
                {{ record.medication.dosage || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="频率">
                {{ record.medication.frequency || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="用药期间">
                {{ formatDateRange(record.medication.start_date, record.medication.end_date) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <a-alert v-if="sharedInfo" type="info" style="margin-top: 20px">
            <template #message>
              <p>共享信息</p>
            </template>
            <template #description>
              <div>
                <p>
                  <strong>共享者:</strong> {{ sharedInfo.owner?.full_name || sharedInfo.owner?.username || '未知用户' }}
                </p>
                <p>
                  <strong>共享权限:</strong> 
                  <a-tag :color="getPermissionColor(sharedInfo.permission)">
                    {{ getPermissionName(sharedInfo.permission) }}
                  </a-tag>
                </p>
                <p>
                  <strong>有效期:</strong> {{ sharedInfo.expires_at ? formatDate(sharedInfo.expires_at) : '永久有效' }}
                </p>
              </div>
            </template>
          </a-alert>
        </a-card>
      </a-spin>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { UserOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { accessSharedRecordByKey } from '@/api/health';
import type { HealthRecord } from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const router = useRouter();
const record = ref<HealthRecord | null>(null);
const sharedInfo = ref<any>(null);
const loading = ref<boolean>(true);
const error = ref<{ title: string; message: string } | null>(null);

// 使用hook获取记录类型相关函数
const { getRecordTypeName, getRecordTypeColor } = useRecordTypes();

// 从URL中获取access_key
const getAccessKeyFromUrl = (): string | null => {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts.length > 2 ? parts[2] : null;
};

// 加载共享记录
const loadSharedRecord = async () => {
  loading.value = true;
  const accessKey = getAccessKeyFromUrl();
  
  if (!accessKey) {
    error.value = {
      title: '访问链接无效',
      message: '未提供有效的访问密钥，无法访问共享记录'
    };
    loading.value = false;
    return;
  }

  try {
    const response = await accessSharedRecordByKey(accessKey);
    if (response.success && response.data) {
      record.value = response.data.record;
      sharedInfo.value = response.data.shared_info || response.data.sharing_info;
    } else {
      error.value = {
        title: '记录加载失败',
        message: response.message || '无法加载共享记录，可能链接已失效或记录不存在'
      };
    }
  } catch (err: any) {
    console.error('共享记录访问失败:', err);
    error.value = {
      title: '访问失败',
      message: err.message || '无法访问共享记录，请检查链接是否有效'
    };
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页面
const handleSignIn = () => {
  router.push('/auth/login');
};

// 获取权限名称
const getPermissionName = (permission: string): string => {
  const permissionMap: Record<string, string> = {
    view: '仅查看',
    edit: '可编辑',
    full: '完全权限'
  };
  return permissionMap[permission] || '未知权限';
};

// 获取权限颜色
const getPermissionColor = (permission: string): string => {
  const colorMap: Record<string, string> = {
    view: 'blue',
    edit: 'green',
    full: 'purple'
  };
  return colorMap[permission] || 'default';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化日期范围
const formatDateRange = (startDate: string | undefined, endDate: string | undefined): string => {
  if (!startDate && !endDate) return '未记录';
  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '无起始日期';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '持续中';
  return `${start} 至 ${end}`;
};

onMounted(() => {
  loadSharedRecord();
});
</script>

<style scoped>
.shared-record-container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 0 20px;
}

.shared-header {
  margin-bottom: 20px;
}

.shared-title {
  display: flex;
  align-items: center;
}

.shared-title-text {
  margin-left: 16px;
}

.shared-title-text h2 {
  margin: 0;
  font-size: 18px;
}

.shared-title-text p {
  margin: 4px 0 0;
  color: #666;
}
</style> 