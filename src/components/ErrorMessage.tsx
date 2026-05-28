"use client";
import { WifiOff, AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  type?: "network" | "general" | "empty";
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  type = "general",
  message,
  onRetry,
}: ErrorMessageProps) {
  const configs = {
    network: {
      icon: <WifiOff size={40} className="text-slate-500" />,
      title: "No Internet Connection",
      desc: "Check your connection and try again",
    },
    general: {
      icon: <AlertCircle size={40} className="text-slate-500" />,
      title: "Something went wrong",
      desc: message || "Please try again",
    },
    empty: {
      icon: <span className="text-5xl">💎</span>,
      title: "No gems yet!",
      desc: message || "Be the first to post a gem",
    },
  };

  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      {config.icon}
      <div className="text-center">
        <p className="text-white font-semibold">{config.title}</p>
        <p className="text-slate-400 text-sm mt-1">{config.desc}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}