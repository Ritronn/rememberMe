// src/components/family/MemoryList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MemoryCard from './MemoryCard';
import { Loader2, FolderOpen } from 'lucide-react';

const MemoryList = ({ familyMemberId, onEdit, refreshTrigger }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch memories from Supabase
  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch memories with their photos
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('memories')
        .select(`
          *,
          photos:memory_photos(*)
        `)
        .eq('family_member_id', familyMemberId)
        .order('created_at', { ascending: false });

      if (memoriesError) throw memoriesError;

      setMemories(memoriesData || []);
    } catch (err) {
      console.error('Error fetching memories:', err);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    if (familyMemberId) {
      fetchMemories();
    }
  }, [familyMemberId, refreshTrigger]);

  // Delete memory with confirmation
  const handleDelete = async (memoryId) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      // Remove from state
      setMemories(memories.filter(m => m.id !== memoryId));
    } catch (err) {
      console.error('Error deleting memory:', err);
      alert('Failed to delete memory');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading memories...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMemories}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No memories yet
        </h3>
        <p className="text-gray-500 mb-4">
          Create your first memory to get started!
        </p>
      </div>
    );
  }

  // Grid of memories
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default MemoryList;