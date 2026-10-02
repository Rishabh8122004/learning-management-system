import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AuthProvider from "./context/AuthContext";
import Home from "./pages/jsx_files/Home";
import Courses from "./pages/jsx_files/Courses";
import Login from "./pages/jsx_files/Login";
import Register from "./pages/jsx_files/Register";
import Dashboard from "./pages/jsx_files/Dashboard";
import MyCourses from "./pages/jsx_files/MyCourses";
import LearningPaths from "./pages/jsx_files/LearningPaths";
import Profile from "./pages/jsx_files/Profile";
import NotFound from "./pages/jsx_files/NotFound";

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("trackly-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("trackly-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={<AppLayout theme={theme} onToggleTheme={toggleTheme} />}
          >
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/learning-paths" element={<LearningPaths />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;