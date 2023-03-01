import { useState, useRef } from 'react';
import '@tensorflow/tfjs-backend-cpu'; // Import CPU backend as fallback
import Loader from './components/Loader';
import CanvasComponent from './components/CanvasComponent';
import { detect, drawBoxes, pixelateBoxes } from './utils/detect';
import useModelLoader from './hooks/useModelLoader';
import './style/App.css';

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [currentDetections, setCurrentDetections] = useState(null);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [busy, setBusy] = useState({ busy: false, message: '' });

  const { model, loadModelProgress } = useModelLoader(loading, setLoading);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const blurredCanvasRef = useRef(null);

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    setIsPlaceholderVisible(false);
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const maxCanvasWidth = window.innerWidth * 0.4;
      const maxCanvasHeight = document.documentElement.clientHeight * 0.55;

      let canvasWidth = Math.min(maxCanvasWidth, img.width);
      let canvasHeight = canvasWidth / aspectRatio;
      if (canvasHeight > maxCanvasHeight) {
        canvasHeight = maxCanvasHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      blurredCanvasRef.current.width = canvasWidth;
      blurredCanvasRef.current.height = canvasHeight;

      const ctx = canvasRef.current.getContext('2d');
      const blurredCtx = blurredCanvasRef.current.getContext('2d');
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setBusy({ busy: true, message: 'Detecting...' });
      blurredCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      imageRef.current.src = url;
    };
    img.src = url;
  };

  const handleDownload = async () => {
    if (!imageRef.current || !currentDetections) return;
    const { saveFile } = await import('./utils/fileHandler');
    await saveFile(imageRef, currentDetections);
  };

  const handleDetection = async () => {
    if (imageRef.current && model.net) {
      try {
        const detections = await detect(imageRef.current, model);
        setCurrentDetections(detections);

        const canvasRatios = [
          canvasRef.current.width / imageRef.current.naturalWidth,
          canvasRef.current.height / imageRef.current.naturalHeight,
        ];

        await drawBoxes(canvasRef.current, detections, canvasRatios);
        await pixelateBoxes(blurredCanvasRef.current, detections, canvasRatios);
      } catch (error) {
        console.error('Error during detection:', error);
      } finally {
        setBusy({ busy: false, message: '' });
      }
    }
  };

  return (
    <div className="App">
      {loading.loading && (
        <Loader progress={loadModelProgress}>
          {loadModelProgress < 0.5
            ? 'Loading model weights...'
            : loadModelProgress < 0.9
              ? 'Initializing model...'
              : 'Finalizing setup...'}{' '}
          {(loadModelProgress * 100).toFixed(2)}%
        </Loader>
      )}
      <header className="header">
        <h1>AnonyMask: AI-Powered Image Anonymization</h1>
        <h3>
          AnonyMask is a <strong>GDPR-compliant</strong> tool that anonymizes
          images by blurring <strong className="faces">faces</strong> and{' '}
          <strong className="license-plates">license plates</strong> directly in
          your browser.
        </h3>
        <h3>
          Ensure privacy in street photography while adhering to European data
          protection laws.
        </h3>
      </header>

      <main className="canvas-container">
        <img
          className="input-image"
          ref={imageRef}
          onLoad={handleDetection}
          alt="Upload preview"
        />
        <CanvasComponent
          type="input"
          canvasRef={canvasRef}
          onImageUpload={handleImageUpload}
          isPlaceholderVisible={isPlaceholderVisible}
        />
        <div className="blurred-canvas-container">
          <CanvasComponent
            type="output"
            canvasRef={blurredCanvasRef}
            onDownload={handleDownload}
            isPlaceholderVisible={isPlaceholderVisible}
          />
          {busy.busy && (
            <div className="overlay">
              <div className="overlay-gradient-text-wrapper">
                <p className="overlay-gradient-text">{busy.message}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          <strong>Disclaimer:</strong> AnonyMask is designed to help comply with
          GDPR and other privacy laws by anonymizing personal data in images
          directly in your browser.
        </p>
        <p>
          <strong>License:</strong> Based on{' '}
          <a href="https://github.com/tfaehse/DashcamCleaner/tree/72fcbfd0eaa488de8f010544ce1db8c8523b025a">
            DashcamCleaner
          </a>
          , licensed under the{' '}
          <a href="https://www.gnu.org/licenses/agpl-3.0.html">
            GNU Affero General Public License v3.
          </a>{' '}
          The website source-code can be found on{' '}
          <a href="https://github.com/CarolinaBianchi/AnonyMask">GitHub</a>.
        </p>
      </footer>
    </div>
  );
};

export default App;
