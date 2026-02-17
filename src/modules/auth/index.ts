export { mapLoginErrorMessage, resolvePostLoginRedirect } from './client/login.service'
export {
    buildSignupMetadata,
    getAuthRedirectBaseUrl,
    getPostSignupRedirectPath,
    getResetPasswordEmailRedirectUrl,
    getSignupEmailRedirectUrl,
    getSignupRoleFromSearchParams,
    SIGNUP_ROLES,
} from './client/signup.service'
export type { SignupFormPayload, SignupRole } from './client/signup.service'
export { decideMiddlewareNavigation } from './middleware-policy'
export type { MiddlewareDecision } from './middleware-policy'
export { resolveCallbackRedirectPath } from './server/callback.service'
export {
    getAdminPath,
    getDashboardPathForRole,
    getPostAuthRedirectPath,
    getWorkspacePath,
    isAdminPath,
    isAuthEntryPath,
    isPublicPath,
} from './routing'
