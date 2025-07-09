import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppointmentsProvider } from "./contexts/AppointmentsContext";
import { TallyProvider } from "./contexts/TallyContext";
import { CustomersProvider } from "./contexts/CustomersContext";
import { StaffProvider } from "./contexts/StaffContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Index";
import Booking from "./pages/Booking";
import Store from "./pages/Store";
import Customers from "./pages/Customers";
import Schedule from "./pages/Schedule";
import Tally from "./pages/Tally";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CustomersProvider>
        <AppointmentsProvider>
          <TallyProvider>
            <StaffProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="booking" element={<Booking />} />
                  <Route path="store" element={<Store />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="tally" element={<Tally />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </StaffProvider>
          </TallyProvider>
        </AppointmentsProvider>
      </CustomersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
