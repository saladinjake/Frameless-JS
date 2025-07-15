export function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => acc?.[key], obj);
}
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const nested = keys.reduce((acc, key) => {
    acc[key] = acc[key] || {};
    return acc[key];
  }, obj);
  nested[last] = value;
}
