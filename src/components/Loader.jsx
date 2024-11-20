import PropTypes from 'prop-types';
import '../style/Loader.css';

const Loader = ({ progress, children = null }) => (
  <div className="loader-container" aria-label="Loading Screen">
    <div className="loader-spinner"></div>
    <div className="loader-progress-bar-container">
      <div
        className="loader-progress-bar"
        style={{ width: `${progress * 100}%` }}
      ></div>
    </div>
    {children && <p className="loader-text">{children}</p>}
  </div>
);

Loader.propTypes = {
  progress: PropTypes.number.isRequired, // Progress as a decimal (e.g., 0.5 for 50%)
  children: PropTypes.node, // Optional: any React children (e.g., a loading message)
};

export default Loader;