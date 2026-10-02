import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import ThemeToggle from "./ThemeToggle";

function Navbar({ theme, onToggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  }

  function navClassName({ isActive }) {
    return `nav-link${isActive ? " is-active" : ""}`;
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={closeMenu}>
          Trackly
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={navClassName} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/courses" className={navClassName} onClick={closeMenu}>
            Courses
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={navClassName}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/my-courses"
                className={navClassName}
                onClick={closeMenu}
              >
                My Courses
              </NavLink>

              <NavLink
                to="/learning-paths"
                className={navClassName}
                onClick={closeMenu}
              >
                Track Your Goals
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button type="button" aria-label="Notifications">
            🔔
          </button>

          {user ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `profile-link${isActive ? " is-active" : ""}`
                }
                onClick={closeMenu}
              >
                Profile
              </NavLink>

              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClassName} onClick={closeMenu}>
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={navClassName}
                onClick={closeMenu}
              >
                Register
              </NavLink>
            </>
          )}

          <button
            type="button"
            className="menu-button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <NavLink to="/" end className={navClassName} onClick={closeMenu}>
              Home
            </NavLink>

            <NavLink to="/courses" className={navClassName} onClick={closeMenu}>
              Courses
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/my-courses"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  My Courses
                </NavLink>

                <NavLink
                  to="/learning-paths"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  Track Your Goals
                </NavLink>

                <NavLink
                  to="/profile"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  Profile
                </NavLink>

                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={navClassName}
                  onClick={closeMenu}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;