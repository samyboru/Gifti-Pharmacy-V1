// File Location: client/src/utils/validation.ts
import React from 'react';

// Restricts input to only allow numbers (and decimals if allowed)
export const numbersOnly = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) => {
  const allowedKeys = [
    'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete',
    'Home', 'End'
  ];
  if (allowedKeys.includes(e.key)) {
    return;
  }
  if (allowDecimal && e.key === '.') {
    return;
  }
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
};

// Restricts input to only allow letters and spaces
export const lettersOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (!/^[a-zA-Z\s]*$/.test(e.key)) {
    e.preventDefault();
  }
};