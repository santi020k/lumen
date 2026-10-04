import type { LumenChartDatumActivationDetail, LumenChartLabels } from '@santi020k/lumen-core'

export interface ChartDatumAction {
  detail: LumenChartDatumActivationDetail
  label: string
  serialized: string
}

export const createChartDatumAction = (
  detail: LumenChartDatumActivationDetail | null,
  context: string,
  labels: Readonly<LumenChartLabels>
): ChartDatumAction | null => detail ?
  {
    detail,
    label: labels.formatDatumAction(context),
    serialized: JSON.stringify(detail)
  } :
  null
