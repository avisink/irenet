import { Link } from 'react-router-dom';
import './Landing.css';

function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="logo-container">
            <div className="leaf-icon">🍃</div>
          </div>
          <h1 className="hero-title">ireNet</h1>
          <p className="hero-tagline">Connecting food donors with those in need</p>
          <p className="hero-mission">
            Reduce food waste, fight hunger, and build sustainable communities through our donation matching platform
          </p>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="problem-card">
          <h2>The Problem We're Solving</h2>
          <p className="problem-description">
            Every year, millions of tons of food go to waste while many families struggle with food insecurity. 
            ireNet bridges this gap by connecting donors with organizations serving those in need.
          </p>
          <div className="stats-container">
            <div className="stat-card stat-card-pink">
              <div className="stat-icon">📉</div>
              <p>30-40% of food supply is wasted annually</p>
            </div>
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">❤️</div>
              <p>1 in 8 people face food insecurity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon feature-icon-green">🍃</div>
          <h3>Reduce Waste</h3>
          <p>Donate surplus food instead of throwing it away. Every donation makes a difference.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-blue">👥</div>
          <h3>Help Communities</h3>
          <p>Organizations can request needed items and receive donations from generous donors.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-purple">💚</div>
          <h3>Smart Matching</h3>
          <p>Our platform intelligently matches donations with requests to ensure efficient distribution.</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number step-number-1">1</div>
            <h3>Sign Up</h3>
            <p>Register as a donor or organization</p>
          </div>
          <div className="step">
            <div className="step-number step-number-2">2</div>
            <h3>Post or Request</h3>
            <p>Donors list items, organizations request needs</p>
          </div>
          <div className="step">
            <div className="step-number step-number-3">3</div>
            <h3>Match & Deliver</h3>
            <p>We match donations with requests efficiently</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;

