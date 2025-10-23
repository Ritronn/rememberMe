// src/components/family/MemoryCard.jsx
import React from 'react';
import { Trash2, Edit, Music, Clock, Image } from 'lucide-react';

const MemoryCard = ({ memory, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get first photo as thumbnail or show placeholder
  const thumbnailUrl = memory.photos && memory.photos.length > 0 
    ? memory.photos[0].photo_url 
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-200">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={memory.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Photo count badge */}
        {memory.photos && memory.photos.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Image className="w-3 h-3" />
            {memory.photos.length}
          </div>
        )}

        {/* Audio status badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
          memory.audio_url 
            ? 'bg-green-500 text-white' 
            : 'bg-yellow-500 text-white'
        }`}>
          <Music className="w-3 h-3" />
          {memory.audio_url ? 'Ready' : 'Processing'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {memory.title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {memory.content}
        </p>

        {/* Date */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          {formatDate(memory.created_at)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(memory)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;