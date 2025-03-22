import { supabase } from './supabase';

/**
 * Upload an image to Supabase Storage
 * @param {string} bucketName - The name of the storage bucket (e.g., 'profile-images')
 * @param {string} folderPath - The folder path within the bucket (usually user ID)
 * @param {string} uri - The local URI of the image to upload
 * @returns {Promise<string|null>} - Returns the public URL of the uploaded image or null if failed
 */
export const uploadImage = async (bucketName, folderPath, uri) => {
  if (!uri) return null;
  
  try {
    // Get the file extension from the URI
    const fileName = uri.split('/').pop();
    const fileExt = fileName.split('.').pop();
    
    // Create a unique file name
    const filePath = `${folderPath}/${Date.now()}.${fileExt}`;
    
    // Convert the image to a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    console.log(`Uploading image to ${bucketName}/${filePath}`);
    
    // Upload the image to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log("Image uploaded successfully, URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} bucketName - The name of the storage bucket
 * @param {string} path - The full path to the file within the bucket
 * @returns {Promise<boolean>} - Returns true if deleted successfully, false otherwise
 */
export const deleteImage = async (bucketName, path) => {
  try {
    // Extract the path from the public URL if a full URL is provided
    if (path.startsWith('http')) {
      const url = new URL(path);
      // The path will be after the bucket name in the URL
      const pathParts = url.pathname.split(`/${bucketName}/`);
      if (pathParts.length > 1) {
        path = pathParts[1];
      } else {
        throw new Error('Invalid URL format for deletion');
      }
    }
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);
    
    if (error) throw error;
    
    console.log(`Image deleted successfully from ${bucketName}/${path}`);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};