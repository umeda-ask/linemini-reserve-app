import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LineAppFrame from "@/components/line-app-frame";
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

function WebRedirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to, { replace: true }); }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/line" component={LineDemoPage} />
          <Route path="/admin" component={AdminRoute} />
          <Route path="/admin/shop/:id" component={ShopAdminRoute} />

          {/* メインルート（/app/*） */}
          <Route path="/app" component={InApp(HomePage)} />
          <Route path="/app/list" component={InApp(ListPage)} />
          <Route path="/app/shop/:id" component={InApp(DetailPage)} />
          <Route path="/app/reservation/:id" component={InApp(ReservationPage)} />
          <Route path="/app/cancel/:shopId/:token" component={InApp(CancelPage)} />

          {/* 旧URLから/app/*へリダイレクト（後方互換） */}
          <Route path="/web" component={() => <WebRedirect to="/app" />} />
          <Route path="/web/list" component={() => <WebRedirect to="/app/list" />} />
          <Route path="/web/shop/:id" component={({ params }: any) => <WebRedirect to={`/app/shop/${params.id}`} />} />
          <Route path="/web/reservation/:id" component={({ params }: any) => <WebRedirect to={`/app/reservation/${params.id}`} />} />
          <Route path="/web/cancel/:shopId/:token" component={({ params }: any) => <WebRedirect to={`/app/cancel/${params.shopId}/${params.token}`} />} />

          <Route path="/reservation/:id" component={InApp(ReservationPage)} />
          <Route path="/cancel/:shopId/:token" component={InApp(CancelPage)} />
          <Route component={InApp(NotFound)} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
