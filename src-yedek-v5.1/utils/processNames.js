// src/utils/processNames.js
export const processNames = (input) => {
    return input.split('\n').filter(name => name.trim() !== '');
  };