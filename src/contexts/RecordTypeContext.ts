import { ref, readonly } from 'vue';
import { getRecordTypes } from '@/api/health';
import type { RecordTypeInfo } from '@/types/health';

// 创建状态
const recordTypes = ref<RecordTypeInfo[]>([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const error = ref<Error | null>(null);

// 加载记录类型
const loadRecordTypes = async () => {
  if (isLoaded.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await getRecordTypes();
    if (response.success && response.data) {
      recordTypes.value = response.data.record_types;
      isLoaded.value = true;
    } else {
      throw new Error(response.message || '获取记录类型失败');
    }
  } catch (err) {
    error.value = err instanceof Error ? err : new Error('未知错误');
    console.error('获取记录类型失败:', err);
  } finally {
    isLoading.value = false;
  }
};

// 获取记录类型的名称
const getRecordTypeName = (code: string): string => {
  const recordType = recordTypes.value.find(type => type.code === code);
  return recordType?.name || code;
};

// 获取记录类型的颜色
const getRecordTypeColor = (code: string): string => {
  const recordType = recordTypes.value.find(type => type.code === code);
  return recordType?.color || '#999999';
};

// 获取记录类型的图标
const getRecordTypeIcon = (code: string): string => {
  const recordType = recordTypes.value.find(type => type.code === code);
  return recordType?.icon || '';
};

// 获取记录类型简称
const getRecordTypeShort = (code: string): string => {
  const recordType = recordTypes.value.find(type => type.code === code);
  if (recordType) {
    return recordType.name.charAt(0);
  }
  
  // 如果找不到自定义类型，则使用默认映射
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
  return shortMap[code]?.charAt(0) || '?';
};

// 导出只读状态和功能
export const recordTypeContext = {
  recordTypes: readonly(recordTypes),
  isLoading: readonly(isLoading),
  isLoaded: readonly(isLoaded),
  error: readonly(error),
  loadRecordTypes,
  getRecordTypeName,
  getRecordTypeColor,
  getRecordTypeIcon,
  getRecordTypeShort
}; 