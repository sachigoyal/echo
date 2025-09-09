export const ogExports = (title?: string) => {
  return {
    alt: title ? `${title} | Echo` : 'Echo',
    size: {
      width: 1200,
      height: 630,
    },
    contentType: 'image/png',
  };
};
