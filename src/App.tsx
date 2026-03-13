import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { OrderPage } from "@/pages/OrderPage";
import { PositionPage } from "@/pages/PositionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders/:orderId" element={<OrderPage />} />
          <Route path="/orders/:orderId/positions/new" element={<PositionPage />} />
          <Route path="/orders/:orderId/positions/:positionId" element={<PositionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
