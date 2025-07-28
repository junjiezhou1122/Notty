import React from "react";
import Button from "./Button";

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 bg-transparent hover:bg-red-100 border-none text-xs"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};

export default ErrorBanner;
