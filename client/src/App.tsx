import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LineAppFrame from "@/components/line-app-frame";
import { WebAppFrame } from "@/components/web-app-frame";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import HomePage from "@/pages/home";
import ListPage from "@/pages/list";
import DetailPage from "@/pages/detail";
import ReservationPage from "@/pages/reservation";
import AdminPage from "@/pages/admin";
import ShopAdminPage from "@/pages/shop-admin";
import LineDemoPage from "@/pages/line-demo";
import CancelPage from "@/pages/cancel";
import LoginPage from "@/pages/login";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AdminRoute() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login");
    } else if (user.role === "shop_admin") {
      navigate(`/admin/shop/${user.shopId}`);
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== "admin") return null;
  return <AdminPage />;
}

function ShopAdminRoute() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "shop_admin") {
      const match = location.match(/\/admin\/shop\/(\d+)/);
      const routeShopId = match ? parseInt(match[1]) : null;
      if (routeShopId && routeShopId !== user.shopId) {
        navigate(`/admin/shop/${user.shopId}`);
      }
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;
  return <ShopAdminPage />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const InApp = (C: React.ComponentType) => () => <LineAppFrame><C /></LineAppFrame>;
const InWeb = (C: React.ComponentType) => () => <WebAppFrame><C /></WebAppFrame>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          {/* 共通 */}
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/line" component={LineDemoPage} />
          <Route path="/admin" component={AdminRoute} />
          <Route path="/admin/shop/:id" component={ShopAdminRoute} />

          {/* LINEミニアプリ (/app/*) */}
          <Route path="/app" component={InApp(HomePage)} />
          <Route path="/app/list" component={InApp(ListPage)} />
          <Route path="/app/shop/:id" component={InApp(DetailPage)} />
          <Route path="/app/reservation/:id" component={InApp(ReservationPage)} />
          <Route path="/app/cancel/:shopId/:token" component={InApp(CancelPage)} />

          {/* WEBサイト (/web/*) */}
          <Route path="/web" component={InWeb(HomePage)} />
          <Route path="/web/list" component={InWeb(ListPage)} />
          <Route path="/web/shop/:id" component={InWeb(DetailPage)} />
          <Route path="/web/reservation/:id" component={InWeb(ReservationPage)} />
          <Route path="/web/cancel/:shopId/:token" component={InWeb(CancelPage)} />

          {/* その他 */}
          <Route path="/reservation/:id" component={InApp(ReservationPage)} />
          <Route path="/cancel/:shopId/:token" component={InApp(CancelPage)} />
          <Route component={InApp(NotFound)} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
