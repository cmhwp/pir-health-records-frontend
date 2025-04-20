<template>
  <div>
    <h2>系统设置</h2>
    
    <a-spin :spinning="loading">
      <a-card>
        <template #extra>
          <a-button type="primary" @click="saveAllSettings" :loading="saving" :disabled="!hasChanges">
            <template #icon><save-outlined /></template>
            保存所有更改
          </a-button>
        </template>
        
        <a-alert
          v-if="hasChanges"
          message="您有未保存的更改"
          description='请点击"保存所有更改"按钮来应用这些设置'
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />
        
        <a-tabs>
          <!-- 安全设置 -->
          <a-tab-pane key="security" tab="安全设置">
            <a-form :model="securitySettings" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-card title="密码策略" :bordered="false">
                    <a-form-item label="最小密码长度" name="password_policy.min_length">
                      <a-input-number
                        v-model:value="securitySettings.password_policy.min_length"
                        :min="6"
                        :max="32"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="需要特殊字符" name="password_policy.require_special">
                      <a-switch
                        v-model:checked="securitySettings.password_policy.require_special"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="需要数字" name="password_policy.require_digit">
                      <a-switch
                        v-model:checked="securitySettings.password_policy.require_digit"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="需要大写字母" name="password_policy.require_uppercase">
                      <a-switch
                        v-model:checked="securitySettings.password_policy.require_uppercase"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                
                <a-col :span="12">
                  <a-card title="登录和会话" :bordered="false">
                    <a-form-item label="允许登录尝试次数" name="login_attempts">
                      <a-input-number
                        v-model:value="securitySettings.login_attempts"
                        :min="1"
                        :max="10"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="会话超时时间(分钟)" name="session_timeout">
                      <a-input-number
                        v-model:value="securitySettings.session_timeout"
                        :min="5"
                        :max="1440"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="需要邮箱验证" name="require_email_confirmation">
                      <a-switch
                        v-model:checked="securitySettings.require_email_confirmation"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          
          <!-- 隐私设置 -->
          <a-tab-pane key="privacy" tab="隐私设置">
            <a-form :model="privacySettings" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-card title="PIR功能" :bordered="false">
                    <a-form-item label="启用PIR功能" name="pir_enabled">
                      <a-switch
                        v-model:checked="privacySettings.pir_enabled"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="PIR批处理大小" name="pir_batch_size">
                      <a-input-number
                        v-model:value="privacySettings.pir_batch_size"
                        :min="1"
                        :max="100"
                        :disabled="!privacySettings.pir_enabled"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                
                <a-col :span="12">
                  <a-card title="记录可见性" :bordered="false">
                    <a-form-item label="默认记录可见性" name="default_record_visibility">
                      <a-select
                        v-model:value="privacySettings.default_record_visibility"
                        @change="onSettingChange"
                      >
                        <a-select-option value="private">私有</a-select-option>
                        <a-select-option value="doctors">对医生可见</a-select-option>
                        <a-select-option value="researchers">对研究人员可见</a-select-option>
                        <a-select-option value="public">公开</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          
          <!-- 注册设置 -->
          <a-tab-pane key="registration" tab="注册设置">
            <a-form :model="registrationSettings" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-card title="注册控制" :bordered="false">
                    <a-form-item label="允许用户注册" name="registration_enabled">
                      <a-switch
                        v-model:checked="registrationSettings.registration_enabled"
                        @change="onSettingChange"
                      />
                      <div class="setting-help">
                        关闭此选项将禁止新用户注册，但不影响现有用户登录
                      </div>
                    </a-form-item>
                    
                    <a-form-item label="需要邮箱验证" name="require_email_confirmation">
                      <a-switch
                        v-model:checked="registrationSettings.require_email_confirmation"
                        @change="onSettingChange"
                      />
                      <div class="setting-help">
                        开启后，新用户注册需要通过邮箱验证才能激活账号
                      </div>
                    </a-form-item>
                  </a-card>
                </a-col>
                
                <a-col :span="12">
                  <a-card title="角色控制" :bordered="false">
                    <a-form-item label="允许注册研究员账号" name="allow_researcher_registration">
                      <a-switch
                        v-model:checked="registrationSettings.allow_researcher_registration"
                        @change="onSettingChange"
                      />
                      <div class="setting-help">
                        开启后，用户可以在注册时选择研究员角色
                      </div>
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          
          <!-- 系统设置 -->
          <a-tab-pane key="system" tab="系统设置">
            <a-form :model="systemConfig" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-card title="基本设置" :bordered="false">
                    <a-form-item label="调试模式" name="debug_mode">
                      <a-switch
                        v-model:checked="systemConfig.debug_mode"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="维护模式" name="maintenance_mode">
                      <a-switch
                        v-model:checked="systemConfig.maintenance_mode"
                        @change="onSettingChange"
                      />
                      <div class="setting-help">
                        启用维护模式将阻止用户访问系统，只有管理员可以登录
                      </div>
                    </a-form-item>
                  </a-card>
                </a-col>
                
                <a-col :span="12">
                  <a-card title="资源限制" :bordered="false">
                    <a-form-item label="上传大小限制(MB)" name="upload_limit">
                      <a-input-number
                        v-model:value="uploadLimitMB"
                        :min="1"
                        :max="100"
                        @change="onUploadLimitChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="最大导出记录数" name="max_export_size">
                      <a-input-number
                        v-model:value="systemConfig.max_export_size"
                        :min="100"
                        :max="10000"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          
          <!-- 通知设置 -->
          <a-tab-pane key="notifications" tab="通知设置">
            <a-form :model="notificationSettings" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-card title="通知开关" :bordered="false">
                    <a-form-item label="启用邮件通知" name="email_notifications">
                      <a-switch
                        v-model:checked="notificationSettings.email_notifications"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                    
                    <a-form-item label="启用系统通知" name="system_notifications">
                      <a-switch
                        v-model:checked="notificationSettings.system_notifications"
                        @change="onSettingChange"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                
                <a-col :span="12">
                  <a-card title="通知类型" :bordered="false">
                    <a-form-item label="选择需要启用的通知类型" name="notification_types">
                      <a-checkbox-group
                        v-model:value="notificationSettings.notification_types"
                        @change="onSettingChange"
                      >
                        <a-row>
                          <a-col :span="24">
                            <a-checkbox value="record_access">记录访问通知</a-checkbox>
                          </a-col>
                          <a-col :span="24">
                            <a-checkbox value="record_share">记录共享通知</a-checkbox>
                          </a-col>
                          <a-col :span="24">
                            <a-checkbox value="system_update">系统更新通知</a-checkbox>
                          </a-col>
                        </a-row>
                      </a-checkbox-group>
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
            </a-form>
          </a-tab-pane>
          
          <!-- 高级设置 -->
          <a-tab-pane key="advanced" tab="高级设置">
            <a-alert
              message="警告"
              description="高级设置可能会影响系统稳定性，请谨慎修改"
              type="warning"
              show-icon
              style="margin-bottom: 16px"
            />
            
            <a-card title="原始设置数据">
              <a-textarea
                v-model:value="rawSettingsJson"
                :rows="12"
                :status="jsonValid ? '' : 'error'"
                @change="onRawSettingsChange"
              />
              <div class="json-status" v-if="!jsonValid">
                JSON格式错误
              </div>
              <a-button
                type="primary"
                style="margin-top: 16px"
                :disabled="!jsonValid"
                @click="applyRawSettings"
              >
                应用原始设置
              </a-button>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { SaveOutlined } from '@ant-design/icons-vue';
import { getSystemSettings, updateSystemSettings } from '@/api/admin';
import type { 
  SystemSettingsResponse, 
  SecuritySettings, 
  PrivacySettings, 
  SystemConfig, 
  NotificationSettings,
  RegistrationSettings
} from '@/types/admin';

// 状态变量
const loading = ref<boolean>(true);
const saving = ref<boolean>(false);
const hasChanges = ref<boolean>(false);
const initialSettings = ref<any>(null);

// 设置数据
const securitySettings = reactive<SecuritySettings>({
  password_policy: {
    min_length: 8,
    require_special: true,
    require_digit: true,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true
  },
  login_attempts: 5,
  session_timeout: 30,
  require_email_confirmation: true
});

const privacySettings = reactive<PrivacySettings>({
  pir_enabled: false,
  pir_batch_size: 10,
  default_record_visibility: 'private'
});

const registrationSettings = reactive<RegistrationSettings>({
  registration_enabled: true,
  require_email_confirmation: true,
  allow_researcher_registration: false
});

const systemConfig = reactive<SystemConfig>({
  debug_mode: false,
  upload_limit: 16 * 1024 * 1024, // 16MB
  maintenance_mode: false,
  max_export_size: 1000
});

const notificationSettings = reactive<NotificationSettings>({
  email_notifications: true,
  system_notifications: true,
  notification_types: ['record_access', 'record_share', 'system_update']
});

// 原始设置JSON
const rawSettingsJson = ref<string>('');
const jsonValid = ref<boolean>(true);

// 计算属性：上传限制（MB）
const uploadLimitMB = computed({
  get: () => Math.floor(systemConfig.upload_limit / (1024 * 1024)),
  set: (value: number) => {
    systemConfig.upload_limit = value * 1024 * 1024;
  }
});

// 添加设置可见性状态
const settingsVisibility = ref<Record<string, boolean>>({});

// 加载系统设置
const loadSettings = async () => {
  loading.value = true;
  try {
    const response = await getSystemSettings();
    if (response.success && response.data) {
      // 设置各个配置项的值
      if (response.data.settings.security) {
        Object.assign(securitySettings, response.data.settings.security);
      }
      
      if (response.data.settings.privacy) {
        Object.assign(privacySettings, response.data.settings.privacy);
      }
      
      if (response.data.settings.registration) {
        Object.assign(registrationSettings, response.data.settings.registration);
      }
      
      if (response.data.settings.system) {
        Object.assign(systemConfig, response.data.settings.system);
      }
      
      if (response.data.settings.notifications) {
        Object.assign(notificationSettings, response.data.settings.notifications);
      }
      
      // 设置原始JSON
      rawSettingsJson.value = JSON.stringify(response.data.raw_settings, null, 2);
      
      // 保存设置可见性
      settingsVisibility.value = response.data.settings_visibility || {};
      
      // 保存初始设置副本，用于后续检测变更
      // 需要深度复制对象，避免引用同一对象
      initialSettings.value = {
        security: {
          password_policy: {
            min_length: securitySettings.password_policy.min_length,
            require_special: securitySettings.password_policy.require_special,
            require_digit: securitySettings.password_policy.require_digit,
            require_uppercase: securitySettings.password_policy.require_uppercase,
            require_lowercase: securitySettings.password_policy.require_lowercase,
            require_numbers: securitySettings.password_policy.require_numbers
          },
          login_attempts: securitySettings.login_attempts,
          session_timeout: securitySettings.session_timeout,
          require_email_confirmation: securitySettings.require_email_confirmation
        },
        privacy: {
          pir_enabled: privacySettings.pir_enabled,
          pir_batch_size: privacySettings.pir_batch_size,
          default_record_visibility: privacySettings.default_record_visibility
        },
        registration: {
          registration_enabled: registrationSettings.registration_enabled,
          require_email_confirmation: registrationSettings.require_email_confirmation,
          allow_researcher_registration: registrationSettings.allow_researcher_registration
        },
        system: {
          debug_mode: systemConfig.debug_mode,
          upload_limit: systemConfig.upload_limit,
          maintenance_mode: systemConfig.maintenance_mode,
          max_export_size: systemConfig.max_export_size
        },
        notifications: {
          email_notifications: notificationSettings.email_notifications,
          system_notifications: notificationSettings.system_notifications,
          notification_types: [...notificationSettings.notification_types]
        }
      };
      
      // 重置更改标志
      hasChanges.value = false;
    }
  } catch (error) {
    console.error('加载系统设置失败:', error);
    message.error('加载系统设置失败');
  } finally {
    loading.value = false;
  }
};

// 保存所有设置
const saveAllSettings = async () => {
  saving.value = true;
  try {
    // 收集所有设置
    const settings = {
      // 安全设置
      'password_policy': securitySettings.password_policy,
      'login_attempts': securitySettings.login_attempts,
      'session_timeout': securitySettings.session_timeout,
      'require_email_confirmation': securitySettings.require_email_confirmation,
      
      // 隐私设置
      'pir_enabled': privacySettings.pir_enabled,
      'pir_batch_size': privacySettings.pir_batch_size,
      'default_record_visibility': privacySettings.default_record_visibility,
      
      // 注册设置
      'registration_enabled': registrationSettings.registration_enabled,
      'allow_researcher_registration': registrationSettings.allow_researcher_registration,
      
      // 系统设置
      'debug_mode': systemConfig.debug_mode,
      'upload_limit': systemConfig.upload_limit,
      'maintenance_mode': systemConfig.maintenance_mode,
      'max_export_size': systemConfig.max_export_size,
      
      // 通知设置
      'email_notifications': notificationSettings.email_notifications,
      'system_notifications': notificationSettings.system_notifications,
      'notification_types': notificationSettings.notification_types
    };
    
    const response = await updateSystemSettings(settings);
    if (response.success) {
      message.success('系统设置更新成功');
      
      // 更新初始设置以重置变更检测
      initialSettings.value = {
        security: {
          password_policy: {
            min_length: securitySettings.password_policy.min_length,
            require_special: securitySettings.password_policy.require_special,
            require_digit: securitySettings.password_policy.require_digit,
            require_uppercase: securitySettings.password_policy.require_uppercase,
            require_lowercase: securitySettings.password_policy.require_lowercase,
            require_numbers: securitySettings.password_policy.require_numbers
          },
          login_attempts: securitySettings.login_attempts,
          session_timeout: securitySettings.session_timeout,
          require_email_confirmation: securitySettings.require_email_confirmation
        },
        privacy: {
          pir_enabled: privacySettings.pir_enabled,
          pir_batch_size: privacySettings.pir_batch_size,
          default_record_visibility: privacySettings.default_record_visibility
        },
        registration: {
          registration_enabled: registrationSettings.registration_enabled,
          require_email_confirmation: registrationSettings.require_email_confirmation,
          allow_researcher_registration: registrationSettings.allow_researcher_registration
        },
        system: {
          debug_mode: systemConfig.debug_mode,
          upload_limit: systemConfig.upload_limit,
          maintenance_mode: systemConfig.maintenance_mode,
          max_export_size: systemConfig.max_export_size
        },
        notifications: {
          email_notifications: notificationSettings.email_notifications,
          system_notifications: notificationSettings.system_notifications,
          notification_types: [...notificationSettings.notification_types]
        }
      };
      
      hasChanges.value = false;
    }
  } catch (error) {
    console.error('保存系统设置失败:', error);
    message.error('保存系统设置失败');
  } finally {
    saving.value = false;
  }
};

// 设置变更处理
const onSettingChange = () => {
  // 检测是否有设置变更
  if (!initialSettings.value) return;
  
  const currentSettings = {
    security: {
      password_policy: {
        min_length: securitySettings.password_policy.min_length,
        require_special: securitySettings.password_policy.require_special,
        require_digit: securitySettings.password_policy.require_digit,
        require_uppercase: securitySettings.password_policy.require_uppercase,
        require_lowercase: securitySettings.password_policy.require_lowercase,
        require_numbers: securitySettings.password_policy.require_numbers
      },
      login_attempts: securitySettings.login_attempts,
      session_timeout: securitySettings.session_timeout,
      require_email_confirmation: securitySettings.require_email_confirmation
    },
    privacy: {
      pir_enabled: privacySettings.pir_enabled,
      pir_batch_size: privacySettings.pir_batch_size,
      default_record_visibility: privacySettings.default_record_visibility
    },
    registration: {
      registration_enabled: registrationSettings.registration_enabled,
      require_email_confirmation: registrationSettings.require_email_confirmation,
      allow_researcher_registration: registrationSettings.allow_researcher_registration
    },
    system: {
      debug_mode: systemConfig.debug_mode,
      upload_limit: systemConfig.upload_limit,
      maintenance_mode: systemConfig.maintenance_mode,
      max_export_size: systemConfig.max_export_size
    },
    notifications: {
      email_notifications: notificationSettings.email_notifications,
      system_notifications: notificationSettings.system_notifications,
      notification_types: [...notificationSettings.notification_types]
    }
  };
  
  // 比较每个具体的设置值
  const securityChanged = JSON.stringify(initialSettings.value.security) !== JSON.stringify(currentSettings.security);
  const privacyChanged = JSON.stringify(initialSettings.value.privacy) !== JSON.stringify(currentSettings.privacy);
  const registrationChanged = JSON.stringify(initialSettings.value.registration) !== JSON.stringify(currentSettings.registration);
  const systemChanged = JSON.stringify(initialSettings.value.system) !== JSON.stringify(currentSettings.system);
  const notificationsChanged = JSON.stringify(initialSettings.value.notifications) !== JSON.stringify(currentSettings.notifications);
  
  hasChanges.value = securityChanged || privacyChanged || registrationChanged || systemChanged || notificationsChanged;
};

// 处理上传限制变更
const onUploadLimitChange = () => {
  onSettingChange();
};

// 处理原始设置变更
const onRawSettingsChange = () => {
  try {
    // 尝试解析JSON
    JSON.parse(rawSettingsJson.value);
    jsonValid.value = true;
  } catch (e) {
    jsonValid.value = false;
  }
};

// 应用原始设置
const applyRawSettings = () => {
  if (!jsonValid.value) return;
  
  try {
    const settings = JSON.parse(rawSettingsJson.value);
    hasChanges.value = true;
    message.success('原始设置已应用，请记得保存');
  } catch (e) {
    message.error('应用设置失败');
  }
};

// 监听设置变化
watch([securitySettings, privacySettings, registrationSettings, systemConfig, notificationSettings], () => {
  onSettingChange();
}, { deep: true });

// 组件挂载时加载设置
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.setting-help {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}

.json-status {
  color: #ff4d4f;
  margin-top: 8px;
}
</style> 