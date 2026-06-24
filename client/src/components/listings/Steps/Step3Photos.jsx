import React, { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortablePhoto = ({ id, photo, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`photo-item ${isDragging ? 'dragging' : ''}`}
    >
      <img src={photo.preview} alt="Listing Preview" className="photo-img" />
      <button 
        type="button"
        className="photo-remove"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking remove
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
      >
        ×
      </button>
    </div>
  );
};

export default function Step3Photos() {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const photos = watch('photos') || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires a 5px drag to start, allowing clicks to pass through
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(acceptedFiles => {
    // Generate previews and unique IDs
    const newPhotos = acceptedFiles.map(file => Object.assign(file, {
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file)
    }));

    const merged = [...photos, ...newPhotos].slice(0, 10); // Enforce max 10
    setValue('photos', merged, { shouldValidate: true });
  }, [photos, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 10 - photos.length,
    disabled: photos.length >= 10
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((item) => item.id === active.id);
      const newIndex = photos.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(photos, oldIndex, newIndex);
      setValue('photos', newOrder, { shouldValidate: true });
    }
  };

  const removePhoto = (idToRemove) => {
    const filtered = photos.filter(p => p.id !== idToRemove);
    setValue('photos', filtered, { shouldValidate: true });
  };

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Listing Photos</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Upload up to 10 photos. Drag to reorder. The first photo will be your cover image.</p>
      
      {photos.length < 10 && (
        <div 
          {...getRootProps()} 
          className={`dropzone-container ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <svg className="dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="dropzone-text">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop photos here, or click to select files'}
          </p>
          <p className="dropzone-subtext">JPG, PNG or WEBP (Max 10 images)</p>
        </div>
      )}

      {errors.photos && <span className="error-msg" style={{ display: 'block', marginBottom: '1rem' }}>{errors.photos.message}</span>}

      {photos.length > 0 && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={photos.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="photos-grid">
              {photos.map((photo, index) => (
                <SortablePhoto 
                  key={photo.id} 
                  id={photo.id} 
                  photo={photo} 
                  onRemove={removePhoto} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
