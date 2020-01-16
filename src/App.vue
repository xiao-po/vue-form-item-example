<template>
  <div id="app">
    <custom-form-item @change="validate" v-for="item in formItemList" :options="item" :control="formModel.controls[item.name]" :key="item.name">

    </custom-form-item>
    <el-col :span="12">
      <el-button type="primary" @click="submit" :disabled="formModel.invalid">submit</el-button>
    </el-col>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CustomFormItem from "@/components/form/custom-form-item.vue";
import {FormItemModel} from "@/model/base/form.model";
import {FormBuilder} from "@/utils/FormUtils";
import {AbstractControl} from "@/utils/form-control.model";
export const ApplicantFormItemList: FormItemModel[] = ([
  {name: 'name', label: '姓名', type: 'text'},
  {name: 'birthday', label: '生日', type: 'date'},
]).map(item => ({
  span: 8,
  labelMinWidth: '90px',
  labelClassName: ['text-right'],
  size: 'mini',
  ...item,
} as FormItemModel));

const Required = (v: AbstractControl) => {
  if (v.value === '' || v.value === null || v.value === undefined) {
    return {required: true};
  }
  return null;
};

@Component({
  components: {
    CustomFormItem
  },
})
export default class App extends Vue {
  formItemList = ApplicantFormItemList;

  formModel = FormBuilder.group({
    name: ['', Required],
    birthday: '',
  });

  created(): void {
  }

  validate() {
    this.formModel.updateValueAndValidity();
  }

  submit() {
    this.validate();
    if (this.formModel.valid) {
      this.$message.info('提交');
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
