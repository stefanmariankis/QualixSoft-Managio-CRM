import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Comment, User } from '@shared/schema';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Trash2, Edit, Reply, Lock, Paperclip, Eye, EyeOff, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface CommentsProps {
  entityType: string;
  entityId: number;
}

interface CommentFormValues {
  content: string;
  parent_id?: number | null;
  is_internal?: boolean;
}

export default function CommentsSection({ entityType, entityId }: CommentsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [isInternal, setIsInternal] = useState<boolean>(false);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<CommentFormValues>({
    defaultValues: {
      content: '',
      parent_id: null,
      is_internal: false
    }
  });
  
  // Obține lista de comentarii
  const { data: comments = [], isLoading, refetch } = useQuery<Comment[]>({
    queryKey: [`/api/${entityType}/${entityId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/${entityType}/${entityId}/comments`);
      if (!response.ok) {
        throw new Error('Eroare la încărcarea comentariilor');
      }
      return response.json();
    }
  });
  
  // Mutație pentru adăugarea unui comentariu nou
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const response = await apiRequest('POST', `/api/${entityType}/${entityId}/comments`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Eroare la adăugarea comentariului');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Succes',
        description: 'Comentariul a fost adăugat cu succes',
      });
      reset();
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}/${entityId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutație pentru actualizarea unui comentariu
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/comments/${id}`, { content });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Eroare la actualizarea comentariului');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Succes',
        description: 'Comentariul a fost actualizat cu succes',
      });
      reset();
      setEditingComment(null);
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}/${entityId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutație pentru ștergerea unui comentariu
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      // Actualizat pentru a folosi noul endpoint în tasks.ts
      const response = await apiRequest('DELETE', `/api/tasks/comments/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Eroare la ștergerea comentariului');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Succes',
        description: 'Comentariul a fost șters cu succes',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}/${entityId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: CommentFormValues) => {
    if (editingComment) {
      updateCommentMutation.mutate({ id: editingComment, content: data.content });
    } else {
      addCommentMutation.mutate({
        content: data.content,
        parent_id: replyTo,
        is_internal: isInternal
      });
    }
  };
  
  const startReply = (commentId: number) => {
    setReplyTo(commentId);
    setEditingComment(null);
    reset({ content: '', parent_id: commentId });
    // Scroll la formularul de comentariu
    setTimeout(() => {
      const element = document.getElementById('comment-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setReplyTo(null);
    setValue('content', comment.content);
    // Scroll la formularul de comentariu
    setTimeout(() => {
      const element = document.getElementById('comment-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const cancelAction = () => {
    setReplyTo(null);
    setEditingComment(null);
    reset();
  };
  
  const confirmDelete = (commentId: number) => {
    if (window.confirm('Sunteți sigur că doriți să ștergeți acest comentariu?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };
  
  // Grupează comentariile după ID-ul părintelui
  const groupedComments: Record<string, Comment[]> = {};
  const topLevelComments: Comment[] = [];
  
  comments.forEach(comment => {
    if (!comment.parent_id) {
      topLevelComments.push(comment);
    } else {
      const parentId = comment.parent_id.toString();
      if (!groupedComments[parentId]) {
        groupedComments[parentId] = [];
      }
      groupedComments[parentId].push(comment);
    }
  });
  
  // Funcție pentru randarea recursivă a comentariilor și răspunsurilor
  const renderCommentWithReplies = (comment: Comment, level: number = 0) => {
    const isCurrentUserAuthor = user?.id === comment.user_id;
    const date = new Date(comment.created_at);
    const isInternal = comment.is_internal;
    
    return (
      <div key={comment.id} className={cn("mb-4", level > 0 && "ml-6 border-l-2 border-gray-200 pl-4")}>
        <Card className={cn(isInternal && "border-2 border-amber-200 bg-amber-50")}>
          <CardHeader className="py-3">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {comment.user_avatar && (
                    <AvatarImage src={comment.user_avatar} alt={comment.user_name || 'User'} />
                  )}
                  <AvatarFallback>{comment.user_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.user_name || 'Utilizator necunoscut'}</span>
                    {isCurrentUserAuthor && (
                      <Badge variant="outline" className="text-xs">Tu</Badge>
                    )}
                    {isInternal && (
                      <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-0">
                        <Lock className="h-3 w-3 mr-1" /> Intern
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(date, 'dd MMM yyyy, HH:mm', { locale: ro })}
                  </div>
                </div>
              </div>
              {isCurrentUserAuthor && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(comment)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => confirmDelete(comment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </CardContent>
          <CardFooter className="py-2 justify-between">
            <div className="text-xs text-gray-500">
              {/* Aici putem adăuga informații adiționale despre comentariu */}
            </div>
            <Button variant="ghost" size="sm" onClick={() => startReply(comment.id)}>
              <Reply className="h-4 w-4 mr-1" />
              Răspunde
            </Button>
          </CardFooter>
        </Card>
        
        {/* Randează răspunsurile la comentariul curent */}
        {groupedComments[comment.id.toString()]?.map(reply => renderCommentWithReplies(reply, level + 1))}
      </div>
    );
  };
  
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comentarii ({comments.length})</h3>
      </div>
      
      {isLoading ? (
        <div className="py-4 text-center">Se încarcă comentariile...</div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-gray-500">Nu există comentarii încă.</div>
      ) : (
        <div className="space-y-4 mb-6">
          {topLevelComments.map(comment => renderCommentWithReplies(comment))}
        </div>
      )}
      
      {user && (
        <div id="comment-form" className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">
            {editingComment 
              ? 'Editează comentariul' 
              : replyTo 
                ? 'Răspunde la comentariu' 
                : 'Adaugă un comentariu nou'}
          </h4>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Textarea
              {...register('content', { required: true })}
              placeholder="Scrie un comentariu..."
              className="min-h-[120px] mb-4"
            />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal-comment"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal-comment" className="flex items-center gap-1 cursor-pointer text-sm">
                  <Lock className="h-3 w-3" /> Comentariu intern (vizibil doar pentru echipă)
                </Label>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500" 
                  onClick={() => {}}
                  title="Adaugă fișier atașat (funcționalitate viitoare)"
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Atașament
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500" 
                  onClick={() => {}}
                  title="Adaugă emoji (funcționalitate viitoare)"
                >
                  <Smile className="h-4 w-4 mr-1" />
                  Emoji
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              {(replyTo || editingComment) && (
                <Button type="button" variant="outline" onClick={cancelAction}>
                  Anulează
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={!watch('content') || addCommentMutation.isPending || updateCommentMutation.isPending}
                className={isInternal ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                <Send className="h-4 w-4 mr-2" />
                {editingComment ? 'Actualizează' : 'Trimite'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}