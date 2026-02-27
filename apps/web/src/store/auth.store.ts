interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
  } | null;
}

let state: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

export const authStore = {
  getAccessToken: () => state.accessToken,
  getRefreshToken: () => state.refreshToken,
  getUser: () => state.user,

  setTokens: (accessToken: string, refreshToken: string) => {
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  },

  setUser: (user: AuthState["user"]) => {
    state.user = user;
  },

  clear: () => {
    state = {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  },

  isAuthenticated: () => !!state.accessToken,
};
