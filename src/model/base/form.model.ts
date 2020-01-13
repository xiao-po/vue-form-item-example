export interface FormItemModel<T = any>  {
  label: string;
  name: keyof T;
  type: 'text' | 'date' | 'select' | 'cascader' | string;
  span?: number;
  labelMinWidth?: string;
  labelClassName?: string[];
  disabled?: boolean;
  hidden?: boolean;
  hasError: boolean;
  size?: 'medium' | 'small' | 'mini';
}

export interface FormOption {
  label: string;
  value: any;
  disabled?: boolean;
  children?: FormOption[] | null;
}




export type CascaderSelectOption = FormOption;
export type SelectOption = FormOption;
export type RadioOption = FormOption;
export type SelectOptionMap = {[key: string]: FormOption[]};


export interface FormValidateResult {
  valid: boolean;
  invalid: boolean;
  message?: string;
}
