import { onMounted, computed } from 'vue';
import { recordTypeContext } from '@/contexts/RecordTypeContext';

export function useRecordTypes() {
  const {
    recordTypes,
    isLoading,
    isLoaded,
    error,
    loadRecordTypes,
    getRecordTypeName,
    getRecordTypeColor,
    getRecordTypeIcon,
    getRecordTypeShort
  } = recordTypeContext;

  // 记录类型选项，用于选择框
  const recordTypeOptions = computed(() => {
    return recordTypes.value.map(type => ({
      label: type.name,
      value: type.code,
      color: type.color,
      icon: type.icon
    }));
  });

  // 组件挂载时自动加载记录类型
  onMounted(() => {
    if (!isLoaded.value && !isLoading.value) {
      loadRecordTypes();
    }
  });

  return {
    recordTypes,
    isLoading,
    isLoaded,
    error,
    recordTypeOptions,
    getRecordTypeName,
    getRecordTypeColor,
    getRecordTypeIcon,
    getRecordTypeShort,
    loadRecordTypes
  };
} 