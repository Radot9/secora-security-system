"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Send, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/app/components/ui/AppShell";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import type { ForumComment, ForumPost } from "@/types/community";

const categories = [
 { value: "general", label: "General" },
 { value: "security", label: "Security" },
 { value: "recommendations", label: "Recommendations" },
 { value: "events", label: "Events" },
 { value: "lost-found", label: "Lost & found" },
] as const;

type Category = ForumPost["category"];

function formatRelativeDate(value: string) {
 const date = new Date(value);
 const elapsedMinutes = Math.round((Date.now() - date.getTime()) / 60000);
 if (elapsedMinutes < 1) return "Just now";
 if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
 if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}h ago`;
 return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function CommunityPage() {
 const [posts, setPosts] = useState<ForumPost[]>([]);
 const [comments, setComments] = useState<ForumComment[]>([]);
 const [userId, setUserId] = useState("");
 const [authorName, setAuthorName] = useState("Resident");
 const [search, setSearch] = useState("");
 const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
 const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
 const [composerOpen, setComposerOpen] = useState(false);
 const [title, setTitle] = useState("");
 const [body, setBody] = useState("");
 const [category, setCategory] = useState<Category>("general");
 const [commentBody, setCommentBody] = useState("");
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 const loadCommunity = useCallback(async () => {
 const { data: authData } = await supabase.auth.getUser();
 const currentUser = authData.user;
 if (!currentUser) { setLoading(false); return; }

 setUserId(currentUser.id);
 const [{ data: resident }, { data: postData, error: postError }] = await Promise.all([
 supabase.from("residents").select("full_name").eq("user_id", currentUser.id).single(),
 supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(100),
 ]);

 if (resident?.full_name) setAuthorName(resident.full_name);
 if (postError) {
 toast.error(`Unable to load community discussions: ${postError.message}`);
 setLoading(false);
 return;
 }

 const loadedPosts = (postData as ForumPost[] | null) ?? [];
 let loadedComments: ForumComment[] = [];
 if (loadedPosts.length > 0) {
 const { data: commentData } = await supabase
 .from("forum_comments")
 .select("*")
 .in("post_id", loadedPosts.map((post) => post.id))
 .order("created_at", { ascending: true })
 .limit(500);
 loadedComments = (commentData as ForumComment[] | null) ?? [];
 }

 setPosts(loadedPosts);
 setComments(loadedComments);
 setLoading(false);
 }, []);

 useEffect(() => {
 const timeoutId = window.setTimeout(() => void loadCommunity(), 0);
 return () => window.clearTimeout(timeoutId);
 }, [loadCommunity]);

 const filteredPosts = useMemo(() => {
 const query = search.trim().toLowerCase();
 return posts.filter((post) => {
 const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
 const matchesSearch = !query || [post.title, post.body, post.author_name, post.category].some((value) => value.toLowerCase().includes(query));
 return matchesCategory && matchesSearch;
 });
 }, [categoryFilter, posts, search]);

 const commentsByPost = useMemo(() => {
 const grouped = new Map<string, ForumComment[]>();
 for (const comment of comments) {
 const existing = grouped.get(comment.post_id);
 if (existing) existing.push(comment);
 else grouped.set(comment.post_id, [comment]);
 }
 return grouped;
 }, [comments]);

 const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;
 const selectedComments = selectedPostId ? commentsByPost.get(selectedPostId) ?? [] : [];

 async function createPost() {
 if (!title.trim() || !body.trim()) { toast.error("Add a title and message to start a discussion."); return; }
 setSubmitting(true);
 const { error } = await supabase.from("forum_posts").insert({
 author_id: userId,
 author_name: authorName,
 title: title.trim(),
 body: body.trim(),
 category,
 });
 setSubmitting(false);
 if (error) { toast.error(`Unable to publish this discussion: ${error.message}`); return; }
 setTitle(""); setBody(""); setCategory("general"); setComposerOpen(false);
 toast.success("Discussion published.");
 await loadCommunity();
 }

 async function createComment() {
 if (!selectedPost || !commentBody.trim()) return;
 setSubmitting(true);
 const { error } = await supabase.from("forum_comments").insert({
 post_id: selectedPost.id,
 author_id: userId,
 author_name: authorName,
 body: commentBody.trim(),
 });
 setSubmitting(false);
 if (error) { toast.error(`Unable to add your comment: ${error.message}`); return; }
 setCommentBody("");
 await loadCommunity();
 }

 return (
 <AppShell size="full" residentSidebar>
 <div className="resident-page">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
 <PageHeader title="Community Forum" subtitle="Ask questions, share recommendations, and connect with your neighbours." />
 <button type="button" onClick={() => setComposerOpen((open) => !open)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
 {composerOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}{composerOpen ? "Close" : "Start a discussion"}
 </button>
 </div>

 {composerOpen && (
 <Card>
 <h2 className="text-lg font-bold">Start a new discussion</h2>
 <div className="mt-5 grid gap-4">
 <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="What would you like to discuss?" className="apple-input w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none" />
 <select value={category} onChange={(event) => setCategory(event.target.value as Category)} className="apple-input w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none sm:max-w-xs">
 {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={6000} rows={5} placeholder="Add context so neighbours can join the conversation..." className="apple-input w-full resize-none rounded-2xl border border-border px-4 py-3 text-sm outline-none" />
 <button type="button" onClick={() => void createPost()} disabled={submitting} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4" />Publish discussion</button>
 </div>
 </Card>
 )}

 <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
 <label className="relative block">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
 <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations, topics, or neighbours..." className="apple-input w-full rounded-2xl border border-border py-3 pl-12 pr-4 text-sm outline-none" />
 </label>
 <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | Category)} className="apple-input rounded-2xl border border-border px-4 py-3 text-sm outline-none">
 <option value="all">All topics</option>
 {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </div>

 <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
 <div className="grid gap-4">
 {loading ? <Card><p className="py-12 text-center text-sm text-muted-foreground">Loading community conversations...</p></Card> : filteredPosts.length === 0 ? (
 <Card className="flex flex-col items-center py-14 text-center"><UsersRound className="h-8 w-8 text-primary" /><h2 className="mt-4 font-bold">No conversations found</h2><p className="mt-2 text-sm text-muted-foreground">Try another search or start the first discussion.</p></Card>
 ) : filteredPosts.map((post) => {
 const postComments = commentsByPost.get(post.id) ?? [];
 return (
 <button key={post.id} type="button" data-interactive="true" onClick={() => setSelectedPostId(post.id)} className="apple-card rounded-3xl border border-border bg-card p-5 text-left">
 <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">{post.category.replace("-", " & ")}</span><span className="text-xs text-muted-foreground">{formatRelativeDate(post.created_at)}</span></div>
 <h2 className="mt-4 text-lg font-bold">{post.title}</h2>
 <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.body}</p>
 <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>By {post.author_name}</span><span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-primary" />{postComments.length} {postComments.length === 1 ? "reply" : "replies"}</span></div>
 </button>
 );
 })}
 </div>

 <Card className="self-start">
 {!selectedPost ? (
 <div className="py-12 text-center"><MessageCircle className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-bold">Join a conversation</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a topic to read the full discussion and add a comment.</p></div>
 ) : (
 <div>
 <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{selectedPost.category.replace("-", " & ")}</span>
 <h2 className="mt-2 text-xl font-bold">{selectedPost.title}</h2>
 <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{selectedPost.body}</p>
 <p className="mt-4 text-xs text-muted-foreground">Started by {selectedPost.author_name} · {formatRelativeDate(selectedPost.created_at)}</p>
 <div className="my-5 border-t border-border" />
 <h3 className="font-bold">Comments ({selectedComments.length})</h3>
 <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
 {selectedComments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet. Be the first to respond.</p> : selectedComments.map((comment) => (
 <article key={comment.id} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{comment.author_name}</p><span className="text-xs text-muted-foreground">{formatRelativeDate(comment.created_at)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.body}</p></article>
 ))}
 </div>
 <div className="mt-5 flex gap-2"><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={2000} rows={2} placeholder="Add a helpful comment..." className="apple-input min-w-0 flex-1 resize-none rounded-2xl border border-border px-3 py-3 text-sm outline-none" /><button type="button" onClick={() => void createComment()} disabled={submitting || !commentBody.trim()} aria-label="Post comment" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-5 w-5" /></button></div>
 </div>
 )}
 </Card>
 </section>
 </div>
 </AppShell>
 );
}
