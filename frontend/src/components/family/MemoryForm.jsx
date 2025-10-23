// src/components/family/MemoryForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase, uploadFile } from '../../lib/supabase';
import { X, Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

const MemoryForm = ({ isOpen, onClose, familyMemberId, editingMemory, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title || '');
      setContent(editingMemory.content || '');
      setExistingPhotos(editingMemory.photos || []);
      setPhotos([]);
    } else {
      resetForm();
    }
  }, [editingMemory, isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPhotos([]);
    setExistingPhotos([]);
    setError('');
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length + existingPhotos.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }
    setPhotos([...photos, ...files]);
    setError('');
  };

  // Remove new photo before upload
  const removeNewPhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Remove existing photo
  const removeExistingPhoto = (photoId) => {
    setExistingPhotos(existingPhotos.filter(p => p.id !== photoId));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let memoryId = editingMemory?.id;

      // Create or update memory
      if (editingMemory) {
        // Update existing memory
        const { error: updateError } = await supabase
          .from('memories')
          .update({
            title: title.trim(),
            content: content.trim(),
          })
          .eq('id', editingMemory.id);

        if (updateError) throw updateError;

        // Delete removed existing photos from database
        const removedPhotoIds = editingMemory.photos
          ?.filter(p => !existingPhotos.find(ep => ep.id === p.id))
          .map(p => p.id) || [];

        if (removedPhotoIds.length > 0) {
          await supabase
            .from('memory_photos')
            .delete()
            .in('id', removedPhotoIds);
        }
      } else {
        // Create new memory
        const { data: memoryData, error: memoryError } = await supabase
          .from('memories')
          .insert({
            family_member_id: familyMemberId,
            title: title.trim(),
            content: content.trim(),
          })
          .select()
          .single();

        if (memoryError) throw memoryError;
        memoryId = memoryData.id;
      }

      // Upload new photos
      if (photos.length > 0) {
        const photoUploadPromises = photos.map(async (photo) => {
          const fileName = `${memoryId}/${Date.now()}-${photo.name}`;
          const { url, error: uploadError } = await uploadFile('memory-photos', fileName, photo);
          
          if (uploadError) throw uploadError;

          // Save photo URL to database
          const { error: insertError } = await supabase
            .from('memory_photos')
            .insert({
              memory_id: memoryId,
              photo_url: url,
            });

          if (insertError) throw insertError;
        });

        await Promise.all(photoUploadPromises);
      }

      // Success
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error saving memory:', err);
      setError('Failed to save memory. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            {editingMemory ? 'Edit Memory' : 'Create New Memory'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beach trip 2019"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={uploading}
              required
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Description *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe this memory in detail..."
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={uploading}
              required
            />
          </div>

          {/* Photos */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional, max 5)
            </label>

            {/* Existing photos */}
            {existingPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt="Memory"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New photos preview */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {(photos.length + existingPhotos.length) < 5 && (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Upload Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                editingMemory ? 'Update Memory' : 'Create Memory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemoryForm;