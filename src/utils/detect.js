import * as tf from '@tensorflow/tfjs';
import labels from './labels.json';

const numClass = Object.keys(labels).length;

/**
 * Preprocess image before feeding it into the model
 */
const preprocess = async (source, modelWidth, modelHeight) => {
  const [input, maxSize] = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    const [h, w] = img.shape.slice(0, 2);
    const maxSize = Math.max(w, h);
    const imgPadded = img.pad([
      [0, maxSize - h],
      [0, maxSize - w],
      [0, 0],
    ]);

    return [
      tf.image
        .resizeBilinear(imgPadded, [modelWidth, modelHeight])
        .div(255.0)
        .expandDims(0),
      maxSize,
    ];
  });

  return [input, [maxSize / modelWidth, maxSize / modelHeight]];
};

/**
 * Run detection on the image and return results
 */
export const detect = async (source, model) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);

  tf.engine().startScope();
  try {
    const [input, ratios] = await preprocess(source, modelWidth, modelHeight);
    const [xRatio, yRatio] = ratios;
    const res = model.net.execute(input);

    const transposedRes = res.transpose([0, 2, 1]);

    // Extract bounding boxes
    const boxes = tf.tidy(() => {
      const w = transposedRes.slice([0, 0, 2], [-1, -1, 1]);
      const h = transposedRes.slice([0, 0, 3], [-1, -1, 1]);
      const x1 = tf.sub(
        transposedRes.slice([0, 0, 0], [-1, -1, 1]),
        tf.div(w, 2)
      );
      const y1 = tf.sub(
        transposedRes.slice([0, 0, 1], [-1, -1, 1]),
        tf.div(h, 2)
      );
      return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze();
    });

    // Extract scores and classes
    const [scores, classes] = tf.tidy(() => {
      const rawScores = transposedRes
        .slice([0, 0, 4], [-1, -1, numClass])
        .squeeze(0);
      return [rawScores.max(1), rawScores.argMax(1)];
    });

    const nms = await tf.image.nonMaxSuppressionAsync(
      boxes,
      scores,
      500,
      0.45,
      0.2
    );

    const boxesData = boxes.gather(nms, 0).arraySync();
    const scoresData = scores.gather(nms, 0).arraySync();
    const classesData = classes.gather(nms, 0).arraySync();

    return {
      boxes: boxesData,
      scores: scoresData,
      classes: classesData,
      ratios: [xRatio, yRatio],
    };
  } finally {
    tf.engine().endScope();
  }
};

/**
 * Draw detection boxes with labels on a canvas
 */
export const drawBoxes = async (canvas, detections, canvasRatios) => {
  const { boxes, scores, classes, ratios } = detections;
  const [xRatio, yRatio] = ratios.map(
    (value, index) => value * canvasRatios[index]
  );
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  boxes.forEach(([y1, x1, y2, x2], i) => {
    const width = (x2 - x1) * xRatio;
    const height = (y2 - y1) * yRatio;
    const x = x1 * xRatio;
    const y = y1 * yRatio;

    // Get label and color
    const className = Object.keys(labels)[classes[i]];
    const color = labels[className] || '#000000'; // Default to black if color not defined

    // Draw the detection box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw the label with the score
    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.fillText(
      `${className} (${(scores[i] * 100).toFixed(1)}%)`,
      x,
      y > 10 ? y - 5 : 10
    );
  });
};

/**
 * Pixelate or blur detected regions on a canvas
 */
export const pixelateBoxes = async (canvas, detections, canvasRatios) => {
  const { boxes, ratios, classes } = detections;
  const [xRatio, yRatio] = ratios.map(
    (value, index) => value * canvasRatios[index]
  );
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  boxes.forEach(([y1, x1, y2, x2], index) => {
    const width = Math.min((x2 - x1) * xRatio, canvas.width - x1 * xRatio);
    const height = Math.min((y2 - y1) * yRatio, canvas.height - y1 * yRatio);
    const x = x1 * xRatio;
    const y = y1 * yRatio;

    if (width > 0 && height > 0) {
      if (classes[index] === 0) {
        // PLATE: Paint the box white
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, width, height);
      } else {
        // Blur or pixelate the region
        const blockSize = Math.ceil(Math.max(width / 4, height / 4));
        applyPixelation(canvas, x, y, width, height, blockSize);
      }
    }
  });
};

/**
 * Helper function to apply pixelation to a canvas region
 */
const applyPixelation = (canvas, x, y, width, height, blockSize) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(x, y, width, height);
  const { data } = imageData;
  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const centerX = Math.min(bx + Math.floor(blockSize / 2), width - 1);
      const centerY = Math.min(by + Math.floor(blockSize / 2), height - 1);
      const centerIndex = (centerY * imageData.width + centerX) * 4;

      const r = data[centerIndex];
      const g = data[centerIndex + 1];
      const b = data[centerIndex + 2];

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(
        x + bx,
        y + by,
        Math.max(0, Math.min(blockSize, width - bx)),
        Math.max(0, Math.min(blockSize, height - by))
      );
    }
  }
};
