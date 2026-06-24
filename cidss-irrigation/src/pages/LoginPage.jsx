import {
  Droplets,
  CloudRain,
  Waves,
  ShieldCheck,
} from "lucide-react";
// import sl_logo from "../../sl.png"
import sl_logo from "../data/images/sl_logo1.png"

import RainEffect from "./RainEffect";
import "./LoginPage.css";

export default function LoginPage() {
  return (
    <div className="login-container">
      {/* LEFT SIDE */}
      <div className="hero-section">
        <RainEffect />

        <div className="overlay"></div>

        <div className="hero-content">
          <img
            src={sl_logo}
            alt="Sri Lanka Emblem"
            className="emblem"
          />

          <h1>
            Hydrological Information
            <span> Management System</span>
          </h1>

          <p>
            Department of Irrigation - Democratic Socialist
            Republic of Sri Lanka
          </p>

          <div className="stats">
            <div className="stat-card">
              <Droplets size={24} />
              <div>
                <h4>Reservoir</h4>
                <span>Live Monitoring</span>
              </div>
            </div>

            <div className="stat-card">
              <CloudRain size={24} />
              <div>
                <h4>Rainfall</h4>
                <span>Real-Time Data</span>
              </div>
            </div>

            <div className="stat-card">
              <Waves size={24} />
              <div>
                <h4>River Flow</h4>
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </div>

        <svg
          className="wave"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,224L60,218.7C120,213,240,203,360,186.7C480,171,600,149,720,154.7C840,160,960,192,1080,192C1200,192,1320,160,1380,144L1440,128L1440,320L0,320Z"
          />
        </svg>
      </div>

      {/* LOGIN SECTION */}
      <div className="login-section">
        <div className="login-card">
          <ShieldCheck
            className="login-icon"
            size={50}
          />

          <h2>Welcome Back</h2>
          <p>
            Sign in to access hydrological monitoring
            services
          </p>

          <form>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
              />
            </div>

            <div className="options">
              <label>
                <input type="checkbox" />
                Remember Me
              </label>

              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit">
              Login
            </button>
          </form>

          <div className="footer-text">
            Department of Irrigation • Sri Lanka
          </div>
        </div>
      </div>
    </div>
  );
}