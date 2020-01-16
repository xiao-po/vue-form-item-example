export type FormHooks = 'change' | 'blur' | 'submit';
export interface ValidatorFn { (control: AbstractControl): ValidationErrors|null; }
export type ValidationErrors = {
  [key: string]: any
};

enum FormControlStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED'
}

function _find(control: AbstractControl, path: Array<string|number>| string, delimiter: string) {
  if (path == null) return null;

  if (!Array.isArray(path)) {
    path = path.split(delimiter);
  }
  if (Array.isArray(path) && path.length === 0) return null;

  return path.reduce((v: AbstractControl | null, name) => {
    if (v instanceof CustomFormControlGroup) {
      return v.controls.hasOwnProperty(name as string) ? v.controls[name] : null;
    }

    if (v instanceof CustomFormControlArray) {
      return v.at(<number>name) || null;
    }

    return null;
  }, control);
}

export interface AsyncValidatorFn {
  (control: AbstractControl): Promise<ValidationErrors|null>;
}

export interface FormControl<T = any> {
  value: T;
  dirty: boolean;
  /** 是否被修改过 */
  pristine: boolean;
  readonly status: FormControlStatus;
  valid: boolean ;
  invalid: boolean;
  pending: boolean;
  disabled: boolean;
  enabled: boolean;
  errors: ValidationErrors | null;
  parent: AbstractControl;
  root: AbstractControl;

  /**
   * 设置校验器
   * @param newValidator 同步校验器或者同步校验器数组
   * */
  setValidators(newValidator: ValidatorFn|ValidatorFn[]|null): void;

  /**
   * 设置异步校验器
   * @param newValidator 异步校验器或者异步校验器数组
   * */
  setAsyncValidators(newValidator: AsyncValidatorFn|AsyncValidatorFn[]|null): void;

  /**
   * 清除校验器
   * */
  clearValidators(): void;

  /**
   * 清除异步校验器
   * */
  clearAsyncValidators(): void;

  /**
   * 设置状态为 disabled
   * */
  disable(): void;

  /**
   * 设置状态为 非disabled
   * */
  enable(): void;

  setParent(parent: AbstractControlCollection): void;

  /**
   * 设置值
   * @param value 数据
   * */
  setValue(value: any): void;

  /**
   * 重置值
   * @param value 重置的数据
   * */
  reset(value?: any): void;

  /**
   *  更新当前 FormArray/FormGroup 的值并且重新校验
   * */
  updateValueAndValidity(): void;


  /**
   *  设置当前 control 的数据已经被修改过
   * */
  markAsDirty(): void;

  /**
   *  设置当前 control 的数据不是原始值
   * */
  markAsPristine(): void;

  /**
   *  设置当前 control 的数据不是原始值
   *  @param errors 校验错误
   * */
  setErrors(errors: ValidationErrors|null): void;

  /**
   *  设置当前 control 的数据不是原始值
   *  @param errorCode 错误关键字
   *  @param path
   *  @return
   * */
  getError(errorCode: string, path?: Array<string|number>|string): any;


  /**
   *  设置当前 control 的数据不是原始值
   *  @param path 属性名
   *  @return FormControl
   * */
  get(path: Array<string|number>|string): AbstractControl|null;


  /**
   *  设置当前 control 的数据不是原始值
   *  @param errorCode 属性名
   *  @param path 路径
   *  @return boolean
   * */
  hasError(errorCode: string, path?: Array<string|number>|string): boolean;
}

export interface CustomFormControlCollection extends FormControl{
  updateAllValueAndValidity(): void;
}

export interface FormGroup extends CustomFormControlCollection {
  controls:  { [key: string]: FormControl | FormArray | FormGroup };

  registerControl(name: string, control: FormControl): FormControl;
  addControl(name: string, control: FormControl): void;
  setControl(name: string, control: FormControl): void;
  contains(controlName: string): boolean;
  removeControl(name: string): void;
  getRawValue(): any;
}

export interface FormArray extends CustomFormControlCollection{
  updateAllValueAndValidity(): void;
  controls:  FormControl[] | FormArray[] | FormGroup[];
  length: number;
  at(index: number): FormControl;
  push(control: FormControl): void;
  insert(index: number, control: FormControl): void;
  removeAt(index: number): void;
  setControl(index: number, control: FormControl): void;
  reset(value: any): void;
  getRawValue(): any[];
  clear(): void;
}


export abstract class AbstractControl implements  FormControl {

  _onCollectionChange = () => {};

  protected _parent !: AbstractControlCollection;

  get dirty(): boolean { return !this.pristine; }

  protected _value: any;

  get value() {
    return this._value;
  }

  set value(v) {
    this.setValue(v);
  }


  public readonly pristine: boolean = true;


  constructor(public validator: ValidatorFn[]|null, public asyncValidator: AsyncValidatorFn[]|null) {}

  public readonly status !: FormControlStatus;

  get valid(): boolean { return this.status === FormControlStatus.VALID; }

  get invalid(): boolean { return this.status === FormControlStatus.INVALID; }

  get pending(): boolean { return this.status == FormControlStatus.PENDING; }

  get disabled(): boolean { return this.status === FormControlStatus.DISABLED; }

  get enabled(): boolean { return this.status !== FormControlStatus.DISABLED; }

  public readonly errors !: ValidationErrors | null;


  get parent(): AbstractControlCollection { return this._parent; }

  setValidators(newValidator: ValidatorFn|ValidatorFn[]|null): void {
    if(newValidator) {
      if (Array.isArray(newValidator)) {
        this.validator = newValidator;
      } else {
        this.validator = [newValidator];
      }
    } else {
      this.clearValidators();
    }
  }

  setAsyncValidators(newValidator: AsyncValidatorFn|AsyncValidatorFn[]|null): void {
    if(newValidator) {
      if (Array.isArray(newValidator)) {
        this.asyncValidator = newValidator;
      } else {
        this.asyncValidator = [newValidator];
      }
    } else {
      this.clearAsyncValidators();
    }
  }

  clearValidators(): void { this.validator = null; }

  clearAsyncValidators(): void { this.asyncValidator = null; }

  disable(): void {

    (this as{status: string}).status = FormControlStatus.DISABLED;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  enable(): void {
    (this as{status: string}).status = FormControlStatus.VALID;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  setParent(parent: AbstractControlCollection): void { this._parent = parent; }

  abstract setValue(value: any): void;

  abstract reset(value?: any): void;

  updateValueAndValidity(): void {
    this._setInitialStatus();
    if (this.enabled) {
      (this as{errors: ValidationErrors | null}).errors = this._runValidator();
      (this as{status: string}).status = this._calculateStatus();

      if (this.status === FormControlStatus.VALID || this.status === FormControlStatus.PENDING) {
        this._runAsyncValidator();
      }
    }

  }



  markAsDirty(): void {
    (this as{pristine: boolean}).pristine = false;

    if (this._parent) {
      this._parent.markAsDirty();
    }
  }
  markAsPristine(): void {
    (this as{pristine: boolean}).pristine = true;

    if (this._parent) {
      this._parent._updatePristine();
    }
  }

  /** @internal */
  _updateTreeValidity(opts: {emitEvent?: boolean} = {emitEvent: true}) {
    this.updateValueAndValidity();
  }

  protected _setInitialStatus() {
    (this as{status: string}).status = this._allControlsDisabled() ? FormControlStatus.DISABLED : FormControlStatus.VALID;
  }

  protected _runValidator(): ValidationErrors|null {
    let result: any = null;
    if (this.validator && this.validator.length > 0) {
      let tempResult: any = {};
      for(const validator of this.validator) {
        const error = validator(this);
        if (error) {
          tempResult = {
            ...tempResult,
            error
          }
        }
      }
      for(const key in tempResult) {
        if (!tempResult[key]) {
          delete tempResult[key]
        }
      }
      if (Object.keys(tempResult).length > 0) {
        result = tempResult;
      }
    }

    return result;
  }

  protected asyncValidatorFiredTime: Date = new Date();
  protected async _runAsyncValidator(): Promise<void> {
    const nowDate = new Date();
    this.asyncValidatorFiredTime = nowDate;
    if (this.asyncValidator) {
      const result: any = {};
      (this as{status: string}).status = FormControlStatus.PENDING;
      if (this.asyncValidator.length > 0) {
        let tempResult: any = {};
        for(const validator of this.asyncValidator) {
          const error = await validator(this);
          if (nowDate.getTime() === this.asyncValidatorFiredTime.getTime()) {
            return;
          }
          if (error) {
            tempResult = {
              ...result,
              tempResult
            }
          }
        }
        for(const key in tempResult) {
          if (!tempResult[key]) {
            result[key] = true;
          }
        }
      }
      if (nowDate.getTime() === this.asyncValidatorFiredTime.getTime()) {
        this.setErrors(result);
      }
    }
  }

  setErrors(errors: ValidationErrors|null): void {
    (this as{errors: ValidationErrors | null}).errors = errors;
    this._updateControlsErrors();
  }

  get(path: Array<string|number>|string): AbstractControl|null { return _find(this, path, '.'); }


  getError(errorCode: string, path?: Array<string|number>|string): any {
    const control = path ? this.get(path) : this;
    return control && control.errors ? control.errors[errorCode] : null;
  }


  hasError(errorCode: string, path?: Array<string|number>|string): boolean {
    return !!this.getError(errorCode, path);
  }

  get root(): AbstractControl {
    let x: AbstractControl = this;

    while (x._parent) {
      x = x._parent;
    }

    return x;
  }

  /** @internal */
  _updateControlsErrors(): void {
    (this as{status: string}).status = this._calculateStatus();
  }


  protected _calculateStatus(): string {
    if (this._allControlsDisabled()) return FormControlStatus.DISABLED;
    if (this.errors) return FormControlStatus.INVALID;
    return FormControlStatus.VALID;
  }



  abstract _syncPendingControls(): boolean;


  abstract _allControlsDisabled(): boolean;

  _onDisabledChange: Function[] = [];

  _isBoxedValue(formState: any): boolean {
    return typeof formState === 'object' && formState !== null &&
        Object.keys(formState).length === 2 && 'value' in formState && 'disabled' in formState;
  }

  _registerOnCollectionChange(fn: () => void): void { this._onCollectionChange = fn; }


}

abstract class AbstractControlCollection extends AbstractControl implements CustomFormControlCollection{
  /** @internal */
  abstract _updateValue(): void;

  updateValueAndValidity(): void {
    this._setInitialStatus();
    this._updateValue();

    if (this.enabled) {
      (this as{errors: ValidationErrors | null}).errors = this._runValidator();
      (this as{status: string}).status = this._calculateStatus();

      if (this.status === FormControlStatus.VALID || this.status === FormControlStatus.PENDING) {
        this._runAsyncValidator();
      }
    }

  }

  disable(): void {

    (this as{status: string}).status = FormControlStatus.DISABLED;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._forEachChild(
        (control: AbstractControl) => { control.disable(); });
    this._updateValue();
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  enable(): void {
    (this as{status: string}).status = FormControlStatus.VALID;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._forEachChild(
        (control: AbstractControl) => { control.disable(); });
    this._updateValue();
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  _anyControlsDirty(): boolean {
    return this._anyControls((control: AbstractControl) => control.dirty);
  }

  abstract _forEachChild(cb: Function): void;

  abstract _anyControls(condition: Function): boolean;

  _anyControlsHaveStatus(status: string): boolean {
    return this._anyControls((control: AbstractControl) => control.status === status);
  }

  protected _calculateStatus(): string {
    if (this._allControlsDisabled()) return FormControlStatus.DISABLED;
    if (this.errors) return FormControlStatus.INVALID;
    if (this._anyControlsHaveStatus(FormControlStatus.PENDING)) return FormControlStatus.PENDING;
    if (this._anyControlsHaveStatus(FormControlStatus.INVALID)) return FormControlStatus.INVALID;
    return FormControlStatus.VALID;
  }

  _updatePristine(): void {
    (this as{pristine: boolean}).pristine = !this._anyControlsDirty();

    if (this._parent) {
      this._parent._updatePristine();
    }
  }

  markAsPristine(): void {
    (this as{pristine: boolean}).pristine = true;

    this._forEachChild((control: AbstractControl) => { control.markAsPristine(); });

    if (this._parent) {
      this._parent._updatePristine();
    }
  }

  updateAllValueAndValidity() {
    this._anyControls((control: AbstractControl) => {
      if (control instanceof AbstractControlCollection) {
        control.updateAllValueAndValidity();
      } else {
        control.updateValueAndValidity();
      }
    });
    this._setInitialStatus();
    this._updateValue();

    if (this.enabled) {
      (this as{errors: ValidationErrors | null}).errors = this._runValidator();
      (this as{status: string}).status = this._calculateStatus();

      if (this.status === FormControlStatus.VALID || this.status === FormControlStatus.PENDING) {
        this._runAsyncValidator();
      }
    }
  }
}

export interface AbstractControlOptions {
  /**
   * @description
   * The list of validators applied to a control.
   */
  validators?: ValidatorFn|ValidatorFn[]|null;
  /**
   * @description
   * The list of async validators applied to control.
   */
  asyncValidators?: AsyncValidatorFn|AsyncValidatorFn[]|null;
}

function isOptionsObj(
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): boolean {
  return validatorOrOpts != null && !Array.isArray(validatorOrOpts) &&
      typeof validatorOrOpts === 'object';
}

function coerceToValidator(
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): ValidatorFn[] |
    null {
  const validator =
      (isOptionsObj(validatorOrOpts) ? (validatorOrOpts as AbstractControlOptions).validators :
          validatorOrOpts) as ValidatorFn |
          ValidatorFn[] | null;
  if (Array.isArray(validator)) {
    return validator;
  } else if (validator) {
    return [validator];
  } else {
    return null;
  }
}

function coerceToAsyncValidator(
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null, validatorOrOpts?: ValidatorFn |
        ValidatorFn[] | AbstractControlOptions | null): AsyncValidatorFn[] | null {
  const origAsyncValidator =
      (isOptionsObj(validatorOrOpts) ? (validatorOrOpts as AbstractControlOptions).asyncValidators :
          asyncValidator) as AsyncValidatorFn |
          AsyncValidatorFn | null;
  if (Array.isArray(asyncValidator)) {
    return asyncValidator;
  } else if (asyncValidator) {
    return [asyncValidator];
  } else {
    return null;
  }
}

export class CustomFormControl extends AbstractControl {

  /** @internal */
  _pendingValue: any;

  /** @internal */
  _pendingChange: any;

  constructor(
      formState: any = null,
      validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
      asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null) {
    super(
        coerceToValidator(validatorOrOpts),
        coerceToAsyncValidator(asyncValidator, validatorOrOpts));

    this._applyFormState(formState);
    this.updateValueAndValidity();
  }

  setErrors(errors: ValidationErrors | null): void {
    (this as { errors: ValidationErrors | null }).errors = errors;
    this._updateControlsErrors();
  }

  hasError(errorCode: string, path?: Array<string | number> | string): boolean {
    return !!this.getError(errorCode, path);
  }

  /** @internal */
  _syncPendingControls(): boolean {
    return false;
  }


  reset(formState: any = null, options: {onlySelf?: boolean, emitEvent?: boolean} = {}): void {
    this.setValue(this._value, options);
    this.markAsPristine();
    this._applyFormState(formState);
    this._pendingChange = false;
  }

  setValue(value: any, options: {
    onlySelf?: boolean,
    emitEvent?: boolean,
    emitModelToViewChange?: boolean,
    emitViewToModelChange?: boolean
  } = {}): void {
    this._value = this._pendingValue = value;
    this.markAsDirty();
    this.updateValueAndValidity();
  }
  protected _applyFormState(formState: any) {
    if (this._isBoxedValue(formState)) {
      this._value = this._pendingValue = formState.value;
      formState.FormControlStatus.disabled ? this.disable() :
          this.enable();
    } else {
      this._value = this._pendingValue = formState;
    }
  }


  /** @internal */
  _allControlsDisabled(): boolean {
    return  this.disabled;
  };

}



export class CustomFormControlGroup extends AbstractControlCollection implements FormGroup{
  constructor(
      public controls: { [key: string]: AbstractControl },
      validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
      asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null) {
    super(
        coerceToValidator(validatorOrOpts),
        coerceToAsyncValidator(asyncValidator, validatorOrOpts));
    this._setUpControls();
    this.updateValueAndValidity();
  }

  registerControl(name: string, control: AbstractControl): AbstractControl {
    if (this.controls[name]) return this.controls[name];
    this.controls[name] = control;
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
    return control;
  }

  addControl(name: string, control: AbstractControl): void {
    this.registerControl(name, control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  setControl(name: string, control: AbstractControl): void {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange(() => {
    });
    delete (this.controls[name]);
    if (control) this.registerControl(name, control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }
  contains(controlName: string): boolean {
    return this.controls.hasOwnProperty(controlName) && this.controls[controlName].enabled;
  }
  reset(value: any = {}): void {
    this._forEachChild((control: AbstractControl, name: string) => {
      control.reset(value[name]);
    });
    this.updateValueAndValidity();
  }


  setValue(value: {[key: string]: any}):
      void {
    this._checkAllValuesPresent(value);
    Object.keys(value).forEach(name => {
      this._throwIfControlMissing(name);
      this.controls[name].setValue(value[name]);
    });
    this.markAsDirty();
    this.updateValueAndValidity();
  }


  removeControl(name: string): void {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange(() => {
    });
    delete (this.controls[name]);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }


  /**
   * The aggregate value of the `FormGroup`, including any FormControlStatus.disabled controls.
   *
   * Retrieves all values regardless of FormControlStatus.disabled status.
   * The `value` property is the best way to get the value of the group, because
   * it excludes FormControlStatus.disabled controls in the `FormGroup`.
   */
  getRawValue(): any {
    return this._reduceChildren(
        {}, (acc: {[k: string]: AbstractControl}, control: AbstractControl, name: string) => {
          acc[name] = control instanceof CustomFormControl ? control.value : (<any>control).getRawValue();
          return acc;
        });
  }

  /** @internal */
  _syncPendingControls(): boolean {
    let subtreeUpdated = this._reduceChildren(false, (updated: boolean, child: AbstractControl) => {
      return child._syncPendingControls() ? true : updated;
    });
    if (subtreeUpdated) this.updateValueAndValidity();
    return subtreeUpdated;
  }

  /** @internal */
  _throwIfControlMissing(name: string): void {
    if (!Object.keys(this.controls).length) {
      throw new Error(`
        There are no form controls registered with this group yet.  If you're using ngModel,
        you may want to check next tick (e.g. use setTimeout).
      `);
    }
    if (!this.controls[name]) {
      throw new Error(`Cannot find form control with name: ${name}.`);
    }
  }

  /** @internal */
  _forEachChild(cb: (v: any, k: string) => void): void {
    Object.keys(this.controls).forEach(k => cb(this.controls[k], k));
  }

  /** @internal */
  _setUpControls(): void {
    this._forEachChild((control: AbstractControl) => {
      control.setParent(this);
      control._registerOnCollectionChange(this._onCollectionChange);
    });
  }

  /** @internal */
  _updateValue(): void { this._value = this._reduceValue(); }

  /** @internal */
  _anyControls(condition: Function): boolean {
    let res = false;
    this._forEachChild((control: AbstractControl, name: string) => {
      res = res || (this.contains(name) && condition(control));
    });
    return res;
  }

  /** @internal */
  _reduceValue() {
    return this._reduceChildren(
        {}, (acc: {[k: string]: AbstractControl}, control: AbstractControl, name: string) => {
          if (control.enabled || this.disabled) {
            acc[name] = control.value;
          }
          return acc;
        });
  }

  /** @internal */
  _reduceChildren(initValue: any, fn: Function) {
    let res = initValue;
    this._forEachChild(
        (control: AbstractControl, name: string) => { res = fn(res, control, name); });
    return res;
  }

  /** @internal */
  _allControlsDisabled(): boolean {
    for (const controlName of Object.keys(this.controls)) {
      if (this.controls[controlName].enabled) {
        return false;
      }
    }
    return Object.keys(this.controls).length > 0 || this.disabled;
  }

  /** @internal */
  _checkAllValuesPresent(value: any): void {
    this._forEachChild((control: AbstractControl, name: string) => {
      if (value[name] === undefined) {
        throw new Error(`Must supply a value for form control with name: '${name}'.`);
      }
    });
  }
}

export class CustomFormControlArray extends AbstractControlCollection implements FormArray {
  /**
   * Creates a new `FormArray` instance.
   *
   * @param controls An array of child controls. Each child control is given an index
   * where it is registered.
   *
   * @param validatorOrOpts A synchronous validator function, or an array of
   * such functions, or an `AbstractControlOptions` object that contains validation functions
   * and a validation trigger.
   *
   * @param asyncValidator A single async validator or array of async validator functions
   *
   */
  constructor(
      public controls: AbstractControl[],
      validatorOrOpts?: ValidatorFn|ValidatorFn[]|AbstractControlOptions|null,
      asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null) {
    super(
        coerceToValidator(validatorOrOpts),
        coerceToAsyncValidator(asyncValidator, validatorOrOpts));
    this._setUpControls();
    this.updateValueAndValidity();
  }

  /**
   * Get the `AbstractControl` at the given `index` in the array.
   *
   * @param index Index in the array to retrieve the control
   */
  at(index: number): AbstractControl { return this.controls[index]; }

  /**
   * Insert a new `AbstractControl` at the end of the array.
   *
   * @param control Form control to be inserted
   */
  push(control: AbstractControl): void {
    this.controls.push(control);
    this._registerControl(control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * Insert a new `AbstractControl` at the given `index` in the array.
   *
   * @param index Index in the array to insert the control
   * @param control Form control to be inserted
   */
  insert(index: number, control: AbstractControl): void {
    this.controls.splice(index, 0, control);

    this._registerControl(control);
    this.updateValueAndValidity();
  }

  removeAt(index: number): void {
    if (this.controls[index]) this.controls[index]._registerOnCollectionChange(() => {});
    this.controls.splice(index, 1);
    this.updateValueAndValidity();
  }

  setControl(index: number, control: AbstractControl): void {
    if (this.controls[index]) this.controls[index]._registerOnCollectionChange(() => {});
    this.controls.splice(index, 1);

    if (control) {
      this.controls.splice(index, 0, control);
      this._registerControl(control);
    }

    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  get length(): number { return this.controls.length; }

  setValue(value: any[]): void {
    this._checkAllValuesPresent(value);
    value.forEach((newValue: any, index: number) => {
      this._throwIfControlMissing(index);
      this.at(index).setValue(newValue);
    });
    this.markAsDirty();
    this.updateValueAndValidity();
  }

  reset(value: any = []): void {
    this._forEachChild((control: AbstractControl, index: number) => {
      control.reset(value[index]);
    });
    this.updateValueAndValidity();
  }

  getRawValue(): any[] {
    return this.controls.map((control: AbstractControl) => {
      return control instanceof CustomFormControl ? control.value : (<any>control).getRawValue();
    });
  }

  clear(): void {
    if (this.controls.length < 1) return;
    this._forEachChild((control: AbstractControl) => control._registerOnCollectionChange(() => {}));
    this.controls.splice(0);
    this.updateValueAndValidity();
  }

  /** @internal */
  _syncPendingControls(): boolean {
    let subtreeUpdated = this.controls.reduce((updated: boolean, child: AbstractControl) => {
      return child._syncPendingControls() ? true : updated;
    }, false);
    if (subtreeUpdated) this.updateValueAndValidity();
    return subtreeUpdated;
  }

  /** @internal */
  _throwIfControlMissing(index: number): void {
    if (!this.controls.length) {
      throw new Error(`
        There are no form controls registered with this array yet.  If you're using ngModel,
        you may want to check next tick (e.g. use setTimeout).
      `);
    }
    if (!this.at(index)) {
      throw new Error(`Cannot find form control at index ${index}`);
    }
  }

  /** @internal */
  _forEachChild(cb: Function): void {
    this.controls.forEach((control: AbstractControl, index: number) => { cb(control, index); });
  }

  /** @internal */
  _updateValue(): void {
    this._value =
        this.controls.filter((control) => control.enabled || this.disabled)
            .map((control) => control.value);
  }

  /** @internal */
  _anyControls(condition: Function): boolean {
    return this.controls.some((control: AbstractControl) => control.enabled && condition(control));
  }

  /** @internal */
  _setUpControls(): void {
    this._forEachChild((control: AbstractControl) => this._registerControl(control));
  }

  /** @internal */
  _checkAllValuesPresent(value: any): void {
    this._forEachChild((control: AbstractControl, i: number) => {
      if (value[i] === undefined) {
        throw new Error(`Must supply a value for form control at index: ${i}.`);
      }
    });
  }

  /** @internal */
  _allControlsDisabled(): boolean {
    for (const control of this.controls) {
      if (control.enabled) return false;
    }
    return this.controls.length > 0 || this.disabled;
  }

  protected _registerControl(control: AbstractControl) {
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
  }
}


