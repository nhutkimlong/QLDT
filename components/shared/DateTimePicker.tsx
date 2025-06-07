
import React from 'react';

interface DateTimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isDateTime?: boolean; // true for datetime-local, false for date
  containerClassName?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  label, 
  id, 
  error, 
  isDateTime = false, 
  className = '', 
  containerClassName = '', 
  ...props 
}) => {
  const baseStyles = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
  const errorStyles = "border-red-500 focus:ring-red-500 focus:border-red-500";

  const type = isDateTime ? "datetime-local" : "date";
  
  // Format value for datetime-local if it's just a date string
  let valueToSet = props.value;
  if (isDateTime && typeof props.value === 'string' && props.value.length === 10) { // YYYY-MM-DD
    valueToSet = `${props.value}T00:00`;
  }


  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        id={id}
        type={type}
        className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
        value={valueToSet}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
