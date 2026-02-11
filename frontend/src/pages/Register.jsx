import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await register(form);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="pp-auth-page">
      <div className="pp-auth-glow" />
      <div className="pp-auth-card glassy-surface">
        <div className="pp-auth-header">
          <h1>Create your PurplePulse orbit</h1>
          <p>Choose how you’ll navigate tasks.</p>
        </div>

        <form className="pp-auth-form" onSubmit={handleSubmit}>
          {error && <div className="pp-alert pp-alert-error">{error}</div>}

          <div className="pp-field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Orion Nova"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

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
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">Task Voyager (User)</option>
              <option value="lead">Team Lead Nebula</option>
              <option value="admin">Admin Conductor</option>
            </select>
          </div>

          <button className="pp-btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating Orbit..." : "Create Account"}
          </button>
        </form>

        <p className="pp-auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

