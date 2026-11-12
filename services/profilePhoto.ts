import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from './firebase';

const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

export async function uploadProfilePhoto(
  uid: string,
  uri: string,
  mimeType?: string | null,
) {
  const response = await fetch(uri);
  const image = await response.blob();

  if (image.size > MAX_PROFILE_PHOTO_SIZE) {
    throw new Error('A foto do perfil deve ter no máximo 5 MB.');
  }

  const contentType = mimeType?.startsWith('image/')
    ? mimeType
    : 'image/jpeg';
  const photoRef = ref(storage, `profilePhotos/${uid}/profile`);

  await uploadBytes(photoRef, image, { contentType });
  return getDownloadURL(photoRef);
}
