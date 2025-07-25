// Define Registry
export const scriptModules = import.meta.glob('/src/**/*.ts');
export const templateFiles = import.meta.glob('/src/**/*.html', { as: 'raw' });
export const styleFiles = import.meta.glob('/src/**/*.css', { as: 'raw' });