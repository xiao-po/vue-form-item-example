export enum SysEnumType {
  /**权利性质 */
  qlxz = 'QLXZ',
  /**权利类型 */
  qllx = 'QLLX',
  /**权利设定方式 */
  qlsdfs = 'QLSDFS',
  /**登记类型 */
  djlx = 'DJLX',
  /**土地用途 */
  tdyt = 'TDYT',
  /**房屋用途 */
  fwyt = 'FWYT',
  /**土地登记 */
  tddj = 'TDDJ',
  /**取得方式 */
  qdfs = 'QDFS',
  /**房屋性质 */
  fwxz = 'FWXZ',
  /**房屋结构 */
  fwjg = 'FWJG',
  /**土地权利性质 */
  tdqlxz = 'TDQLXZ',
  /**证件种类 */
  zjzl = 'ZJZL',
  /**限制类型 */
  xzlx = 'XZLX',
  /**限制方式 */
  xzfs = 'XZFS',
  /**性别 */
  xb = 'XB',
  /**权利人类别 */
  qlrlb = 'QLRLB',
  /**抵押方式 */
  dyfs = 'DYFS',
  /**预告登记类型 */
  ygdjzl = 'YGDJZL',
  /**付款方式 */
  fkfs = 'FKFS',
  /**贷款类型 */
  dklx = 'DKLX',
  /**权属状态 */
  qszt = 'QSZT',
  /**户型 */
  hx = 'HX',
  /**房屋类型*/
  fwlx='FWLX'
}

export const SysEunmTypeName: Partial<{
  [key in SysEnumType]: string
}> = {
  [SysEnumType.qlxz]: '权利性质',
  [SysEnumType.qllx]: '权利类型',
  [SysEnumType.qlsdfs]: '权利设定方式',
  [SysEnumType.djlx]: '登记类型',
  [SysEnumType.tdyt]: '土地用途',
  [SysEnumType.fwyt]: '房屋用途',
  [SysEnumType.tddj]: '土地登记',
  [SysEnumType.qdfs]: '取得方式',
  [SysEnumType.fwxz]: '房屋性质',
  [SysEnumType.fwjg]: '房屋结构',
  [SysEnumType.tdqlxz]: '土地权利性质',
  [SysEnumType.zjzl]: '证件种类',
  [SysEnumType.xzlx]: '限制类型',
  [SysEnumType.xzfs]: '限制方式',
  [SysEnumType.xb]: '性别',
  [SysEnumType.qlrlb]: '权利人类别',
  [SysEnumType.dyfs]: '抵押方式',
  [SysEnumType.ygdjzl]: '预告登记类型',
  [SysEnumType.fkfs]: '付款方式',
  [SysEnumType.dklx]: '贷款类型',
  [SysEnumType.qszt]: '权属状态',
  [SysEnumType.hx]: '户型',
  [SysEnumType.fwlx]: '房屋类型',
};

export interface SysEnum {
  enumname: string;
  enumvalue: string;
  enummc: string;
  parentnode?: null;
  children?: (SysEnum)[] | null;
}

export type SysEnumMap = Partial<{
  [key in keyof typeof SysEnumType]: SysEnum[]
}>;

