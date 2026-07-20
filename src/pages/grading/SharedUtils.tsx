import React from 'react';

export const autoFitColumns = (data: any[]) => {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map(key => {
    let maxLen = key.toString().length;
    data.forEach(row => {
      const val = row[key];
      if (val !== null && val !== undefined) {
        const len = val.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: maxLen + 2 };
  });
};

export const normalizeName = (name: string) => {
    return name.toLowerCase()
        .replace(/(h\.|hj\.|dra\.|drs\.|st\.|m\.pd|s\.pd|s\.kom|s\.sn|m\.kom)/gi, '') // Remove titles
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
};
