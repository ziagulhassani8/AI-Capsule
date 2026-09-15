import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <h1>AI Capsule</h1>
      <p className="muted" style={{ maxWidth: 480 }}>
        A private prompt library for students. Save the prompts you use with AI tools,
        track what worked, and keep notes for next time — all in one place.
      </p>
      <Link to="/login" className="btn btn-primary">Get started</Link>
    </div>
  );
}