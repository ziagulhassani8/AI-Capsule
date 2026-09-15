export default function Login() {
  const startGithubLogin = () => {
    window.location.href = '/auth/github';
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 380, margin: '40px auto', textAlign: 'center' }}>
        <h2>Sign in to AI Capsule</h2>
        <p className="muted">Use your GitHub account to continue.</p>
        <button className="btn btn-primary" onClick={startGithubLogin} style={{ width: '100%' }}>
          Login with GitHub
        </button>
      </div>
    </div>
  );
}