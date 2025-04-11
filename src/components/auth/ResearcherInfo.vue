<template>
  <div class="researcher-info">
    <a-form
      :model="researcherForm"
      @finish="handleUpdate"
      layout="vertical"
    >
      <a-form-item name="institution" label="所属机构">
        <a-input v-model:value="researcherForm.institution" placeholder="请输入所属机构" />
      </a-form-item>
      
      <a-form-item name="department" label="所属部门">
        <a-input v-model:value="researcherForm.department" placeholder="请输入所属部门" />
      </a-form-item>
      
      <a-form-item name="research_area" label="研究领域">
        <a-input v-model:value="researcherForm.research_area" placeholder="请输入研究领域" />
      </a-form-item>
      
      <a-form-item name="education" label="学历背景">
        <a-textarea v-model:value="researcherForm.education" placeholder="请输入学历背景" rows="3" />
      </a-form-item>
      
      <a-form-item name="publications" label="代表性论文">
        <a-textarea v-model:value="researcherForm.publications" placeholder="请输入代表性论文" rows="4" />
      </a-form-item>
      
      <a-form-item name="projects" label="参与项目">
        <a-textarea v-model:value="researcherForm.projects" placeholder="请输入参与项目" rows="4" />
      </a-form-item>
      
      <a-form-item name="bio" label="个人简介">
        <a-textarea v-model:value="researcherForm.bio" placeholder="请输入个人简介" rows="4" />
      </a-form-item>
      
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">
          保存信息
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted } from 'vue';
import type { PropType } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import type { ResearcherInfo } from '@/types/auth';

export default defineComponent({
  name: 'ResearcherInfoForm',
  props: {
    userId: {
      type: Number as PropType<number>,
      required: true
    }
  },
  setup(props) {
    const loading = ref(false);
    
    const researcherForm = reactive<Partial<ResearcherInfo>>({
      user_id: props.userId,
      institution: '',
      department: '',
      research_area: '',
      education: '',
      publications: '',
      projects: '',
      bio: ''
    });
    
    // 获取研究人员信息
    const fetchResearcherInfo = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`/api/researcher/info/${props.userId}`);
        if (response.data.success) {
          Object.assign(researcherForm, response.data.data);
        }
      } catch (error) {
        console.error('获取研究人员信息失败', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 更新研究人员信息
    const handleUpdate = async () => {
      loading.value = true;
      try {
        const response = await axios.put('/api/researcher/info', researcherForm);
        if (response.data.success) {
          message.success('研究人员信息更新成功');
        } else {
          message.error(response.data.message || '更新失败');
        }
      } catch (error: any) {
        message.error(error.message || '更新请求失败');
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      fetchResearcherInfo();
    });
    
    return {
      researcherForm,
      loading,
      handleUpdate
    };
  }
});
</script>

<style scoped>
.researcher-info {
  margin-top: 16px;
}
</style> 