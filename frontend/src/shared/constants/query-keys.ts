export const queryKeys = {
  unreadNotifications: ["notifications", "unread"] as const,
  comments: (projectId: string) => ["comments", projectId] as const,
  adminUsers: ["admin", "users"] as const,
};
