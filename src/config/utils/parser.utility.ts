export const parseJSONString = (value: string): unknown => {
  try {
    return JSON.parse(value.replace(/\\"/g, '"')) as unknown;
  } catch (e) {
    console.error('Error parsing JSON string:', e);
    return value;
  }
};
