import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  const textareaClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
    error ? "border-red-500" : "border-gray-300"
  } ${className}`;

  return (
    <div className="space-y-1 h-full flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea className={textareaClasses} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Textarea;
