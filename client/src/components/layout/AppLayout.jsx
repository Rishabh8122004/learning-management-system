import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";

function AppLayout({ theme, onToggleTheme }) {
  return (
    <div className="app-layout">
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;