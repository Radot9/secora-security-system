export type Announcement = {
 id: string;
 title: string;
 body: string;
 category: "community" | "security" | "maintenance" | "event";
 published_at: string;
};

export type ForumPost = {
 id: string;
 author_id: string;
 author_name: string;
 title: string;
 body: string;
 category: "general" | "security" | "recommendations" | "events" | "lost-found";
 created_at: string;
 updated_at: string;
};

export type ForumComment = {
 id: string;
 post_id: string;
 author_id: string;
 author_name: string;
 body: string;
 created_at: string;
 updated_at: string;
};
