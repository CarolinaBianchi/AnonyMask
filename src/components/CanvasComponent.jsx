import { useRef } from 'react';
import PropTypes from 'prop-types';
import '../style/CanvasComponent.css';

const CanvasComponent = ({
  type, // "input" or "output"
  canvasRef,
  onImageUpload = null, // Function to handle image uploads (for input canvas)
  onDownload = null, // Function to handle downloads (for output canvas)
  isPlaceholderVisible,
}) => {
  const inputRef = useRef(null); // File input for upload

  const handleCanvasClick = () => {
    if (type === 'input') {
      inputRef.current.click(); // Trigger file input for upload
    } else if (type === 'output' && onDownload) {
      onDownload(); // Trigger download logic
    }
  };

  const getOverlayText = () => {
    if (type === 'input') return 'Click to upload image';
    if (type === 'output') return 'Click to download anonymized image';
    return null;
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        className={`canvas ${type}`}
        ref={canvasRef}
        onClick={handleCanvasClick}
      ></canvas>
      {isPlaceholderVisible && (
        <p className="overlay-text">{getOverlayText()}</p>
      )}
      {type === 'input' && (
        <input
          type="file"
          accept="image/*"
          className="input-image"
          ref={inputRef}
          onChange={onImageUpload}
        />
      )}
    </div>
  );
};

CanvasComponent.propTypes = {
  type: PropTypes.oneOf(['input', 'output']).isRequired,
  canvasRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  onImageUpload: PropTypes.func,
  onDownload: PropTypes.func,
  isPlaceholderVisible: PropTypes.bool.isRequired,
};

export default CanvasComponent;
