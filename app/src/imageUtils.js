// src/imageUtils.js
// Re-encodes a photo before upload. Re-encoding writes a fresh JPEG from the pixel data,
// so EXIF metadata (GPS location, device, timestamp) is not carried over (design document 2.3.4).
// It also downsizes the image so a post stays well under Firestore's 1 MB document limit.
// Requires: npx expo install expo-image-manipulator
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 1080;
const COMPRESS = 0.5;

export const prepareImageForUpload = async (uri, originalWidth) => {
  const resize = originalWidth && originalWidth > MAX_WIDTH ? [{ resize: { width: MAX_WIDTH } }] : [];

  // Newer Expo SDKs (52+) expose the contextual API; older ones only have manipulateAsync.
  if (ImageManipulator.ImageManipulator && ImageManipulator.ImageManipulator.manipulate) {
    const context = ImageManipulator.ImageManipulator.manipulate(uri);
    if (resize.length) context.resize({ width: MAX_WIDTH });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    return { uri: result.uri, base64: `data:image/jpeg;base64,${result.base64}` };
  }

  const result = await ImageManipulator.manipulateAsync(uri, resize, {
    compress: COMPRESS,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return { uri: result.uri, base64: `data:image/jpeg;base64,${result.base64}` };
};
