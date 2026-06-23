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

