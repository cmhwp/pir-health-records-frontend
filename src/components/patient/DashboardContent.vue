<template>
  <div class="dashboard-container">
    <a-row :gutter="16">
      <!-- 统计卡片区域 -->
      <a-col :span="6" v-for="(stat, index) in statisticsCards" :key="index">
        <a-card :loading="loading" class="stat-card">
          <template #title>
            <div class="stat-title">
              <component :is="stat.icon" :style="{ color: stat.color, fontSize: '24px' }" />
              <span style="margin-left: 8px">{{ stat.title }}</span>
            </div>
          </template>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-footer">
            <span>{{ stat.description }}</span>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 最近记录区域 -->
      <a-col :span="16">
        <a-card title="最近健康记录" :loading="loading">
          <template #extra>
            <a-button type="link" @click="navigateToRecords">查看全部</a-button>
          </template>
          <a-list :data-source="recentRecords" size="large">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a @click="viewRecord(item._id)">{{ item.title }}</a>
                  </template>
                  <template #description>
                    <div>
                      <a-tag :color="getRecordTypeColor(item.record_type)">{{ getRecordTypeName(item.record_type) }}</a-tag>
                      <span style="margin-left: 8px">{{ formatDate(item.record_date) }}</span>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: getRecordTypeColor(item.record_type) }">
                      {{ getRecordTypeShort(item.record_type) }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-space>
                    <a-button type="link" size="small" @click="viewRecord(item._id)">
                      <template #icon><EyeOutlined /></template>
                      查看
                    </a-button>
                    <a-button type="link" size="small" @click="shareRecord(item._id)">
                      <template #icon><ShareAltOutlined /></template>
                      分享
                    </a-button>
                  </a-space>
                </template>
              </a-list-item>
            </template>
            <template #empty>
              <a-empty description="暂无健康记录" />
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 隐私保护区域 -->
      <a-col :span="8">
        <a-card title="隐私保护状态" :loading="loading">
          <div style="text-align: center; padding: 20px 0">
            <a-progress type="dashboard" :percent="privacyScore" :format="format" :stroke-color="privacyScoreColor" />
            <div style="margin-top: 12px">{{ privacyRating }}</div>
          </div>
          <a-list size="small">
            <a-list-item>
              <template #actions>
                <a @click="navigateToPirSettings">配置</a>
              </template>
              <a-list-item-meta>
                <template #title>PIR查询比例</template>
                <template #description>{{ pirUsageRatio }}% 的查询使用PIR保护</template>
              </a-list-item-meta>
            </a-list-item>
            <a-list-item>
              <template #actions>
                <a @click="navigateToPirSettings">配置</a>
              </template>
              <a-list-item-meta>
                <template #title>加密强度</template>
                <template #description>{{ encryptionStrength }}</template>
              </a-list-item-meta>
            </a-list-item>
            <a-list-item>
              <template #actions>
                <a @click="navigateToPirQuery">试用</a>
              </template>
              <a-list-item-meta>
                <template #title>隐匿查询</template>
                <template #description>使用PIR技术保护查询隐私</template>
              </a-list-item-meta>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 健康统计区域 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="健康记录趋势" :loading="loading" :bordered="false">
          <div id="health-trend-chart" style="height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="记录类型分布" :loading="loading" :bordered="false">
          <div id="record-type-chart" style="height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 预约和处方区域 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="有效处方" :loading="loading">
          <template #extra>
            <a-button type="link" @click="navigateToPrescriptions">查看全部</a-button>
          </template>
          <a-list :data-source="activePrescriptions" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>{{ item.diagnosis }}</template>
                  <template #description>
                    <div>
                      <MedicineBoxOutlined /> {{ item.items.length }} 种药品
                      <span style="margin-left: 8px">
                        <UserOutlined /> {{ item.doctor_name }}
                      </span>
                    </div>
                    <div style="margin-top: 4px">
                      <ClockCircleOutlined /> 有效至: {{ formatDate(item.valid_until) }}
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar style="background-color: #52c41a">
                      {{ item.diagnosis ? item.diagnosis.charAt(0) : 'P' }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
            <template #empty>
              <a-empty description="暂无有效处方" />
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 记录详情抽屉 -->
    <a-drawer
      v-model:visible="recordDrawerVisible"
      title="健康记录详情"
      placement="right"
      width="600"
    >
      <a-spin :spinning="recordLoading">
        <div v-if="currentRecord">
          <a-descriptions title="基本信息" bordered>
            <a-descriptions-item label="标题" :span="3">
              {{ currentRecord.title }}
            </a-descriptions-item>
            <a-descriptions-item label="记录类型">
              <a-tag :color="getRecordTypeColor(currentRecord.record_type)">
                {{ getRecordTypeName(currentRecord.record_type) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="记录日期">
              {{ formatDate(currentRecord.record_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(currentRecord.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="医疗机构" :span="2">
              {{ currentRecord.institution || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="医生姓名">
              {{ currentRecord.doctor_name || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="可见性">
              {{ getVisibilityName(currentRecord.visibility) }}
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div v-if="currentRecord.description">
            <h3>记录描述</h3>
            <p>{{ currentRecord.description }}</p>
          </div>

          <div v-if="currentRecord.medication" style="margin-top: 20px">
            <h3>用药信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="药物名称" :span="3">
                {{ currentRecord.medication.medication_name }}
              </a-descriptions-item>
              <a-descriptions-item label="剂量">
                {{ currentRecord.medication.dosage || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="频率">
                {{ currentRecord.medication.frequency || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="用药期间">
                {{ formatDateRange(currentRecord.medication.start_date, currentRecord.medication.end_date) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <div v-if="currentRecord.files && currentRecord.files.length > 0" style="margin-top: 20px">
            <h3>相关文件</h3>
            <a-list size="small" bordered>
              <a-list-item v-for="file in currentRecord.files" :key="file.file_path">
                <a-list-item-meta>
                  <template #title>{{ file.file_name }}</template>
                  <template #description>{{ formatFileSize(file.file_size) }}</template>
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
        </div>
        <a-empty v-else description="记录数据不存在" />
      </a-spin>
    </a-drawer>

    <!-- 分享记录抽屉 -->
    <a-drawer
      v-model:visible="shareDrawerVisible"
      title="分享健康记录"
      placement="right"
      width="400"
    >
      <a-form
        v-if="currentRecord"
        ref="shareFormRef"
        :model="shareForm"
        layout="vertical"
      >
        <a-form-item
          name="shared_with"
          label="分享给用户"
          :rules="[{ required: true, message: '请选择分享用户' }]"
        >
          <a-select
            v-model:value="shareForm.shared_with"
            placeholder="选择需要分享的用户"
            show-search
            :loading="loadingUsers"
            :filter-option="filterUsers"
          >
            <a-select-option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.username }} - {{ user.full_name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item name="permission" label="分享权限">
          <a-radio-group v-model:value="shareForm.permission">
            <a-radio :value="SharePermission.VIEW">仅查看</a-radio>
            <a-radio :value="SharePermission.EDIT">可编辑</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item name="expires_days" label="有效期">
          <a-select v-model:value="shareForm.expires_days" placeholder="选择有效期">
            <a-select-option :value="1">1天</a-select-option>
            <a-select-option :value="7">7天</a-select-option>
            <a-select-option :value="30">30天</a-select-option>
            <a-select-option :value="90">90天</a-select-option>
            <a-select-option :value="0">永久</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="sharing" @click="submitShare">
            分享记录
          </a-button>
          <a-button style="margin-left: 8px" @click="shareDrawerVisible = false">
            取消
          </a-button>
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  FileOutlined, 
  EyeOutlined, 
  ShareAltOutlined,
  DownloadOutlined,
  MedicineBoxOutlined,
  FileSearchOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons-vue';
import { getHealthRecords, getHealthRecord, getHealthStatistics, getRecordFileUrl, shareHealthRecord, getPirSettings } from '@/api/health';
import { RecordType, RecordVisibility, SharePermission, type HealthRecord } from '@/types/health';
import type { User } from '@/types/auth';
import { getUsers } from '@/api/admin';

const router = useRouter();

// 统计数据
const loading = ref(true);  
const recordCount = ref(0);
const recordTypeCounts = ref<Record<string, number>>({});
const recentRecords = ref<HealthRecord[]>([]);
const pirUsageRatio = ref(0);
const privacyScore = ref(0);

// 处方数据
const activePrescriptions = ref<any[]>([]);

// 记录详情
const recordDrawerVisible = ref(false);
const recordLoading = ref(false);
const currentRecord = ref<HealthRecord | null>(null);

// 分享功能
const shareDrawerVisible = ref(false);
const shareFormRef = ref();
const shareForm = reactive({
  shared_with: null as number | null,
  permission: SharePermission.VIEW,
  expires_days: 7
});
const sharing = ref(false);
const loadingUsers = ref(false);
const users = ref<User[]>([]);

// 隐私设置数据
const encryptionStrength = ref('中等');
const encryptionLevelMap = {
  low: '低',
  medium: '中等',
  high: '高'
};

// 统计卡片数据
const statisticsCards = computed(() => [
  {
    title: '健康记录总数',
    value: recordCount.value,
    description: '全部健康记录',
    icon: FileOutlined,
    color: '#1890ff'
  },
  {
    title: '常见记录类型',
    value: getTopRecordType(),
    description: '最常用的记录类型',
    icon: MedicineBoxOutlined,
    color: '#52c41a'
  },
  {
    title: '本月新增',
    value: getMonthlyRecordCount(),
    description: `${dayjs().format('YYYY年MM月')}新增`,
    icon: ClockCircleOutlined,
    color: '#722ed1'
  },
  {
    title: '隐私查询',
    value: `${pirUsageRatio.value}%`,
    description: '使用PIR保护的查询率',
    icon: SafetyOutlined,
    color: '#faad14'
  }
]);

// 隐私评分颜色
const privacyScoreColor = computed(() => {
  if (privacyScore.value <= 40) return '#f5222d';
  if (privacyScore.value <= 70) return '#faad14';
  return '#52c41a';
});

// 隐私评级
const privacyRating = computed(() => {
  if (privacyScore.value <= 40) return '隐私保护级别：弱';
  if (privacyScore.value <= 70) return '隐私保护级别：中';
  return '隐私保护级别：强';
});

// 处理隐私评分显示格式
const format = (percent: number) => {
  return `${percent}`;
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

// 获取记录类型简称
const getRecordTypeShort = (type: string): string => {
  const shortMap: Record<string, string> = {
    general: '常规',
    laboratory: '化验',
    medication: '用药',
    imaging: '影像',
    vital_signs: '体征',
    surgery: '手术',
    vaccination: '疫苗',
    allergy: '过敏',
    diagnosis: '诊断',
    other: '其他'
  };
  return shortMap[type]?.charAt(0) || '?';
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

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 获取最常用的记录类型
const getTopRecordType = (): string => {
  if (Object.keys(recordTypeCounts.value).length === 0) return '无记录';
  
  let maxType = '';
  let maxCount = 0;
  
  for (const [type, count] of Object.entries(recordTypeCounts.value)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  
  return getRecordTypeName(maxType);
};

// 获取本月记录数量
const getMonthlyRecordCount = (): number => {
  const currentMonth = dayjs().format('M');
  return recordTypeCounts.value[`month_${currentMonth}`] || 0;
};

// 获取健康记录统计信息
const fetchStatistics = async () => {
  try {
    const response = await getHealthStatistics();
    if (response.success && response.data) {
      recordTypeCounts.value = response.data.record_types;
      
      // 计算记录总数
      recordCount.value = Object.values(response.data.record_types)
        .reduce((sum, count) => sum + count, 0);
      
      // 月度记录统计 - 使用存在的字段
      const monthlyData = response.data.record_types;  // 替换为实际存在的字段
      const currentMonth = dayjs().format('M');
      recordTypeCounts.value[`month_${currentMonth}`] = monthlyData[`month_${currentMonth}`] || 0;
    }
  } catch (error) {
    console.error('获取健康统计数据失败:', error);
    message.error('获取健康统计数据失败');
  }
};

// 获取最近健康记录
const fetchRecentRecords = async () => {
  try {
    const response = await getHealthRecords({ 
      page: 1, 
      per_page: 5,
      // 按时间排序，最新的在前面
    });
    
    if (response.success && response.data) {
      recentRecords.value = response.data.records;
    }
  } catch (error) {
    console.error('获取最近健康记录失败:', error);
    message.error('获取最近健康记录失败');
  }
};

// 获取隐私设置
const fetchPrivacySettings = async () => {
  try {
    const response = await getPirSettings();
    if (response.success && response.data) {
      privacyScore.value = response.data.statistics.privacy_score;
      pirUsageRatio.value = response.data.statistics.pir_usage_ratio;
      
      // 转换加密强度文本
      const strength = response.data.settings.encryption_strength;
      encryptionStrength.value = encryptionLevelMap[strength as keyof typeof encryptionLevelMap] || '中等';
    }
  } catch (error) {
    console.error('获取隐私设置失败:', error);
    message.error('获取隐私设置失败');
  }
};

// 查看记录详情
const viewRecord = async (recordId: string) => {
  recordDrawerVisible.value = true;
  recordLoading.value = true;
  
  try {
    const response = await getHealthRecord(recordId);
    if (response.success && response.data) {
      currentRecord.value = response.data.record;
    } else {
      message.error('获取记录详情失败');
    }
  } catch (error) {
    console.error('获取记录详情失败:', error);
    message.error('获取记录详情失败');
  } finally {
    recordLoading.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 分享记录
const shareRecord = async (recordId: string) => {
  // 先查看记录详情
  try {
    const response = await getHealthRecord(recordId);
    if (response.success && response.data) {
      currentRecord.value = response.data.record;
      
      // 重置分享表单
      shareForm.shared_with = null;
      shareForm.permission = SharePermission.VIEW;
      shareForm.expires_days = 7;
      
      // 加载用户列表
      await fetchUsers();
      
      // 显示分享抽屉
      shareDrawerVisible.value = true;
    } else {
      message.error('获取记录详情失败');
    }
  } catch (error) {
    console.error('获取记录详情失败:', error);
    message.error('获取记录详情失败');
  }
};

// 获取用户列表
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await getUsers();
    if (response.success && response.data) {
      // 过滤掉自己
      const currentUserId = parseInt(localStorage.getItem('userId') || '0');
      users.value = response.data.users.filter(user => user.id !== currentUserId);
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
  } finally {
    loadingUsers.value = false;
  }
};

// 过滤用户下拉选择
const filterUsers = (input: string, option: any) => {
  const username = option.value.toLowerCase();
  const fullName = option.children.toLowerCase();
  const searchTerm = input.toLowerCase();
  return username.includes(searchTerm) || fullName.includes(searchTerm);
};

// 提交分享
const submitShare = async () => {
  if (!currentRecord.value) return;
  
  sharing.value = true;
  try {
    const values = await shareFormRef.value.validateFields();
    const response = await shareHealthRecord(currentRecord.value._id, {
      share_with_id: values.share_with_id,
      permission: values.permission,
      expiry_days: values.expiry_days === 0 ? undefined : values.expiry_days
    });
    
    if (response.success) {
      message.success('记录分享成功');
      shareDrawerVisible.value = false;
    } else {
      message.error(response.message || '分享失败');
    }
  } catch (error: any) {
    if (error.errorFields) {
      message.error('请填写必要字段');
    } else {
      console.error('分享记录失败:', error);
      message.error('分享记录失败');
    }
  } finally {
    sharing.value = false;
  }
};

// 格式化日期时间
const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 导航到其他页面
const navigateToRecords = () => {
  router.push('/patient/records');
};

const navigateToPirSettings = () => {
  router.push('/patient/pir-settings');
};

const navigateToPirQuery = () => {
  router.push('/patient/pir-query');
};

const navigateToPrescriptions = () => {
  router.push('/patient/prescriptions');
};

// 初始化
onMounted(async () => {
  loading.value = true;
  try {
    // 并行加载数据
    await Promise.all([
      fetchStatistics(),
      fetchRecentRecords(),
      fetchPrivacySettings()
    ]);

    // 获取处方数据
    try {
      const prescriptionsResponse = await getPrescriptions({ status: 'active', limit: 3 });
      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        activePrescriptions.value = prescriptionsResponse.data.prescriptions;
      }
    } catch (error) {
      console.error('获取处方数据失败:', error);
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  } finally {
    loading.value = false;
  }
});

// Mock implementation for prescription APIs
const getPrescriptions = async (params: Record<string, any>) => {
  return { success: true, data: { prescriptions: [] } };
};
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.stat-card {
  height: 100%;
}

.stat-title {
  display: flex;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 16px 0;
}

.stat-footer {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style> 