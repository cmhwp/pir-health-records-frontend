<template>
  <div>
    <h1>地理分布</h1>
    
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card>
          <a-form layout="inline">
            <a-form-item label="数据集">
              <a-select v-model:value="selectedDataset" style="width: 200px">
                <a-select-option value="disease_distribution">疾病分布</a-select-option>
                <a-select-option value="patient_density">患者密度</a-select-option>
                <a-select-option value="hospital_distribution">医院分布</a-select-option>
                <a-select-option value="healthcare_access">医疗资源获取</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="区域级别">
              <a-select v-model:value="regionLevel" style="width: 150px">
                <a-select-option value="country">全国</a-select-option>
                <a-select-option value="province">省级</a-select-option>
                <a-select-option value="city">城市</a-select-option>
                <a-select-option value="district">区县</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="时间范围">
              <a-range-picker v-model:value="dateRange" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="generateMap">
                <template #icon><global-outlined /></template>
                生成地图
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card title="地理分布可视化" :bordered="false" style="margin-bottom: 16px; height: 500px; display: flex; justify-content: center; align-items: center;">
          <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column;">
            <!-- 实际项目中这里应该使用真实的地图组件，如高德地图API、百度地图API等 -->
            <div style="width: 80%; height: 80%; border: 1px dashed #ccc; display: flex; justify-content: center; align-items: center; margin-bottom: 16px;">
              <div style="text-align: center;">
                <h3>{{ mapTitle }}</h3>
                <p>{{ getRegionLevelName() }} | {{ getDatasetName() }}</p>
                <p>地图展示区域（示例）</p>
              </div>
            </div>
            <a-space>
              <a-button>
                <template #icon><download-outlined /></template>
                导出地图
              </a-button>
              <a-button>
                <template #icon><share-alt-outlined /></template>
                分享
              </a-button>
              <a-button>
                <template #icon><setting-outlined /></template>
                地图设置
              </a-button>
            </a-space>
          </div>
        </a-card>
        
        <a-card title="区域数据" :bordered="false">
          <a-table :columns="columns" :data-source="tableData" :pagination="{ pageSize: 5 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'value'">
                <a-progress :percent="record.percentage" size="small" :status="getStatusByValue(record.value)" />
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="地图库" :bordered="false" style="margin-bottom: 16px;">
          <a-list
            :data-source="savedMaps"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="`${item.level} | ${item.createdAt}`">
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.color }">
                      {{ item.level.charAt(0) }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #extra>
                  <a-button size="small" @click="loadMap(item.id)">
                    加载
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
        
        <a-card title="数据摘要" :bordered="false" style="margin-bottom: 16px;">
          <a-statistic
            title="最高发区域"
            value="北京市朝阳区"
            style="margin-bottom: 16px"
          />
          
          <a-statistic
            title="最高值"
            value="182.5"
            style="margin-bottom: 16px"
          />
          
          <a-statistic
            title="最低发区域"
            value="西藏林芝市"
            style="margin-bottom: 16px"
          />
          
          <a-statistic
            title="最低值"
            value="5.2"
            style="margin-bottom: 16px"
          />
          
          <a-statistic
            title="全国平均值"
            value="45.7"
          />
        </a-card>
        
        <a-card title="区域比较" :bordered="false">
          <h4>主要发现</h4>
          <a-typography-paragraph>
            <ul>
              <li>经济发达地区的发病率普遍高于经济欠发达地区</li>
              <li>城市地区的医疗资源获取率显著高于农村地区</li>
              <li>高密度人口区域的疾病传播速度更快</li>
              <li>沿海地区与内陆地区存在明显的健康指标差异</li>
            </ul>
          </a-typography-paragraph>
          
          <a-divider style="margin: 16px 0" />
          
          <a-alert
            message="地区影响因素"
            description="环境因素、生活方式、医疗资源分布是影响地区健康差异的主要因素。"
            type="info"
            show-icon
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { 
  GlobalOutlined, 
  DownloadOutlined,
  ShareAltOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';

// 表单数据
const selectedDataset = ref('disease_distribution');
const regionLevel = ref('province');
const dateRange = ref<[Date, Date] | null>(null);

// 地图标题
const mapTitle = computed(() => {
  return `${getDatasetName()}地理分布图`;
});

// 获取数据集名称
const getDatasetName = () => {
  const datasetNames: Record<string, string> = {
    disease_distribution: '疾病分布',
    patient_density: '患者密度',
    hospital_distribution: '医院分布',
    healthcare_access: '医疗资源获取'
  };
  
  return datasetNames[selectedDataset.value] || '疾病分布';
};

// 获取区域级别名称
const getRegionLevelName = () => {
  const levelNames: Record<string, string> = {
    country: '全国',
    province: '省级',
    city: '城市',
    district: '区县'
  };
  
  return levelNames[regionLevel.value] || '省级';
};

// 表格列定义
const columns = [
  {
    title: '区域名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '百分比',
    dataIndex: 'percentage',
    key: 'percentage',
  },
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank',
  },
];

// 表格数据
const tableData = [
  {
    key: '1',
    name: '北京市',
    value: 182.5,
    percentage: 100,
    rank: 1,
  },
  {
    key: '2',
    name: '上海市',
    value: 165.3,
    percentage: 90,
    rank: 2,
  },
  {
    key: '3',
    name: '广东省',
    value: 142.8,
    percentage: 78,
    rank: 3,
  },
  {
    key: '4',
    name: '江苏省',
    value: 121.4,
    percentage: 67,
    rank: 4,
  },
  {
    key: '5',
    name: '浙江省',
    value: 118.9,
    percentage: 65,
    rank: 5,
  },
  {
    key: '6',
    name: '西藏自治区',
    value: 5.2,
    percentage: 3,
    rank: 31,
  },
];

// 保存的地图
const savedMaps = [
  {
    id: 1,
    title: '2023年全国疾病分布',
    level: '全国',
    createdAt: '2023-05-10',
    color: '#1890ff',
  },
  {
    id: 2,
    title: '华东地区医院分布',
    level: '省级',
    createdAt: '2023-05-12',
    color: '#52c41a',
  },
  {
    id: 3,
    title: '北京市患者密度',
    level: '城市',
    createdAt: '2023-05-15',
    color: '#fa8c16',
  },
  {
    id: 4,
    title: '广州市医疗资源获取',
    level: '区县',
    createdAt: '2023-05-18',
    color: '#722ed1',
  },
];

// 根据值获取状态
const getStatusByValue = (value: number) => {
  if (value > 150) return 'exception';
  if (value > 100) return 'warning';
  return 'normal';
};

// 生成地图
const generateMap = () => {
  console.log('生成地图', {
    dataset: selectedDataset.value,
    regionLevel: regionLevel.value,
    dateRange: dateRange.value,
  });
};

// 加载保存的地图
const loadMap = (id: number) => {
  console.log('加载地图ID:', id);
};
</script>

<style scoped>
</style> 