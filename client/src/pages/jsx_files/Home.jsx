import { Link } from "react-router-dom";

import "../css_files/Home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="home-eyebrow">LEARNING, WITH DIRECTION</p>

        <h1>
          Learn what matters.
          <br />
          <span>Track your progress.</span>
        </h1>

        <p className="home-hero-text">
          Trackly helps you turn scattered learning into a clear path —
          whether you learn from YouTube, books, college, documentation,
          courses, or your own projects.
        </p>

        <div className="home-hero-actions">
          <Link to="/courses" className="primary-button">
            Start Learning
          </Link>

          <Link to="/learning-paths" className="secondary-button">
            Explore Learning Paths
          </Link>
        </div>
      </section>

      <section className="home-process" aria-labelledby="process-heading">
        <div className="section-heading">
          <p className="home-eyebrow">HOW TRACKLY WORKS</p>

          <h2 id="process-heading">
            From intention to progress.
          </h2>
        </div>

        <div className="process-grid">
          <article className="process-card">
            <span className="process-number">01</span>
            <h3>Choose what to learn</h3>
            <p>
              Define the skills, subjects, or knowledge you actually want
              to build.
            </p>
          </article>

          <article className="process-card">
            <span className="process-number">02</span>
            <h3>Build your path</h3>
            <p>
              Organize courses, lessons, and custom learning tasks into a
              structure that makes sense to you.
            </p>
          </article>

          <article className="process-card">
            <span className="process-number">03</span>
            <h3>Keep moving</h3>
            <p>
              Complete learning tasks, track your progress, and understand
              what you should work on next.
            </p>
          </article>
        </div>
      </section>

      <section className="home-sources" aria-labelledby="sources-heading">
        <div>
          <p className="home-eyebrow">YOUR LEARNING, YOUR WAY</p>

          <h2 id="sources-heading">
            Your knowledge doesn't have to come from one place.
          </h2>
        </div>

        <p>
          Trackly is built around the reality of modern learning. A
          YouTube playlist, a book, a college subject, an online course,
          documentation, or a personal project can all become part of your
          learning system.
        </p>
      </section>
    </main>
  );
}

export default Home;