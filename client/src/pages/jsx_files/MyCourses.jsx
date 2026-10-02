import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/useAuth";
import "../css_files/MyCourses.css";

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MyCourses() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadAttempt, setReloadAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadEnrollments() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/enrollments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your courses.");
        }

        if (isCurrent) {
          setEnrollments(data.enrollments || []);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || "Could not load your courses.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
  loadEnrollments();
}

    return () => {
      isCurrent = false;
    };
  }, [token, reloadAttempt]);

  function retryLoading() {
    setReloadAttempt((attempt) => attempt + 1);
  }

  return (
    <main className="my-courses-page">
      <header className="my-courses-header">
        <p className="my-courses-eyebrow">YOUR LEARNING</p>
        <h1>My Courses</h1>
        <p>Track your progress across the courses you’ve joined.</p>
      </header>

      {isLoading && (
        <p className="my-courses-message" role="status">
          Loading your courses…
        </p>
      )}

      {!isLoading && error && (
        <section className="my-courses-message my-courses-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={retryLoading}>
            Try again
          </button>
        </section>
      )}

      {!isLoading && !error && enrollments.length === 0 && (
        <section className="my-courses-empty">
          <h2>Your learning starts here</h2>
          <p>You haven’t enrolled in any courses yet.</p>
          <Link to="/courses" className="my-courses-browse-link">
            Browse courses
          </Link>
        </section>
      )}

      {!isLoading && !error && enrollments.length > 0 && (
        <section className="my-courses-grid" aria-label="Enrolled courses">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const title =
              course && typeof course === "object"
                ? course.title || "Untitled course"
                : "Course unavailable";
            const rawProgress = Number(enrollment.progress?.percentage || 0);
            const progress = Number.isFinite(rawProgress)
              ? Math.max(0, Math.min(100, rawProgress))
              : 0;
            const isCompleted = enrollment.status === "completed";
            const isAvailable = enrollment.courseAvailable;
            const enrolledDate = formatDate(enrollment.enrolledAt);

            return (
              <article className="my-course-card" key={enrollment._id}>
                <div className="my-course-card-header">
                  <div>
                    {course?.category && (
                      <p className="my-course-category">{course.category}</p>
                    )}
                    <h2>{title}</h2>
                  </div>

                  <span
                    className={`my-course-status${
                      isCompleted ? " is-completed" : ""
                    }${!isAvailable ? " is-unavailable" : ""}`}
                  >
                    {!isAvailable
                      ? "Unavailable"
                      : isCompleted
                        ? "Completed"
                        : "In progress"}
                  </span>
                </div>

                {course?.description && (
                  <p className="my-course-description">{course.description}</p>
                )}

                <div className="my-course-details">
                  {course?.level && <span>{course.level}</span>}
                  {course?.instructor?.name && (
                    <span>By {course.instructor.name}</span>
                  )}
                  {enrolledDate && <span>Joined {enrolledDate}</span>}
                </div>

                <div className="my-course-progress">
                  <div className="my-course-progress-label">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>

                  <div
                    className="my-course-progress-track"
                    role="progressbar"
                    aria-label={`Progress for ${title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default MyCourses;