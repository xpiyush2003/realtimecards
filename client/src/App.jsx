import { Route, Routes } from "react-router";
import Layout from "./components/Layout.jsx";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards.jsx";
import Board from "./pages/Board.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Register from "./pages/Register.jsx";
import TeamDetail from "./pages/TeamDetail.jsx";
import Teams from "./pages/Teams.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/boards/:id" element={<Board />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
