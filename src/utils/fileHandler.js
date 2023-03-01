import { pixelateBoxes } from './detect';

/**
 * Save a pixelated version of the canvas.
 * @param {Object} imageRef - Reference to the original image.
 * @param {Object} detections - Detection results (boxes, classes, ratios, etc.).
 */
export const saveFile = async (imageRef, detections) => {
  // Create a temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageRef.current.naturalWidth;
  tempCanvas.height = imageRef.current.naturalHeight;

  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageRef.current, 0, 0);

  // Apply pixelation using `pixelateBoxes`
  const scaleFactors = [1, 1]; // Adjust scale factors if needed
  await pixelateBoxes(tempCanvas, detections, scaleFactors);

  // Convert the canvas content to a Blob
  const blob = await new Promise(resolve =>
    tempCanvas.toBlob(resolve, 'image/png')
  );

  // Define options for the file picker
  const options = {
    types: [
      {
        description: 'PNG file',
        accept: { 'image/png': ['.png'] },
      },
    ],
  };

  try {
    // Open the save file dialog
    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();

    // Write the Blob to the file
    await writable.write(blob);
    await writable.close();
    console.log('File saved successfully!');
  } catch (err) {
    console.error('Save operation was cancelled or failed:', err);
  }
};
