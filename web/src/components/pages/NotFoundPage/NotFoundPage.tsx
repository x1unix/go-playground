import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  const [catVisible, setCatVisible] = useState(false);
  return (
    <div className="errorPage">
      <div className="errorPage__inner">
        <div className="errorPage__container">
          <h1 className="errorPage__statusCode">404!</h1>
          <h2 className="errorPage__statusText">Page Not Found</h2>
          <div className="errorPage__message">
            <p>
              Requested page does not exist or was deleted.
            </p>
            <p>
              That's all we know 🤷
            </p>
          </div>
          <div className="errorPage__actions">
            { !catVisible && (
              <button
                type="button"
                className="btn--transparent"
                onClick={() => setCatVisible(true)}
              >
                Show me cats
              </button>
            )}
            <Link to="/" className="btn--primary">Go To Home</Link>
          </div>
        </div>
        <div className="gopher">
          { catVisible ? (
            <img src="//http.cat/404" alt="😺" className="gopher__image" />
          ) : (
            <img src="/gopher.svg" alt="Gopher" className="gopher__image" />
          )}
        </div>
      </div>
      <svg width="0" height="0">
        <filter id="chromatic-aberration">
          <feColorMatrix type="matrix" result="red_"
                         values="4 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
          <feOffset in="red_" dx="2" dy="0" result="red"/>
          <feColorMatrix type="matrix" in="SourceGraphic" result="blue_"
                         values="0 0 0 0 0 0 3 0 0 0 0 0 10 0 0 0 0 0 1 0"/>
          <feOffset in="blue_" dx="-3" dy="0" result="blue"/>
          <feBlend mode="screen" in="red" in2="blue"/>
        </filter>
      </svg>
    </div>
  );
};
