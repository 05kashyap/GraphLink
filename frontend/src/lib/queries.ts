import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import { api } from "./api";
import type {
  Comment,
  GraphData,
  Me,
  Paginated,
  Post,
  Recommendations,
  UserProfile,
  UserSummary,
} from "./types";

export type Feed = "latest" | "following";
export type Relation = "followers" | "following";

const nextPage = (last: Paginated<unknown>, all: Paginated<unknown>[]) => (last.next ? all.length + 1 : undefined);

/* ---------- session ---------- */

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: Me | null }>("auth/me").then((data) => data.user),
    staleTime: 60_000,
  });
}

/** Everything that depends on who is logged in is refetched after auth changes. */
function resetSession(qc: QueryClient, user: Me | null) {
  qc.setQueryData(["me"], user);
  qc.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      api<{ user: Me }>("auth/login", { method: "POST", body }),
    onSuccess: (data) => resetSession(qc, data.user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; email: string; password1: string; password2: string }) =>
      api<{ user: Me }>("auth/register", { method: "POST", body }),
    onSuccess: (data) => resetSession(qc, data.user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("auth/logout", { method: "POST" }),
    onSuccess: () => resetSession(qc, null),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => api<{ user: Me }>("auth/me", { method: "PATCH", body: form }),
    onSuccess: (data) => {
      qc.setQueryData(["me"], data.user);
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "me" });
    },
  });
}

/* ---------- posts ---------- */

export function useFeed(feed: Feed) {
  return useInfiniteQuery({
    queryKey: ["posts", feed],
    queryFn: ({ pageParam }) => api<Paginated<Post>>(`posts?feed=${feed}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "user", username],
    queryFn: ({ pageParam }) => api<Paginated<Post>>(`users/${username}/posts?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useFeatured() {
  return useQuery({
    queryKey: ["posts", "featured"],
    queryFn: () => api<{ post: Post | null }>("posts/featured").then((data) => data.post),
  });
}

export function usePost(id: number) {
  return useQuery({ queryKey: ["post", id], queryFn: () => api<Post>(`posts/${id}`) });
}

/** Apply an update to a post wherever it is cached: feeds, profile lists, detail. */
function patchPost(qc: QueryClient, id: number, update: (post: Post) => Post) {
  qc.setQueriesData<InfiniteData<Paginated<Post>>>({ queryKey: ["posts"] }, (data) => {
    if (!data || !("pages" in data)) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        results: page.results.map((post) => (post.id === id ? update(post) : post)),
      })),
    };
  });
  qc.setQueryData<Post | null>(["posts", "featured"], (post) => (post && post.id === id ? update(post) : post));
  qc.setQueryData<Post>(["post", id], (post) => (post ? update(post) : post));
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (post: Post) => api<Post>(`posts/${post.id}/like`, { method: post.liked_by_me ? "DELETE" : "POST" }),
    onMutate: (post) => {
      const liked = !post.liked_by_me;
      patchPost(qc, post.id, (p) => ({ ...p, liked_by_me: liked, like_count: p.like_count + (liked ? 1 : -1) }));
    },
    onError: (_error, post) => patchPost(qc, post.id, () => post),
    onSuccess: (fresh) => patchPost(qc, fresh.id, () => fresh),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; content: string }) => api<Post>("posts", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useUpdatePost(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; content: string }) => api<Post>(`posts/${id}`, { method: "PATCH", body }),
    onSuccess: (post) => patchPost(qc, post.id, () => post),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`posts/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["post", id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api<Comment[]>(`posts/${postId}/comments`),
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api<Comment>(`posts/${postId}/comments`, { method: "POST", body: { body } }),
    onSuccess: (comment) => {
      qc.setQueryData<Comment[]>(["comments", postId], (list) => [...(list ?? []), comment]);
      patchPost(qc, postId, (post) => ({ ...post, comment_count: post.comment_count + 1 }));
    },
  });
}

/* ---------- people ---------- */

export function useUser(username: string) {
  return useQuery({ queryKey: ["user", username], queryFn: () => api<UserProfile>(`users/${username}`) });
}

export function useUsers(search: string) {
  return useInfiniteQuery({
    queryKey: ["users", search],
    queryFn: ({ pageParam }) =>
      api<Paginated<UserProfile>>(`users?page=${pageParam}&search=${encodeURIComponent(search)}`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useConnections(username: string, relation: Relation) {
  return useInfiniteQuery({
    queryKey: ["connections", username, relation],
    queryFn: ({ pageParam }) => api<Paginated<UserSummary>>(`users/${username}/${relation}?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username, follow }: { username: string; follow: boolean }) =>
      api<UserProfile>(`users/${username}/follow`, { method: follow ? "POST" : "DELETE" }),
    onSuccess: (profile) => {
      qc.setQueryData(["user", profile.username], profile);
      // The social graph changed, so everything derived from it is stale.
      for (const key of ["me", "users", "connections", "graph", "recommendations"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      qc.invalidateQueries({ queryKey: ["posts", "following"] });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

/* ---------- graph ---------- */

export function useGraph() {
  return useQuery({ queryKey: ["graph"], queryFn: () => api<GraphData>("graph"), staleTime: 30_000 });
}

export function useRecommendations(enabled: boolean) {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api<Recommendations>("recommendations"),
    enabled,
    staleTime: 30_000,
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: import("./api").ApiError;
  }
}
