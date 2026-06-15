/**
 * @file Footer.jsx
 * @module Footer
 * @description Site footer component for Rentify matching the mockup styling.
 * @dependencies react, react-router-dom
 * @exports Footer: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" data-testid="footer">
      <div className="footer__container">
        {/* Left Column: Branding */}
        <div className="footer__column footer__column--brand">
          <Link to="/" className="footer__logo">
            Rentify<span className="footer__logo-dot">.</span>
          </Link>
          <p className="footer__description">
            Sri Lanka's all-things rental marketplace properties, vehicles, electronics, and everything in between, all in one place, island wide.
          </p>
          <div className="footer__socials">
            <a href="https://facebook.com" className="footer__social-icon" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://twitter.com" className="footer__social-icon" aria-label="X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            <a href="https://linkedin.com" className="footer__social-icon" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a href="https://instagram.com" className="footer__social-icon" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>

        {/* Center Column 1: Quick Links */}
        <div className="footer__column">
          <h4 className="footer__title">Quick Links</h4>
          <ul className="footer__list">
            <li><Link to="/" className="footer__link">Home</Link></li>
            <li><Link to="/about" className="footer__link">About Us</Link></li>
            <li><Link to="/contact" className="footer__link">Contact Us</Link></li>
            <li><Link to="/privacy" className="footer__link">Privacy Policy</Link></li>
            <li><Link to="/terms" className="footer__link">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Center Column 2: Categories */}
        <div className="footer__column">
          <h4 className="footer__title">Categories</h4>
          <ul className="footer__list">
            <li><Link to="/search?type=properties" className="footer__link">Properties</Link></li>
            <li><Link to="/search?type=vehicles" className="footer__link">Vehicles</Link></li>
            <li><Link to="/search?type=electronics" className="footer__link">Electronics</Link></li>
            <li><Link to="/search?type=service" className="footer__link">Services</Link></li>
            <li><Link to="/search?type=jobs" className="footer__link">Jobs</Link></li>
          </ul>
        </div>

        {/* Right Column: Stay Updated */}
        <div className="footer__column footer__column--subscribe">
          <h4 className="footer__title">Stay Updated</h4>
          <p className="footer__subscribe-text">Subscribe to our newsletter</p>
          <form className="footer__subscribe-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="footer__subscribe-input"
              required
            />
            <button type="submit" className="footer__subscribe-btn">
              Subscribe Now
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div className="footer__bottom">
        <div className="footer__bottom-container">
          <p className="footer__copyright">
            &copy; {currentYear} Rentify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
