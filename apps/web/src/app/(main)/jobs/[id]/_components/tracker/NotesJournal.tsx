'use client';

import type { ApplicationNote, NoteTag } from '@praman/schemas';
import { Loader2, MessageSquare, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddJobNote, useDeleteJobNote, useUpdateJobNote } from '@/hooks/usePramanApi';
import { NOTE_TAGS } from './constants';
import { NoteCard } from './NoteCard';

interface NotesJournalProps {
  jobId: string;
  notes: ApplicationNote[];
}

export const NotesJournal: React.FC<NotesJournalProps> = ({ jobId, notes }) => {
  const addNoteMutation = useAddJobNote(jobId);
  const updateNoteMutation = useUpdateJobNote(jobId);
  const deleteNoteMutation = useDeleteJobNote(jobId);
  const [deletingNote, setDeletingNote] = useState<ApplicationNote | null>(null);

  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<NoteTag>('GENERAL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteContent.trim();
    if (!content) return;
    await addNoteMutation.mutateAsync({
      content,
      tag: newNoteTag,
      isPinned: false,
    });
    setNewNoteContent('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNote) return;
    try {
      await deleteNoteMutation.mutateAsync(deletingNote.id);
      setDeletingNote(null);
    } catch {
      // Handled by mutation toast
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesTag = selectedTagFilter === 'ALL' || n.tag === selectedTagFilter;
    const matchesSearch =
      !searchQuery ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const isPending = addNoteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">Application Journal & Notes</h3>
          <Badge variant="outline" className="text-xs font-mono ml-1">
            {notes.length}
          </Badge>
        </div>
      </div>

      {/* Quick Note Composer */}
      <Card className="p-4 rounded-2xl border-border bg-card shadow-xs space-y-3">
        <form onSubmit={handleAddNote} className="space-y-3">
          <Textarea
            placeholder="Log notes, salary details, questions to ask, or debrief after an interview..."
            disabled={isPending}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-20 text-xs bg-muted/20 border-border resize-y"
          />
          <div className="flex items-center justify-between gap-2">
            <Select
              value={newNoteTag}
              disabled={isPending}
              onValueChange={(v) => setNewNoteTag(v as NoteTag)}
            >
              <SelectTrigger className="w-40 text-xs h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TAGS.map((t) => (
                  <SelectItem key={t.tag} value={t.tag} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="submit"
              size="sm"
              disabled={!newNoteContent.trim() || isPending}
              className="text-xs gap-1.5 bg-primary text-primary-foreground"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Add Note</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Note Search & Filter Chips */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20 border-border"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            variant={selectedTagFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTagFilter('ALL')}
            className="text-xs h-7 px-2.5 rounded-lg"
          >
            All ({notes.length})
          </Button>
          {NOTE_TAGS.map((t) => {
            const count = notes.filter((n) => n.tag === t.tag).length;
            if (count === 0 && selectedTagFilter !== t.tag) return null;
            return (
              <Button
                key={t.tag}
                variant={selectedTagFilter === t.tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTagFilter(t.tag)}
                className="text-xs h-7 px-2.5 rounded-lg"
              >
                {t.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Notes Feed */}
      <div className="space-y-2.5">
        {filteredNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            No notes found matching your filter.
          </p>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={() =>
                updateNoteMutation.mutate({
                  noteId: note.id,
                  data: { isPinned: !note.isPinned },
                })
              }
              onDelete={() => setDeletingNote(note)}
            />
          ))
        )}
      </div>

      {/* Note Deletion Safety Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deletingNote)}
        onOpenChange={(open) => !open && setDeletingNote(null)}
        title="Delete Journal Note"
        itemTitle={deletingNote ? `${deletingNote.tag} note` : 'Note'}
        description={
          deletingNote && (
            <>
              Are you sure you want to delete this{' '}
              <span className="font-semibold text-foreground">[{deletingNote.tag}]</span> note?
              &ldquo;
              <span className="italic">
                {deletingNote.content.slice(0, 80)}
                {deletingNote.content.length > 80 ? '...' : ''}
              </span>
              &rdquo; This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete Note"
        isDeleting={deleteNoteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
