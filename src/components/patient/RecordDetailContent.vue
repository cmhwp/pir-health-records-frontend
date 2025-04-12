<template>
  <div class="record-detail-container">
    <a-page-header
      :title="loading ? '加载中...' : record?.title || '健康记录详情'"
      @back="goBack"
    >
      <template #tags>
        <a-tag v-if="record" :color="getRecordTypeColor(record.record_type)">
          {{ getRecordTypeName(record.record_type) }}
        </a-tag>
      </template>
      <template #extra>
        <a-space>
          <a-button v-if="record" @click="handleShare">
            <template #icon><share-alt-outlined /></template>
            共享
          </a-button>
          <a-button v-if="record" type="primary" @click="handleEdit">
            <template #icon><edit-outlined /></template>
            编辑
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="basic" tab="基本信息">
          <a-card v-if="record">
            <a-descriptions bordered>
              <a-descriptions-item label="记录标题" :span="3">
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
              <a-descriptions-item label="可见性">
                {{ getVisibilityName(record.visibility) }}
              </a-descriptions-item>
              <a-descriptions-item label="版本">
                {{ record.version }}
              </a-descriptions-item>
              <a-descriptions-item label="标签" :span="3">
                <a-tag v-for="tag in recordTags" :key="tag" color="blue">{{ tag }}</a-tag>
                <span v-if="!recordTags.length">无标签</span>
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <div v-if="record.description">
              <h3>记录描述</h3>
              <p>{{ record.description }}</p>
            </div>

            <!-- 用药记录特定字段 -->
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
                <a-descriptions-item label="用药说明" :span="3" v-if="record.medication.instructions">
                  {{ record.medication.instructions }}
                </a-descriptions-item>
                <a-descriptions-item label="副作用" :span="3" v-if="record.medication.side_effects">
                  {{ record.medication.side_effects }}
                </a-descriptions-item>
              </a-descriptions>
            </div>

            <!-- 相关文件列表 -->
            <div v-if="record.files && record.files.length > 0" style="margin-top: 20px">
              <h3>相关文件</h3>
              <a-list size="small" bordered>
                <a-list-item v-for="file in record.files" :key="file.file_path">
                  <a-list-item-meta>
                    <template #title>{{ file.file_name }}</template>
                    <template #description>{{ formatFileSize(file.file_size) }} · {{ formatDate(file.uploaded_at) }}</template>
                    <template #avatar>
                      <file-outlined />
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-button type="link" @click="downloadFile(file.file_path)">
                      <template #icon><download-outlined /></template>
                      下载
                    </a-button>
                  </template>
                </a-list-item>
              </a-list>
            </div>
          </a-card>
          <a-empty v-else description="未找到记录数据" />
        </a-tab-pane>

        <a-tab-pane key="versions" tab="版本历史">
          <a-card>
            <a-timeline v-if="versions && versions.length > 0">
              <a-timeline-item v-for="version in versions" :key="version.version" :color="version.version === record?.version ? 'green' : 'blue'">
                <template #dot v-if="version.version === record?.version">
                  <check-circle-outlined />
                </template>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span style="font-weight: bold">版本 {{ version.version }}</span>
                    <a-space>
                      <a-tag v-if="version.version === record?.version" color="green">当前版本</a-tag>
                      <a-button v-else size="small" @click="viewVersion(version.version)">查看</a-button>
                      <a-button v-if="version.version !== record?.version" size="small" type="primary" @click="restoreVersion(version.version)">恢复此版本</a-button>
                    </a-space>
                  </div>
                  <div>修改时间: {{ formatDate(version.created_at) }}</div>
                  <div>修改人: {{ version.created_by || '未知用户' }}</div>
                  <div>修改说明: {{ version.description || '无说明' }}</div>
                  <div v-if="version.changes && version.changes.length > 0">
                    <div style="margin-top: 8px; font-weight: bold">变更内容:</div>
                    <a-list size="small">
                      <a-list-item v-for="(change, index) in version.changes" :key="index">
                        {{ change }}
                      </a-list-item>
                    </a-list>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
            <a-empty v-else description="暂无版本历史" />
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="share" tab="共享信息">
          <a-card>
            <a-form layout="vertical" :model="shareForm">
              <a-form-item label="选择用户" required>
                <a-select
                  v-model:value="shareForm.shared_with"
                  placeholder="请选择要共享的用户"
                  :loading="loadingUsers"
                >
                  <a-select-option v-for="user in userOptions" :key="user.id" :value="user.id">
                    {{ user.full_name || user.username }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="共享权限">
                <a-radio-group v-model:value="shareForm.permission">
                  <a-radio :value="SharePermission.VIEW">仅查看</a-radio>
                  <a-radio :value="SharePermission.EDIT">可编辑</a-radio>
                  <a-radio :value="SharePermission.FULL">完全权限</a-radio>
                </a-radio-group>
              </a-form-item>
              
              <a-form-item label="有效期">
                <a-radio-group v-model:value="shareForm.validity_type" @change="handleValidityChange">
                  <a-radio value="forever">永久有效</a-radio>
                  <a-radio value="days">指定天数</a-radio>
                </a-radio-group>
              </a-form-item>
              
              <a-form-item v-if="shareForm.validity_type === 'days'" label="有效天数">
                <a-input-number v-model:value="shareForm.expires_days" :min="1" :max="365" />
              </a-form-item>
              
              <a-form-item>
                <a-button type="primary" :loading="sharing" @click="submitShare">
                  共享记录
                </a-button>
              </a-form-item>
            </a-form>

            <a-divider />

            <h3>已共享记录</h3>
            <a-list v-if="sharedRecords.length > 0" :loading="loadingShared">
              <a-list-item v-for="shared in sharedRecords" :key="shared.shared_id">
                <a-list-item-meta>
                  <template #title>
                    <div style="display: flex; align-items: center">
                      <a-avatar style="margin-right: 8px" :style="{ backgroundColor: '#1890ff' }">
                        {{ shared.shared_with?.username?.charAt(0) || '?' }}
                      </a-avatar>
                      {{ shared.shared_with?.full_name || shared.shared_with?.username || '未知用户' }}
                    </div>
                  </template>
                  <template #description>
                    <div>
                      权限: <a-tag :color="getPermissionColor(shared.permission)">{{ getPermissionName(shared.permission) }}</a-tag>
                      <br />
                      状态: <a-tag :color="shared.is_valid ? 'success' : 'error'">{{ shared.is_valid ? '有效' : '已过期' }}</a-tag>
                      <br />
                      有效期: {{ formatValidity(shared.expires_at) }}
                      <br />
                      访问次数: {{ shared.access_count }} 次
                      <br />
                      最近访问: {{ shared.last_accessed ? formatDate(shared.last_accessed) : '未访问' }}
                    </div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button danger size="small" @click="revokeShare(shared.shared_id)">
                    <template #icon><stop-outlined /></template>
                    撤销共享
                  </a-button>
                </template>
              </a-list-item>
            </a-list>
            <a-empty v-else description="尚未共享此记录" />
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- 恢复版本确认模态框 -->
    <a-modal
      v-model:visible="restoreModalVisible"
      title="恢复到历史版本"
      @ok="confirmRestore"
      :confirm-loading="restoring"
    >
      <p>确定要将记录恢复至版本 {{ versionToRestore }} 吗？</p>
      <a-form-item label="恢复说明">
        <a-textarea v-model:value="restoreDescription" placeholder="请输入恢复原因（可选）" :rows="3" />
      </a-form-item>
    </a-modal>

    <!-- 撤销共享确认模态框 -->
    <a-modal
      v-model:visible="revokeModalVisible"
      title="撤销共享"
      @ok="confirmRevoke"
      :confirm-loading="revoking"
      okText="确认撤销"
      cancelText="取消"
      okType="danger"
    >
      <p>确定要撤销此共享记录吗？</p>
      <p>撤销后，对方将无法再访问该记录。</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EditOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons-vue';
import {
  getHealthRecord,
  getRecordVersions,
  getRecordVersion,
  restoreRecordVersion,
  getRecordFileUrl,
  getRecordsSharedByMe,
  shareHealthRecord,
  revokeSharedRecord
} from '@/api/health';
import { getUsers } from '@/api/users';
import {
  RecordType,
  RecordVisibility,
  SharePermission,
  type HealthRecord,
  type VersionInfo,
  type SharedRecordWithUser
} from '@/types/health';
import type { User } from '@/types/user';

const route = useRoute();
const router = useRouter();
const recordId = computed(() => route.params.id as string);
const activeTab = ref('basic');

// 根据URL查询参数设置初始标签页
onMounted(() => {
  if (route.query.tab === 'versions') {
    activeTab.value = 'versions';
  } else if (route.query.action === 'share') {
    activeTab.value = 'share';
  }
});

// 记录数据
const loading = ref(true);
const record = ref<HealthRecord | null>(null);
const sqlId = ref<number | null>(null);

// 记录标签
const recordTags = computed(() => {
  if (!record.value?.tags) return [];
  return record.value.tags.split(',').filter(tag => tag.trim().length > 0);
});

// 版本历史
const versions = ref<VersionInfo[]>([]);
const loadingVersions = ref(false);
const restoreModalVisible = ref(false);
const restoring = ref(false);
const versionToRestore = ref<number>(0);
const restoreDescription = ref('');

// 共享相关
const loadingUsers = ref(false);
const loadingShared = ref(false);
const userOptions = ref<User[]>([]);
const sharedRecords = ref<SharedRecordWithUser[]>([]);
const sharing = ref(false);
const shareForm = reactive({
  shared_with: undefined as number | undefined,
  permission: SharePermission.VIEW,
  validity_type: 'forever',
  expires_days: 30
});

// 撤销共享
const revokeModalVisible = ref(false);
const revoking = ref(false);
const shareIdToRevoke = ref<string>('');

// 获取记录详情
const fetchRecordDetail = async () => {
  loading.value = true;
  try {
    const response = await getHealthRecord(recordId.value);
    if (response.success && response.data) {
      record.value = response.data.record;
      sqlId.value = response.data.sql_id;
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败');
  } finally {
    loading.value = false;
  }
};

// 获取版本历史
const fetchVersions = async () => {
  if (!recordId.value) return;
  
  loadingVersions.value = true;
  try {
    const response = await getRecordVersions(recordId.value);
    if (response.success && response.data) {
      versions.value = response.data.versions;
    } else {
      message.error(response.message || '获取版本历史失败');
    }
  } catch (error) {
    console.error('获取版本历史失败:', error);
    message.error('获取版本历史失败');
  } finally {
    loadingVersions.value = false;
  }
};

// 查看特定版本
const viewVersion = async (versionNumber: number) => {
  router.push(`/patient/record/${recordId.value}?version=${versionNumber}`);
};

// 准备恢复版本
const restoreVersion = (versionNumber: number) => {
  versionToRestore.value = versionNumber;
  restoreDescription.value = '';
  restoreModalVisible.value = true;
};

// 确认恢复版本
const confirmRestore = async () => {
  if (!recordId.value || versionToRestore.value === 0) return;
  
  restoring.value = true;
  try {
    const response = await restoreRecordVersion(
      recordId.value,
      versionToRestore.value,
      { description: restoreDescription.value }
    );
    
    if (response.success) {
      message.success('已成功恢复到版本 ' + versionToRestore.value);
      restoreModalVisible.value = false;
      
      // 重新获取记录和版本历史
      await fetchRecordDetail();
      await fetchVersions();
    } else {
      message.error(response.message || '恢复版本失败');
    }
  } catch (error) {
    console.error('恢复版本失败:', error);
    message.error('恢复版本失败');
  } finally {
    restoring.value = false;
  }
};

// 获取可共享的用户列表
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await getUsers();
    if (response.success && response.data) {
      userOptions.value = response.data.users;
    } else {
      message.error(response.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
  } finally {
    loadingUsers.value = false;
  }
};

// 获取已共享记录列表
const fetchSharedRecords = async () => {
  if (!recordId.value) return;
  
  loadingShared.value = true;
  try {
    const response = await getRecordsSharedByMe(1, 100, false);
    if (response.success && response.data) {
      // 过滤出当前记录的共享记录
      const allShared = response.data.shared_records as SharedRecordWithUser[];
      sharedRecords.value = allShared.filter(s => 
        s.record_id.toString() === recordId.value || 
        s.mongo_id === recordId.value
      );
    } else {
      message.error(response.message || '获取共享记录失败');
    }
  } catch (error) {
    console.error('获取共享记录失败:', error);
    message.error('获取共享记录失败');
  } finally {
    loadingShared.value = false;
  }
};

// 处理有效期类型变更
const handleValidityChange = (e: any) => {
  shareForm.validity_type = e.target.value;
};

// 提交共享
const submitShare = async () => {
  if (!recordId.value || !shareForm.shared_with) {
    message.warning('请选择要共享的用户');
    return;
  }
  
  sharing.value = true;
  try {
    const shareData = {
      shared_with: shareForm.shared_with,
      permission: shareForm.permission,
      expires_days: shareForm.validity_type === 'days' ? shareForm.expires_days : undefined
    };
    
    const response = await shareHealthRecord(recordId.value, shareData);
    
    if (response.success) {
      message.success('记录已成功共享');
      // 重置表单
      shareForm.shared_with = undefined;
      shareForm.permission = SharePermission.VIEW;
      shareForm.validity_type = 'forever';
      shareForm.expires_days = 30;
      
      // 刷新共享记录列表
      await fetchSharedRecords();
    } else {
      message.error(response.message || '共享记录失败');
    }
  } catch (error) {
    console.error('共享记录失败:', error);
    message.error('共享记录失败');
  } finally {
    sharing.value = false;
  }
};

// 撤销共享
const revokeShare = (sharedId: number) => {
  shareIdToRevoke.value = sharedId.toString();
  revokeModalVisible.value = true;
};

// 确认撤销共享
const confirmRevoke = async () => {
  if (!shareIdToRevoke.value) return;
  
  revoking.value = true;
  try {
    const response = await revokeSharedRecord(shareIdToRevoke.value);
    
    if (response.success) {
      message.success('已成功撤销共享');
      revokeModalVisible.value = false;
      
      // 刷新共享记录列表
      await fetchSharedRecords();
    } else {
      message.error(response.message || '撤销共享失败');
    }
  } catch (error) {
    console.error('撤销共享失败:', error);
    message.error('撤销共享失败');
  } finally {
    revoking.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 返回上一页
const goBack = () => {
  router.push('/patient/records');
};

// 编辑记录
const handleEdit = () => {
  router.push(`/patient/edit-record/${recordId.value}`);
};

// 共享记录
const handleShare = () => {
  activeTab.value = 'share';
};

// 获取记录类型名称
const getRecordTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    general: '常规检查',
    laboratory: '实验室检查',
    medication: '用药记录',
    imaging: '影像检查',
    vital_signs: '生命体征',
    surgery: '手术记录',
    vaccination: '疫苗接种',
    allergy: '过敏记录',
    diagnosis: '诊断结果',
    other: '其他记录'
  };
  return typeMap[type] || '未知类型';
};

// 获取记录类型颜色
const getRecordTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    general: '#1890ff',
    laboratory: '#13c2c2',
    medication: '#52c41a',
    imaging: '#2f54eb',
    vital_signs: '#722ed1',
    surgery: '#eb2f96',
    vaccination: '#faad14',
    allergy: '#f5222d',
    diagnosis: '#fa8c16',
    other: '#bfbfbf'
  };
  return colorMap[type] || '#d9d9d9';
};

// 获取可见性名称
const getVisibilityName = (visibility: string): string => {
  const visibilityMap: Record<string, string> = {
    private: '仅自己可见',
    public: '所有人可见',
    doctor: '医生可见',
    researcher: '研究人员可见'
  };
  return visibilityMap[visibility] || '未知';
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
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return '未记录';
  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '无起始日期';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '持续中';
  return `${start} 至 ${end}`;
};

// 格式化有效期
const formatValidity = (expiresAt: string | null): string => {
  if (!expiresAt) return '永久有效';
  
  const now = dayjs();
  const expires = dayjs(expiresAt);
  
  if (expires.isBefore(now)) {
    return `已于 ${expires.format('YYYY-MM-DD')} 过期`;
  }
  
  const days = expires.diff(now, 'day');
  if (days <= 0) {
    return '今日过期';
  } else if (days === 1) {
    return '明日过期';
  } else if (days < 30) {
    return `${days}天后过期`;
  } else {
    return expires.format('YYYY-MM-DD') + ' 过期';
  }
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 监听标签页变化
watch(activeTab, (newTab) => {
  if (newTab === 'versions' && versions.value.length === 0) {
    fetchVersions();
  } else if (newTab === 'share') {
    if (userOptions.value.length === 0) {
      fetchUsers();
    }
    fetchSharedRecords();
  }
});

// 初始化
onMounted(() => {
  fetchRecordDetail();
});
</script>

<style scoped>
.record-detail-container {
  width: 100%;
}
</style> 