import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { X, Home, ChevronLeft } from "lucide-react";
import { SiLine } from "react-icons/si";

function LineStatusBar() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-black text-white text-[10px] font-medium">
      <span>{hours}:{minutes}</span>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-1.5 bg-white rounded-sm" />
          <div className="w-1 h-2 bg-white rounded-sm" />
          <div className="w-1 h-2.5 bg-white rounded-sm" />
          <div className="w-1 h-3 bg-white/40 rounded-sm" />
        </div>
        <span className="ml-1">5G</span>
        <div className="w-5 h-2.5 border border-white rounded-sm ml-1 relative">
          <div className="absolute inset-0.5 bg-white rounded-[1px]" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}

function LineHeader() {
  const [location, navigate] = useLocation();
  const isHome = location === "/app";
  const getTitle = () => {
    if (isHome) return "かながわ西部おでかけナビ";
    if (location.startsWith("/app/list")) return "お店一覧";
    if (location.startsWith("/app/shop/")) return "お店詳細";
    if (location.startsWith("/app/reservation/")) return "予約";
    return "かながわ西部おでかけナビ";
  };

  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-white border-b border-gray-200 sticky top-0 z-50" data-testid="line-header">
      <div className="flex items-center gap-1 min-w-[50px]">
        {!isHome ? (
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-line-back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        ) : (
          <div className="p-1">
            <SiLine className="w-4 h-4 text-[#06C755]" />
          </div>
        )}
      </div>
      <h1 className="text-xs font-semibold text-gray-900 truncate" data-testid="text-line-header-title">
        {getTitle()}
      </h1>
      <div className="flex items-center gap-0.5 min-w-[50px] justify-end">
        {!isHome && (
          <button
            onClick={() => navigate("/app")}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="button-line-home"
          >
            <Home className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
        <button
          onClick={() => navigate("/line")}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          data-testid="button-line-close"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

function LineBottomBar() {
  return (
    <div className="bg-white border-t border-gray-100 px-4 py-1.5 pb-[env(safe-area-inset-bottom,4px)]">
      <div className="flex items-center justify-center">
        <div className="h-1 w-28 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

export default function LineAppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh bg-gray-800 flex items-start justify-center md:py-8 md:px-4 overflow-hidden" data-testid="line-app-frame">
      <div className="w-full md:max-w-[375px] md:rounded-[2.5rem] md:overflow-hidden md:shadow-2xl md:border-4 md:border-gray-700 relative bg-background h-full md:h-[min(812px,calc(100dvh-4rem))] flex flex-col">
        <div className="hidden md:block">
          <LineStatusBar />
        </div>
        <LineHeader />
        <div className="flex-1 overflow-y-auto overflow-x-hidden" data-testid="line-app-content">
          {children}
        </div>
        <LineBottomBar />
      </div>
    </div>
  );
}
