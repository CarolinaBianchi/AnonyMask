# AnonyMask: Blur Faces and License Plates with TensorFlow.js

<p align="center">
  <img src="./resources/example.png" alt="AnonyMask Sample" />
</p>

---

AnonyMask is a browser-based application for anonymizing images by blurring faces and license plates. It uses **TensorFlow.js** with the `webgl` backend to perform face and plate detection directly in your browser, ensuring privacy compliance with GDPR and similar regulations.

---

## **Features**

- Detects faces and license plates in images.
- Pixelates or masks sensitive areas for GDPR compliance.
- Fully client-side – no data leaves your browser.
- Lightweight and easy to set up.

---

## **Setup**

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/anonymask.git
cd anonymask
yarn install # or npm install
yarn start  # Start the development server
yarn build  # Build for production
```

## **How it Works**

### Model

AnonyMask uses a YOLOv8-based model converted to TensorflowJs.

### Use a Different Model

You can replace the YOLOv8 model with another model trained for object detection:

1. Export your YOLOv8 model to TensorFlow.js format:

```python
from ultralytics import YOLO

# Load your custom YOLOv8 model
model = YOLO("custom-yolov8.pt")  # Replace with your model path

# Export the model to TensorFlow.js format
model.export(format="tfjs")
```

2. Add the exported model to the `/public` directory.

3. Update modelName in `App.jsx`:

```javascript
const modelName = 'custom-model'; // Replace with the new model name
```

4. Update Labels: the corrent model only has two classes: faces and plates, update `src/utils/labels.json` to include your new class names.

## Example

To anonymize an image:

- Click "Upload Image" in the browser interface.
- AnonyMask detects faces and license plates in the uploaded image.
- Pixelated or blurred areas are displayed in real time.
- Download the anonymized image directly from your browser.

## GDPR and Privacy

AnonyMask processes all data locally in your browser, ensuring compliance with privacy regulations such as GDPR. No data is sent to a server.

## License

AnonyMask is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

This project incorporates model weights from [DashcamCleaner](https://github.com/tfaehse/DashcamCleaner/tree/72fcbfd0eaa488de8f010544ce1db8c8523b025a), which is also licensed under the GNU GPL v3.0. Any derivative works of this project must comply with the terms of this license.

## Model Weights

The model weights used in AnonyMask are based on the YOLOv8n model provided by [DashcamCleaner](https://github.com/tfaehse/DashcamCleaner/tree/72fcbfd0eaa488de8f010544ce1db8c8523b025a), licensed under the GNU GPL v3.0.

To make these weights compatible with TensorFlow.js, they were converted from their original Python TensorFlow format to TensorFlow.js format using the following process:

```python
from ultralytics import YOLO

# Load the original YOLOv8 model
model = YOLO("DashcamCleaner/dashcamcleaner/weights/720p_nano_v8.pt")

# Export the model to TensorFlow.js format
model.export(format="tfjs")
```

## Reference

- [YOLOv8](https://github.com/ultralytics/ultralytics/blob/main/docs/en/models/yolov8.md)
- [TensorFlow.js](https://github.com/tensorflow/tfjs)
- The weights of the model are taken from [DashcamCleaner](https://github.com/tfaehse/DashcamCleaner/tree/72fcbfd0eaa488de8f010544ce1db8c8523b025a) licensed under the GNU GPL v3.0. No modifications were made to the weights. If you replace these weights with your own or modify the existing weights, ensure you comply with the terms of the GNU GPL v3.0.
