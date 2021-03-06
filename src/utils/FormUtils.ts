/**
 * @description
 * Defines the map of errors returned from failed validation checks.
 *
 * @publicApi
 */
import {
  FormControl,
  AbstractControlOptions,
  AsyncValidatorFn, CustomFormControlArray, CustomFormControl,
  CustomFormControlGroup,
  ValidatorFn, AbstractControl, FormGroup, FormArray
} from "./form-control.model";

function isAbstractControlOptions(options: AbstractControlOptions | { [key: string]: any }):
    options is AbstractControlOptions {
  return (<AbstractControlOptions>options).asyncValidators !== undefined ||
      (<AbstractControlOptions>options).validators !== undefined;
}

export class FormBuilder {
  static group(
      controlsConfig: {[key: string]: any},
      options: AbstractControlOptions|{[key: string]: any}|null = null): FormGroup {
    const controls = this._reduceControls(controlsConfig);

    let validators: ValidatorFn|ValidatorFn[]|null = null;
    let asyncValidators: AsyncValidatorFn|AsyncValidatorFn[]|null = null;

    if (options != null) {
      if (isAbstractControlOptions(options)) {
        validators = options.validators != null ? options.validators : null;
        asyncValidators = options.asyncValidators != null ? options.asyncValidators : null;
      } else {
        validators = options['validator'] != null ? options['validator'] : null;
        asyncValidators = options['asyncValidator'] != null ? options['asyncValidator'] : null;
      }
    }

    return new CustomFormControlGroup(controls, {asyncValidators, validators});
  }


  static control(
      formState: any, validatorOrOpts?: ValidatorFn|ValidatorFn[]|AbstractControlOptions|null,
      asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null): FormControl {
    return new CustomFormControl(formState, validatorOrOpts, asyncValidator);
  }

  static array(
      controlsConfig: any[],
      validatorOrOpts?: ValidatorFn|ValidatorFn[]|AbstractControlOptions|null,
      asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null): FormArray {
    const controls = controlsConfig.map(c => this._createControl(c));
    return new CustomFormControlArray(controls, validatorOrOpts, asyncValidator);
  }

  /** @internal */
  private static  _reduceControls(controlsConfig: {[k: string]: any}): {[key: string]: AbstractControl} {
    const controls: {[key: string]: AbstractControl} = {};
    Object.keys(controlsConfig).forEach(controlName => {
      controls[controlName] = this._createControl(controlsConfig[controlName]);
    });
    return controls;
  }

  private static _createControl(controlConfig: any): AbstractControl {
    if (controlConfig instanceof CustomFormControl || controlConfig instanceof CustomFormControlGroup ||
        controlConfig instanceof CustomFormControlArray) {
      return controlConfig;

    } else if (Array.isArray(controlConfig)) {
      const value = controlConfig[0];
      const validator: ValidatorFn = controlConfig.length > 1 ? controlConfig[1] : null;
      const asyncValidator: AsyncValidatorFn = controlConfig.length > 2 ? controlConfig[2] : null;
      return this.control(value, validator, asyncValidator) as AbstractControl;

    } else {
      return this.control(controlConfig) as AbstractControl;
    }
  }
}
