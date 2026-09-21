'use client';

import type { ApplicationNote } from '@praman/schemas';
import { Pin, Trash2 } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { NOTE_TAGS } from './constants';

interface NoteCardProps {
  note: ApplicationNote;
  onTogglePin: () => void;
  onDelete: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onTogglePin, onDelete }) => {
  const tagInfo = NOTE_TAGS.find((t) => t.tag === note.tag) || NOTE_TAGS[0];

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        note.isPinned
          ? 'border-primary/40 bg-primary/5 shadow-2xs'
          : 'border-border bg-card hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-semibold ${tagInfo.color}`}
          >
            {tagInfo.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1 rounded transition-colors ${
              note.isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-primary' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-foreground/90 leading-relaxed mt-2 whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  );
};
