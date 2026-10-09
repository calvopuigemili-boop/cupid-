// Puente entre la app (script normal) y @netlify/identity (módulo). Se empaqueta en public/auth.js.
import {
  getUser, login, signup, logout, oauthLogin, handleAuthCallback, onAuthChange,
  getSettings, requestPasswordRecovery, updateUser,
} from "@netlify/identity";

const Auth = {
  getUser, login, signup, logout, oauthLogin, handleAuthCallback, onAuthChange,
  getSettings, requestPasswordRecovery, updateUser,
};
window.CupidAuth = Auth;
window.dispatchEvent(new Event("cupid-auth-ready"));
