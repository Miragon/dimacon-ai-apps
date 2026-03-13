import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { OrderPage } from "@/pages/OrderPage";
import { NewPositionPage } from "@/pages/NewPositionPage";
import { PositionDetailPage } from "@/pages/PositionDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders/:orderId" element={<OrderPage />} />
          <Route path="/orders/:orderId/positions/new" element={<NewPositionPage />} />
          <Route path="/orders/:orderId/positions/:positionId" element={<PositionDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
