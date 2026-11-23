export const normalize = (value: string): string => value
  .normalize('NFD')
  .replaceAll(/[\u0300-\u036f]/g, '')
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replaceAll(/[\s_]+/g, '-')
  .toLowerCase()
