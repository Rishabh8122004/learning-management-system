import { Link } from "react-router-dom";
import "../css_files/Home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-heading">
        <p className="home-eyebrow">LEARNING, WITH DIRECTION</p>

        <h1 id="home-heading">
          Learn what matters.
          <br />
          <span>Track where you're going.</span>
        </h1>

        <p className="home-hero-text">
          Trackly helps you turn the things you want to learn into organized
          learning paths, so you know what you're working on, where you are,
          and what comes next.
        </p>

        <Link to="/learning-paths" className="primary-button">
          Start organizing
        </Link>
      </section>

      <section
        className="home-learning-flow"
        aria-labelledby="learning-flow-heading"
      >
        <div className="flow-intro">
          <p className="home-eyebrow">THE TRACKLY IDEA</p>

          <h2 id="learning-flow-heading">
            Turn learning into something you can follow.
          </h2>
        </div>

        <div className="learning-path" aria-label="Trackly learning flow">
          <div className="learning-path-line" aria-hidden="true">
            <span className="learning-path-progress" />
          </div>

          <div className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              01
            </span>

            <div>
              <h3>Goal</h3>
              <p>What I want to learn</p>
            </div>
          </div>

          <div className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              02
            </span>

            <div>
              <h3>Path</h3>
              <p>How I organize the learning</p>
            </div>
          </div>

          <div className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              03
            </span>

            <div>
              <h3>Progress</h3>
              <p>Where I am and what comes next</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-closing" aria-labelledby="closing-heading">
        <div>
          <p className="home-eyebrow">LEARN YOUR WAY</p>

          <h2 id="closing-heading">
            Your learning can come from anywhere.
          </h2>
        </div>

        <p>
          YouTube, books, college, online courses, documentation, projects —
          Trackly does not decide where you learn. It gives the learning you
          choose a place to belong.
        </p>
      </section>
    </main>
  );
}

export default Home;