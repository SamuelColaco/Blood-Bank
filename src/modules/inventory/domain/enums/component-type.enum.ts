/**
 * The kinds of blood components that can be derived from a single blood
 * bag after centrifugation/fractionation. Each has its own validity
 * window - see ValidityCalculatorService.
 */
export enum ComponentType {
  RED_BLOOD_CELLS = 'RED_BLOOD_CELLS',
  PLATELETS = 'PLATELETS',
  PLASMA = 'PLASMA',
  CRYOPRECIPITATE = 'CRYOPRECIPITATE',
}
