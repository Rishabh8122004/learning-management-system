import { useState } from "react";
import { Link } from "react-router-dom";

import ThemeToggle from "./ThemeToggle";

function Navbar({ theme, onToggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={closeMenu}>
          Trackly
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/my-courses">My Courses</Link>
          <Link to="/learning-paths">Learning Paths</Link>
        </div>

        <div className="nav-actions">
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />

          <button type="button" aria-label="Notifications">
            🔔
          </button>

          <Link to="/profile" className="profile-link">
            Profile
          </Link>

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

            <Link to="/my-courses" onClick={closeMenu}>
              My Courses
            </Link>

            <Link to="/learning-paths" onClick={closeMenu}>
              Learning Paths
            </Link>

            <Link to="/profile" onClick={closeMenu}>
              Profile
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;