'use client';

import { useState } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import { Comment } from '@/lib/types';
import Link from 'next/link';

interface CommentNodeProps {
  comment: Comment;
  depth?: number;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
}

function CommentNode({ comment, depth = 0, onReply, onLike }: CommentNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;
  const likesCount = comment.likesCount ?? 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="py-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${comment.author.username}`}>
            <Avatar src={comment.author.avatarUrl} name={comment.author.displayName} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${comment.author.username}`} className="font-medium text-sm text-gray-900 hover:underline">
                {comment.author.displayName}
              </Link>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => onLike?.(comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors
                  ${comment.isLiked ? 'text-huum-coral-500' : 'text-gray-400 hover:text-huum-coral-500'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                {likesCount > 0 && <span>{likesCount}</span>}
              </button>

              <button
                onClick={() => onReply?.(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-huum-amber-500 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </button>

              {hasReplies && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasReplies && !collapsed && (
        <div>
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentTreeProps {
  comments: Comment[];
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
}

export function CommentTree({ comments, onReply, onLike }: CommentTreeProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400 text-sm">No comments yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} onReply={onReply} onLike={onLike} />
      ))}
    </div>
  );
}

export default CommentTree;
