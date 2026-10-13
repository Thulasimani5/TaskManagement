import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(form.email, form.password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate(from, { replace: true });
  };


  return (
    <div className="pp-auth-page">
      <div className="pp-auth-glow" />
      <div className="pp-auth-card glassy-surface">
        <div className="pp-auth-header">
          <h1>PurplePulse</h1>
          <p>Sign in to your task management workspace.</p>
        </div>

        <form className="pp-auth-form" onSubmit={handleSubmit}>
          {error && <div className="pp-alert pp-alert-error">{error}</div>}

          <div className="pp-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@purplepulse.dev"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-field">
            <label htmlFor="password">Password</label>
            <div className="pp-input-password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="pp-password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button className="pp-btn-primary" type="submit" disabled={loading} style={{ marginTop: "6px" }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>


        <p className="pp-auth-footer">
          New to PurplePulse? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

