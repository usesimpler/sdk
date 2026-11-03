export type OAuthAuth = {
  type: "oauth";
  /** Bearer access token; omit header when null (e.g. public org-scoped reads). */
  accessToken: string | null;
};

export type SessionAuth = {
  type: "session";
  getAccessToken: () => Promise<string | null>;
  credentials?: RequestCredentials;
};

export type SimplerAuth = OAuthAuth | SessionAuth;
