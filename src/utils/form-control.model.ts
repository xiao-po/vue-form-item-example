export type FormHooks = 'change' | 'blur' | 'submit';
/**
 * @description
 * A function that receives a control and synchronously returns a map of
 * validation errors if present, otherwise null.
 *
 * @publicApi
 */

export interface ValidatorFn { (control: AbstractControl): ValidationErrors|null; }
export type ValidationErrors = {
  [key: string]: any
};
/**
 * Reports that a FormControl is valid, meaning that no errors exist in the input value.
 *
 * @see `status`
 */
export const VALID = 'VALID';

/**
 * Reports that a FormControl is invalid, meaning that an error exists in the input value.
 *
 * @see `status`
 */
export const INVALID = 'INVALID';

/**
 * Reports that a FormControl is pending, meaning that that async validation is occurring and
 * errors are not yet available for the input value.
 *
 * @see `markAsPending`
 * @see `status`
 */
export const PENDING = 'PENDING';

/**
 * Reports that a FormControl is disabled, meaning that the control is exempt from ancestor
 * calculations of validity or value.
 *
 * @see `markAsDisabled`
 * @see `status`
 */
export const DISABLED = 'DISABLED';

function _find(control: AbstractControl, path: Array<string|number>| string, delimiter: string) {
  if (path == null) return null;

  if (!Array.isArray(path)) {
    path = path.split(delimiter);
  }
  if (Array.isArray(path) && path.length === 0) return null;

  return path.reduce((v: AbstractControl | null, name) => {
    if (v instanceof FormGroup) {
      return v.controls.hasOwnProperty(name as string) ? v.controls[name] : null;
    }

    if (v instanceof FormArray) {
      return v.at(<number>name) || null;
    }

    return null;
  }, control);
}

/**
 * @description
 * A function that receives a control and returns a Promise or observable
 * that emits validation errors if present, otherwise null.
 *
 * @publicApi
 */
export interface AsyncValidatorFn {
  (control: AbstractControl): Promise<ValidationErrors|null>;
}


/**
 * This is the base class for `FormControl`, `FormGroup`, and `FormArray`.
 *
 * It provides some of the shared behavior that all controls and groups of controls have, like
 * running validators, calculating status, and resetting state. It also defines the properties
 * that are shared between all sub-classes, like `value`, `valid`, and `dirty`. It shouldn't be
 * instantiated directly.
 *
 * @see [Forms Guide](/guide/forms)
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 * @see [Dynamic Forms Guide](/guide/dynamic-form)
 *
 * @publicApi
 */
export abstract class AbstractControl {

  /** @internal */
  _onCollectionChange = () => {};


  // TODO(issue/24571): remove '!'.
  private _parent !: FormGroup | FormArray;



  public readonly value: any;


  constructor(public validator: ValidatorFn[]|null, public asyncValidator: AsyncValidatorFn[]|null) {}



  public readonly status !: string;

  get valid(): boolean { return this.status === VALID; }

  get invalid(): boolean { return this.status === INVALID; }

  get pending(): boolean { return this.status == PENDING; }

  get disabled(): boolean { return this.status === DISABLED; }

  get enabled(): boolean { return this.status !== DISABLED; }

  public readonly errors !: ValidationErrors | null;


  get parent(): FormGroup|FormArray { return this._parent; }

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

    (this as{status: string}).status = DISABLED;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._forEachChild(
      (control: AbstractControl) => { control.disable(); });
    this._updateValue();
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  enable(): void {
    (this as{status: string}).status = VALID;
    (this as{errors: ValidationErrors | null}).errors = null;
    this._forEachChild(
      (control: AbstractControl) => { control.disable(); });
    this._updateValue();
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }

  setParent(parent: FormGroup|FormArray): void { this._parent = parent; }

  abstract setValue(value: any): void;

  abstract reset(value?: any): void;

  updateValueAndValidity(): void {
    this._setInitialStatus();
    this._updateValue();

    if (this.enabled) {
      (this as{errors: ValidationErrors | null}).errors = this._runValidator();
      (this as{status: string}).status = this._calculateStatus();

      if (this.status === VALID || this.status === PENDING) {
        this._runAsyncValidator();
      }
    }

  }

  /** @internal */
  _updateTreeValidity(opts: {emitEvent?: boolean} = {emitEvent: true}) {
    this._forEachChild((ctrl: AbstractControl) => ctrl._updateTreeValidity(opts));
    this.updateValueAndValidity();
  }

  private _setInitialStatus() {
    (this as{status: string}).status = this._allControlsDisabled() ? DISABLED : VALID;
  }

  private _runValidator(): ValidationErrors|null {
    let result: any = null;
    if (this.validator && this.validator.length > 0) {
      let tempResult = {};
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
        // @ts-ignore
        if (!tempResult[key]) {
          // @ts-ignore
          delete tempResult[key]
        }
      }
      if (Object.keys(tempResult).length > 0) {
        result = tempResult;
      }
    }

    return result;
  }

  private asyncValidatorFiredTime: Date = new Date();
  private async _runAsyncValidator(): Promise<void> {
    const nowDate = new Date();
    this.asyncValidatorFiredTime = nowDate;
    if (this.asyncValidator) {
      const result = {};
      (this as{status: string}).status = PENDING;
      if (this.asyncValidator.length > 0) {
        let tempResult = {};
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
          // @ts-ignore
          if (tempResult[key]) {
            // @ts-ignore
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


  private _calculateStatus(): string {
    if (this._allControlsDisabled()) return DISABLED;
    if (this.errors) return INVALID;
    if (this._anyControlsHaveStatus(PENDING)) return PENDING;
    if (this._anyControlsHaveStatus(INVALID)) return INVALID;
    return VALID;
  }

  /** @internal */
  abstract _updateValue(): void;

  /** @internal */
  abstract _forEachChild(cb: Function): void;

  /** @internal */
  abstract _anyControls(condition: Function): boolean;

  /** @internal */
  abstract _allControlsDisabled(): boolean;

  /** @internal */
  abstract _syncPendingControls(): boolean;

  /** @internal */
  _anyControlsHaveStatus(status: string): boolean {
    return this._anyControls((control: AbstractControl) => control.status === status);
  }



  /** @internal */
  _onDisabledChange: Function[] = [];

  /** @internal */
  _isBoxedValue(formState: any): boolean {
    return typeof formState === 'object' && formState !== null &&
      Object.keys(formState).length === 2 && 'value' in formState && 'disabled' in formState;
  }

  /** @internal */
  _registerOnCollectionChange(fn: () => void): void { this._onCollectionChange = fn; }


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

export class FormControl extends AbstractControl {

  private _value = null;

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


  _updateValue() {
  }

  _anyControls(condition: Function): boolean {
    return false;
  }

  _allControlsDisabled(): boolean {
    return this.disabled;
  }

  _forEachChild(cb: Function): void {
  }

  /** @internal */
  _syncPendingControls(): boolean {
    return false;
  }


  reset(formState: any = null, options: {onlySelf?: boolean, emitEvent?: boolean} = {}): void {
    this.setValue(this.value, options);
    this._applyFormState(formState);
    this._pendingChange = false;
  }

  setValue(value: any, options: {
    onlySelf?: boolean,
    emitEvent?: boolean,
    emitModelToViewChange?: boolean,
    emitViewToModelChange?: boolean
  } = {}): void {
    (this as{value: any}).value = this._pendingValue = value;
    this.updateValueAndValidity();
  }
  private _applyFormState(formState: any) {
    if (this._isBoxedValue(formState)) {
      (this as{value: any}).value = this._pendingValue = formState.value;
      formState.disabled ? this.disable() :
        this.enable();
    } else {
      (this as{value: any}).value = this._pendingValue = formState;
    }
  }
}

export class FormGroup extends AbstractControl {
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
   * The aggregate value of the `FormGroup`, including any disabled controls.
   *
   * Retrieves all values regardless of disabled status.
   * The `value` property is the best way to get the value of the group, because
   * it excludes disabled controls in the `FormGroup`.
   */
  getRawValue(): any {
    return this._reduceChildren(
      {}, (acc: {[k: string]: AbstractControl}, control: AbstractControl, name: string) => {
        acc[name] = control instanceof FormControl ? control.value : (<any>control).getRawValue();
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
  _updateValue(): void { (this as{value: any}).value = this._reduceValue(); }

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

export class FormArray extends AbstractControl {
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

  /**
   * Remove the control at the given `index` in the array.
   *
   * @param index Index in the array to remove the control
   */
  removeAt(index: number): void {
    if (this.controls[index]) this.controls[index]._registerOnCollectionChange(() => {});
    this.controls.splice(index, 1);
    this.updateValueAndValidity();
  }

  /**
   * Replace an existing control.
   *
   * @param index Index in the array to replace the control
   * @param control The `AbstractControl` control to replace the existing control
   */
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

  /**
   * Length of the control array.
   */
  get length(): number { return this.controls.length; }

  /**
   * Sets the value of the `FormArray`. It accepts an array that matches
   * the structure of the control.
   *
   * This method performs strict checks, and throws an error if you try
   * to set the value of a control that doesn't exist or if you exclude the
   * value of a control.
   *
   * @usageNotes
   * ### Set the values for the controls in the form array
   *
   * ```
   * const arr = new FormArray([
   *   new FormControl(),
   *   new FormControl()
   * ]);
   * console.log(arr.value);   // [null, null]
   *
   * arr.setValue(['Nancy', 'Drew']);
   * console.log(arr.value);   // ['Nancy', 'Drew']
   * ```
   *
   * @param value Array of values for the controls
   * @param options Configure options that determine how the control propagates changes and
   * emits events after the value changes
   *
   * * `onlySelf`: When true, each change only affects this control, and not its parent. Default
   * is false.
   * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
   * `valueChanges`
   * observables emit events with the latest status and value when the control value is updated.
   * When false, no events are emitted.
   * The configuration options are passed to the {@link AbstractControl#updateValueAndValidity
   * updateValueAndValidity} method.
   */
  setValue(value: any[], options: {onlySelf?: boolean, emitEvent?: boolean} = {}): void {
    this._checkAllValuesPresent(value);
    value.forEach((newValue: any, index: number) => {
      this._throwIfControlMissing(index);
      this.at(index).setValue(newValue);
    });
    this.updateValueAndValidity();
  }

  reset(value: any = [], options: {onlySelf?: boolean, emitEvent?: boolean} = {}): void {
    this._forEachChild((control: AbstractControl, index: number) => {
      control.reset(value[index]);
    });
    this.updateValueAndValidity();
  }

  /**
   * The aggregate value of the array, including any disabled controls.
   *
   * Reports all values regardless of disabled status.
   * For enabled controls only, the `value` property is the best way to get the value of the array.
   */
  getRawValue(): any[] {
    return this.controls.map((control: AbstractControl) => {
      return control instanceof FormControl ? control.value : (<any>control).getRawValue();
    });
  }

  /**
   * Remove all controls in the `FormArray`.
   *
   * @usageNotes
   * ### Remove all elements from a FormArray
   *
   * ```ts
   * const arr = new FormArray([
   *    new FormControl(),
   *    new FormControl()
   * ]);
   * console.log(arr.length);  // 2
   *
   * arr.clear();
   * console.log(arr.length);  // 0
   * ```
   *
   * It's a simpler and more efficient alternative to removing all elements one by one:
   *
   * ```ts
   * const arr = new FormArray([
   *    new FormControl(),
   *    new FormControl()
   * ]);
   *
   * while (arr.length) {
   *    arr.removeAt(0);
   * }
   * ```
   */
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
    (this as{value: any}).value =
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

  private _registerControl(control: AbstractControl) {
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
  }
}


// @ts-ignore
function debounce(fn, delay = 100) {
  // @ts-ignore
  let timer;
  return function() {
    // @ts-ignore
    const context = this;
    const args = arguments;
    // @ts-ignore
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(context, args)
    }, delay)
  }
}
