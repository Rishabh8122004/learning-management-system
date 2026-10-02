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
          Trackly helps you turn the things you want to learn into an organized
          path, so you can see what you're working on, where you are, and what
          comes next.
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

        <div className="learning-path">
          <div className="learning-path-track" aria-hidden="true">
            <span className="learning-path-progress" />
          </div>

          <article className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              01
            </span>

            <div className="learning-step-content">
              <h3>Goal</h3>
              <p>What I want to learn</p>
            </div>
          </article>

          <article className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              02
            </span>

            <div className="learning-step-content">
              <h3>Path</h3>
              <p>How I organize the learning</p>
            </div>
          </article>

          <article className="learning-step">
            <span className="learning-step-marker" aria-hidden="true">
              03
            </span>

            <div className="learning-step-content">
              <h3>Progress</h3>
              <p>Where I am and what comes next</p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-closing" aria-labelledby="closing-heading">
        <div>
          <p className="home-eyebrow">LEARN YOUR WAY</p>

          <h2 id="closing-heading">Your learning can come from anywhere.</h2>
        </div>

        <p>
          Learn from YouTube, books, college, courses, documentation, projects,
          or anywhere else. Trackly simply gives that learning structure.
        </p>
      </section>
    </main>
  );
}

export default Home;
