export const getColorForString = (str: string): string => {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + acc * 31;
  }, 0);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
};
