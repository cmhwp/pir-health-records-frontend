<template>
  <div>
    <a-page-header
      title="隐私设置"
      sub-title="管理您的数据隐私和PIR查询设置"
    />
    
    <a-card style="margin-top: 16px">
      <a-tabs>
        <a-tab-pane key="privacy" tab="数据隐私">
          <a-form
            :model="privacyForm"
            name="privacyForm"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 14 }"
            @finish="savePrivacySettings"
          >
            <a-divider orientation="left">默认隐私级别</a-divider>
            
            <a-form-item
              label="新健康记录默认隐私级别"
              name="default_privacy_level"
            >
              <a-radio-group v-model:value="privacyForm.default_privacy_level">
                <a-radio :value="1">公开 (医生可见)</a-radio>
                <a-radio :value="2">半私密 (仅特定医生可见)</a-radio>
                <a-radio :value="3">私密 (仅自己可见)</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-divider orientation="left">数据共享设置</a-divider>
            
            <a-form-item
              label="允许医生查看我的记录"
              name="allow_doctor_view"
            >
              <a-switch v-model:checked="privacyForm.allow_doctor_view" />
            </a-form-item>
            
            <a-form-item
              label="自动接受信任医生的查看请求"
              name="auto_accept_trusted"
              :wrapper-col="{ span: 14, offset: 0 }"
            >
              <a-switch 
                v-model:checked="privacyForm.auto_accept_trusted" 
                :disabled="!privacyForm.allow_doctor_view" 
              />
            </a-form-item>
            
            <a-form-item
              label="允许匿名统计研究使用"
              name="allow_research"
            >
              <a-switch v-model:checked="privacyForm.allow_research" />
              <span style="margin-left: 8px; color: #999">
                同意将您的健康数据以匿名方式用于医学研究和统计
              </span>
            </a-form-item>
            
            <a-divider orientation="left">通知设置</a-divider>
            
            <a-form-item
              label="记录被查看时通知我"
              name="notify_on_access"
            >
              <a-switch v-model:checked="privacyForm.notify_on_access" />
            </a-form-item>
            
            <a-form-item
              label="有医生请求查看我的记录时通知我"
              name="notify_on_request"
            >
              <a-switch v-model:checked="privacyForm.notify_on_request" />
            </a-form-item>
            
            <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
              <a-button type="primary" html-type="submit" :loading="saving">
                保存设置
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="pir" tab="PIR隐私查询设置">
          <a-alert
            type="info"
            showIcon
            style="margin-bottom: 16px"
            message="什么是PIR (Private Information Retrieval)？"
            description="私有信息检索 (PIR) 是一种加密技术，它允许您查询数据库而不泄露您查询的是什么信息。在医疗环境中，这意味着您可以查询敏感的健康信息，而不会让数据提供者知道您查询的具体内容。"
          />
          
          <a-form
            :model="pirForm"
            name="pirForm"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 14 }"
            @finish="savePirSettings"
          >
            <a-divider orientation="left">PIR服务器设置</a-divider>
            
            <a-form-item
              label="PIR查询服务器"
              name="pir_server"
            >
              <a-select v-model:value="pirForm.pir_server">
                <a-select-option value="default">默认服务器 (推荐)</a-select-option>
                <a-select-option value="custom">自定义服务器</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item
              v-if="pirForm.pir_server === 'custom'"
              label="自定义服务器地址"
              name="custom_server_url"
              :rules="[{ required: pirForm.pir_server === 'custom', message: '请输入自定义服务器地址' }]"
            >
              <a-input v-model:value="pirForm.custom_server_url" placeholder="请输入自定义PIR服务器地址" />
            </a-form-item>
            
            <a-divider orientation="left">查询安全性</a-divider>
            
            <a-form-item
              label="查询安全级别"
              name="security_level"
            >
              <a-radio-group v-model:value="pirForm.security_level">
                <a-radio :value="1">
                  <span>基础 </span>
                  <a-tooltip title="基本的查询隐私保护，适合常规医疗查询">
                    <question-circle-outlined />
                  </a-tooltip>
                </a-radio>
                <a-radio :value="2">
                  <span>标准 </span>
                  <a-tooltip title="平衡性能和隐私保护的标准级别，大多数场景推荐">
                    <question-circle-outlined />
                  </a-tooltip>
                </a-radio>
                <a-radio :value="3">
                  <span>高级 </span>
                  <a-tooltip title="更强的隐私保护，但可能会降低查询速度">
                    <question-circle-outlined />
                  </a-tooltip>
                </a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item
              label="查询匿名化"
              name="anonymize_queries"
            >
              <a-switch v-model:checked="pirForm.anonymize_queries" />
              <span style="margin-left: 8px; color: #999">
                通过Tor网络或匿名代理发送您的查询
              </span>
            </a-form-item>
            
            <a-form-item
              label="加密查询结果"
              name="encrypt_results"
            >
              <a-switch v-model:checked="pirForm.encrypt_results" />
              <span style="margin-left: 8px; color: #999">
                使用端到端加密保护查询结果
              </span>
            </a-form-item>
            
            <a-divider orientation="left">高级设置</a-divider>
            
            <a-form-item
              label="添加噪音查询"
              name="add_noise_queries"
            >
              <a-switch v-model:checked="pirForm.add_noise_queries" />
              <span style="margin-left: 8px; color: #999">
                发送额外的"诱饵"查询以增强隐私保护
              </span>
            </a-form-item>
            
            <a-form-item
              label="查询历史保留时间"
              name="history_retention"
            >
              <a-select v-model:value="pirForm.history_retention">
                <a-select-option value="7">7天</a-select-option>
                <a-select-option value="30">30天</a-select-option>
                <a-select-option value="90">90天</a-select-option>
                <a-select-option value="180">180天</a-select-option>
                <a-select-option value="365">1年</a-select-option>
                <a-select-option value="0">永久保留</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item :wrapper-col="{ span: 14, offset: 6 }">
              <a-space>
                <a-button type="primary" html-type="submit" :loading="saving">
                  保存设置
                </a-button>
                <a-button @click="resetPirSettings">
                  恢复默认设置
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="data" tab="数据管理">
          <a-alert
            type="warning"
            showIcon
            style="margin-bottom: 16px"
            message="数据管理"
            description="在此页面您可以管理您的健康数据。请注意，某些操作不可逆，请谨慎操作。"
          />
          
          <a-card title="数据下载" style="margin-bottom: 16px">
            <p>您可以下载您所有的健康记录数据。数据将以加密的ZIP文件格式提供。</p>
            <a-button type="primary" @click="handleDataExport" :loading="exporting">
              <template #icon><download-outlined /></template>
              导出我的数据
            </a-button>
          </a-card>
          
          <a-card title="数据删除" style="margin-bottom: 16px">
            <p style="color: #ff4d4f">警告：数据删除操作不可逆，删除后无法恢复。</p>
            <a-space>
              <a-popconfirm
                title="确定要删除所有已共享的记录吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDeleteSharedRecords"
              >
                <a-button danger>
                  <template #icon><delete-outlined /></template>
                  删除已共享记录
                </a-button>
              </a-popconfirm>
              
              <a-popconfirm
                title="确定要删除所有健康记录吗? 此操作不可恢复!"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDeleteAllRecords"
              >
                <a-button danger type="primary">
                  <template #icon><delete-outlined /></template>
                  删除所有记录
                </a-button>
              </a-popconfirm>
            </a-space>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  QuestionCircleOutlined, 
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { 
  getPrivacySettings, 
  updatePrivacySettings, 
  getPirSettings,
  updatePirSettings,
  exportUserData,
  deleteSharedRecords,
  deleteAllRecords
} from '@/api/health-records';

// 状态
const saving = ref(false);
const exporting = ref(false);

// 隐私表单
const privacyForm = reactive({
  default_privacy_level: 1,
  allow_doctor_view: true,
  auto_accept_trusted: false,
  allow_research: false,
  notify_on_access: true,
  notify_on_request: true
});

// PIR设置表单
const pirForm = reactive({
  pir_server: 'default',
  custom_server_url: '',
  security_level: 2,
  anonymize_queries: false,
  encrypt_results: true,
  add_noise_queries: false,
  history_retention: '30'
});

// 获取隐私设置
const fetchPrivacySettings = async () => {
  try {
    const response = await getPrivacySettings();
    if (response.success && response.data) {
      const settings = response.data;
      privacyForm.default_privacy_level = settings.default_privacy_level;
      privacyForm.allow_doctor_view = settings.allow_doctor_view;
      privacyForm.auto_accept_trusted = settings.auto_accept_trusted;
      privacyForm.allow_research = settings.allow_research;
      privacyForm.notify_on_access = settings.notify_on_access;
      privacyForm.notify_on_request = settings.notify_on_request;
    }
  } catch (error) {
    console.error('获取隐私设置失败:', error);
    message.error('获取隐私设置失败');
  }
};

// 获取PIR设置
const fetchPirSettings = async () => {
  try {
    const response = await getPirSettings();
    if (response.success && response.data) {
      const settings = response.data;
      pirForm.pir_server = settings.pir_server;
      pirForm.custom_server_url = settings.custom_server_url || '';
      pirForm.security_level = settings.security_level;
      pirForm.anonymize_queries = settings.anonymize_queries;
      pirForm.encrypt_results = settings.encrypt_results;
      pirForm.add_noise_queries = settings.add_noise_queries;
      pirForm.history_retention = String(settings.history_retention);
    }
  } catch (error) {
    console.error('获取PIR设置失败:', error);
    message.error('获取PIR设置失败');
  }
};

// 保存隐私设置
const savePrivacySettings = async () => {
  saving.value = true;
  try {
    const response = await updatePrivacySettings(privacyForm);
    if (response.success) {
      message.success('隐私设置已保存');
    } else {
      message.error(response.message || '保存隐私设置失败');
    }
  } catch (error) {
    console.error('保存隐私设置失败:', error);
    message.error('保存隐私设置失败');
  } finally {
    saving.value = false;
  }
};

// 保存PIR设置
const savePirSettings = async () => {
  saving.value = true;
  try {
    const response = await updatePirSettings({
      ...pirForm,
      history_retention: parseInt(pirForm.history_retention)
    });
    
    if (response.success) {
      message.success('PIR设置已保存');
    } else {
      message.error(response.message || '保存PIR设置失败');
    }
  } catch (error) {
    console.error('保存PIR设置失败:', error);
    message.error('保存PIR设置失败');
  } finally {
    saving.value = false;
  }
};

// 重置PIR设置
const resetPirSettings = () => {
  pirForm.pir_server = 'default';
  pirForm.custom_server_url = '';
  pirForm.security_level = 2;
  pirForm.anonymize_queries = false;
  pirForm.encrypt_results = true;
  pirForm.add_noise_queries = false;
  pirForm.history_retention = '30';
  
  message.success('已恢复默认PIR设置');
};

// 导出数据
const handleDataExport = async () => {
  exporting.value = true;
  try {
    const response = await exportUserData();
    if (response.success && response.data) {
      const { download_url, expiry_time } = response.data;
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = download_url;
      a.download = `health_records_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      message.success(`数据已导出，下载链接将在${expiry_time}小时后过期`);
    } else {
      message.error(response.message || '导出数据失败');
    }
  } catch (error) {
    console.error('导出数据失败:', error);
    message.error('导出数据失败，请稍后重试');
  } finally {
    exporting.value = false;
  }
};

// 删除共享记录
const handleDeleteSharedRecords = async () => {
  try {
    const response = await deleteSharedRecords();
    if (response.success) {
      message.success('已删除所有共享记录');
    } else {
      message.error(response.message || '删除共享记录失败');
    }
  } catch (error) {
    console.error('删除共享记录失败:', error);
    message.error('删除共享记录失败，请稍后重试');
  }
};

// 删除所有记录
const handleDeleteAllRecords = async () => {
  try {
    const response = await deleteAllRecords();
    if (response.success) {
      message.success('已删除所有健康记录');
    } else {
      message.error(response.message || '删除记录失败');
    }
  } catch (error) {
    console.error('删除所有记录失败:', error);
    message.error('删除记录失败，请稍后重试');
  }
};

onMounted(() => {
  fetchPrivacySettings();
  fetchPirSettings();
});
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 16px;
}
</style> 