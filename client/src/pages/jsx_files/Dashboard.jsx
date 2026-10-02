import { useEffect, useState } from "react";

import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/useAuth";
import "../css_files/Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState({
    enrollments: [],
    learningPaths: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [enrollmentsResponse, pathsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/enrollments/me`, { headers }),
          fetch(`${API_BASE_URL}/learning-paths`, { headers }),
        ]);

        const [enrollmentsData, pathsData] = await Promise.all([
          enrollmentsResponse.json(),
          pathsResponse.json(),
        ]);

        if (!enrollmentsResponse.ok) {
          throw new Error(enrollmentsData.message || "Could not load courses.");
        }

        if (!pathsResponse.ok) {
          throw new Error(pathsData.message || "Could not load learning paths.");
        }

        if (isCurrent) {
          setData({
            enrollments: enrollmentsData.enrollments || [],
            learningPaths: pathsData.learningPaths || [],
          });
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || "Could not load your dashboard.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
      loadDashboard();
    }

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const completedCourses = data.enrollments.filter(
    (enrollment) => enrollment.status === "completed",
  ).length;

  const activeCourses = data.enrollments.filter(
    (enrollment) => enrollment.status === "active",
  );

  const averageProgress = data.enrollments.length
    ? Math.round(
        data.enrollments.reduce(
          (total, enrollment) => total + (enrollment.progress?.percentage || 0),
          0,
        ) / data.enrollments.length,
      )
    : 0;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <p className="dashboard-eyebrow">YOUR LEARNING OVERVIEW</p>
        <h1>Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
        <p>Here’s a snapshot of your learning progress.</p>
      </header>

      {error && (
        <p className="dashboard-message dashboard-error" role="alert">
          {error}
        </p>
      )}

      <section className="dashboard-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading">Your progress</h2>

        <div className="dashboard-stats">
          <article className="dashboard-stat">
            <p>Enrolled courses</p>
            <strong>{isLoading ? "—" : data.enrollments.length}</strong>
          </article>

          <article className="dashboard-stat">
            <p>In progress</p>
            <strong>{isLoading ? "—" : activeCourses.length}</strong>
          </article>

          <article className="dashboard-stat">
            <p>Completed courses</p>
            <strong>{isLoading ? "—" : completedCourses}</strong>
          </article>

          <article className="dashboard-stat">
            <p>Average progress</p>
            <strong>{isLoading ? "—" : `${averageProgress}%`}</strong>
          </article>

          <article className="dashboard-stat">
            <p>Learning paths</p>
            <strong>{isLoading ? "—" : data.learningPaths.length}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="courses-heading">
        <h2 id="courses-heading">Continue learning</h2>

        {isLoading ? (
          <p className="dashboard-message" role="status">
            Loading your learning activity…
          </p>
        ) : activeCourses.length ? (
          <div className="dashboard-course-list">
            {activeCourses.map((enrollment) => (
              <article
                className="dashboard-course"
                key={enrollment._id}
              >
                <div>
                  <h3>{enrollment.course?.title || "Course unavailable"}</h3>
                  <p>
                    {enrollment.progress?.percentage || 0}% complete
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-message">
            You don’t have any courses in progress yet.
          </p>
        )}
      </section>
    </main>
  );
}

export default Dashboard;