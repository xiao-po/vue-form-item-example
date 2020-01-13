<template>
    <el-col v-show="!options.hidden" class=" form-item-small"
            :class="{'has-error': !isModelMode && control.invalid, 'pending': !isModelMode && control.status === 'PENDING'}"
            :span='options.span' :key="options.name">
        <div class="form-item-label" :style='{minWidth: options.labelMinWidth}' :class="[...options.labelClassName]">
            {{options.label}} :
        </div>
        <div class="form-item-control">
            <el-date-picker v-if="options.type === 'date'" v-model="v"
                            :size="options.size"></el-date-picker>
            <el-radio-group v-else-if="options.type === 'radio'" v-model="v" :size="options.size">
                <el-radio-button v-for="option in selectOptions" :label="option.value" :size="options.size"
                                 :value="option.value" :key="option.value">{{option.label}}
                </el-radio-button>
            </el-radio-group>
            <el-cascader
                    v-else-if="options.type === 'cascsder'"
                    :options="selectOptions"
                    :props="{ checkStrictly: true }"
                    clearable></el-cascader>
            <el-select v-else-if="options.type === 'select'" v-model="v" :size="options.size">
                <el-option v-for="option in selectOptions" :label="option.label" :size="options.size"
                           :value="option.value" :key="option.value"></el-option>
            </el-select>
            <slot v-else-if="hasExtra && !DefaultFormControlType.includes(options.type)" name="extra"></slot>
            <el-input v-else :size="options.size" v-model="v" :type='options.type'></el-input>
        </div>
    </el-col>
</template>

<script lang="ts">
    import {Component, Model, Prop, Vue} from "vue-property-decorator";
    import {FormControl} from "@/utils/form-control.model";
    import {FormItemModel, FormOption} from "@/model/base/form.model";

    const DefaultFormControlType = [
        'date',
        'select',
        'textarea',
        'radio',
        'cascsder',
        'text',
    ];

    enum FormItemControlMode {
        control,
        model
    }

    @Component({
        name: "custom-form-item"
    })
    export default class CustomFormItem extends Vue {
        @Model('change')
        value!: string;

        @Prop()
        control!: FormControl;

        @Prop({type: Array, required: false})
        selectOptions!: FormOption[];

        @Prop({type: Object, required: true})
        options!: FormItemModel;

        DefaultFormControlType = DefaultFormControlType;

        mode!: FormItemControlMode;

        data() {
            let controlMode: FormItemControlMode;
            if (this.control) {
                controlMode = FormItemControlMode.control;
            } else if (this.hasOwnProperty('value')) {
                controlMode = FormItemControlMode.model;
            } else {
                controlMode = FormItemControlMode.model;
            }
            if (this.control && this.hasOwnProperty('value')) {
                console.warn('custom-form-item 上绑定了 control 和 v-model，默认使用 control');
            }
            return {
                mode: controlMode,
            }
        }

        get hasExtra() {
            const extraSlot = this.$slots['extra'];
            return extraSlot && extraSlot.length > 0;
        }

        get v(): string {
            switch (this.mode) {
                case FormItemControlMode.control:
                    return this.control.value;
                case FormItemControlMode.model:
                    return this.value;
            }
        }

        set v(newValue: string) {
            this.control.setValue(newValue);
            this.$emit('change', newValue);
        }


        get isModelMode() {
            return this.mode === FormItemControlMode.model;
        }
    }
</script>

<style lang="scss">
    .form-item {
        display: flex;
        padding: 8px 0;

        .form-item-label {
            text-align: center;
            height: 36px;
            min-width: 90px;
            line-height: 36px;


        }


        .form-item-control {
            padding-right: 10px;
            flex: 1;
        }
    }

    .form-item-small {
        display: flex;
        padding: 6px 0;

        &.has-error {
            color: red;

            * {
                border-color: red;
            }
        }

        &.pending {
            color: blue;

            * {
                border-color: blue;
            }
        }

        .form-item-label {
            font-size: 14px;
            text-align: center;
            height: 28px;
            min-width: 90px;
            line-height: 28px;
        }

        .form-item-control {
            padding-right: 10px;
            flex: 1;

            .el-input, .el-select {
                height: 28px;
                width: 100%;
            }
        }
    }

    .form-item-label {
        text-align: center;
        padding-right: 5px;

        &.text-right {
            text-align: right;
        }

        &.text-left {
            text-align: right;
        }
    }

</style>
