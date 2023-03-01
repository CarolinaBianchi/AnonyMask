import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const useModelLoader = (loadingState, setLoading) => {
  const [model, setModel] = useState({ net: null, inputShape: [] });
  const [loadModelProgress, setLoadModelProgress] = useState(0);

  // Helper function to update progress with a delay
  const updateProgress = async progress => {
    setLoadModelProgress(progress);
    // Add a small delay after each progress update
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  useEffect(() => {
    const loadModel = async () => {
      try {
        // Initialize backend - 20% of progress
        await updateProgress(0.1);
        let backendName = await initializeBackend();
        await updateProgress(0.2);

        const modelKey = `yolov8_${backendName}_cached_model`;

        // Load model - 60% of progress
        let yolov8;
        try {
          // Try loading from cache first
          await updateProgress(0.3);
          yolov8 = await tf.loadGraphModel(`indexeddb://${modelKey}`);
          await updateProgress(0.8);
        } catch {
          // If not in cache, load from URL with progress tracking
          const modelUrl = `${window.location.href}/720p_nano_v8_web_model/model.json`;
          yolov8 = await tf.loadGraphModel(modelUrl, {
            onProgress: async fraction => {
              // Scale progress between 30% and 80%
              await updateProgress(0.3 + fraction * 0.5);
            },
          });
          // Cache the model
          await yolov8.save(`indexeddb://${modelKey}`);
        }

        // Warm-up phase - 20% of progress
        await updateProgress(0.9);
        const dummyInput = tf.ones(yolov8.inputs[0].shape);
        await yolov8.execute(dummyInput);
        tf.dispose(dummyInput);

        setModel({ net: yolov8, inputShape: yolov8.inputs[0].shape });
        await updateProgress(1);
        setLoading({ loading: false, progress: 1 });
      } catch (error) {
        console.error('Error loading model:', error);
        setLoading({ loading: false, progress: 0 });
      }
    };

    const initializeBackend = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        return 'webgl';
      } catch {
        await tf.setBackend('cpu');
        await tf.ready();
        return 'cpu';
      }
    };

    loadModel();
  }, [setLoading]);

  return { model, loadModelProgress };
};

export default useModelLoader;
