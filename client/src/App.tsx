import { Switch, Route } from "wouter";
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

function LineAppRouter() {
  return (
    <LineAppFrame>
      <Switch>
        <Route path="/app" component={HomePage} />
        <Route path="/app/list" component={ListPage} />
        <Route path="/app/shop/:id" component={DetailPage} />
        <Route path="/app/reservation/:id" component={ReservationPage} />
        <Route path="/app/cancel/:shopId/:token" component={CancelPage} />
        <Route component={NotFound} />
      </Switch>
    </LineAppFrame>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/shop/:id" component={ShopAdminPage} />
          <Route path="/line" component={LineDemoPage} />
          <Route path="/reservation/:id" component={ReservationPage} />
          <Route path="/cancel/:shopId/:token" component={CancelPage} />
          <Route path="/app/:rest*" component={LineAppRouter} />
          <Route component={LineAppRouter} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
