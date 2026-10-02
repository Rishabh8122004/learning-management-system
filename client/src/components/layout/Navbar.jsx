import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    navigate("/login");
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={closeMenu}>
          Trackly
        </Link>

        <div className="nav-links">
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/courses" onClick={closeMenu}>
            Courses
          </Link>

          {user && (
            <>
              <Link to="/my-courses" onClick={closeMenu}>
                My Courses
              </Link>

              <Link to="/learning-paths" onClick={closeMenu}>
                Learning Paths
              </Link>
            </>
          )}
        </div>

        <div className="nav-actions">
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />

          <button type="button" aria-label="Notifications">
            🔔
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className="profile-link"
                onClick={closeMenu}
              >
                Profile
              </Link>

              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                Login
              </Link>

              <Link to="/register" onClick={closeMenu}>
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            className="menu-button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            <Link to="/courses" onClick={closeMenu}>
              Courses
            </Link>

            {user && (
              <>
                <Link to="/my-courses" onClick={closeMenu}>
                  My Courses
                </Link>

                <Link to="/learning-paths" onClick={closeMenu}>
                  Learning Paths
                </Link>
              </>
            )}

            {user ? (
              <>
                <Link to="/profile" onClick={closeMenu}>
                  Profile
                </Link>

                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>

                <Link to="/register" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;