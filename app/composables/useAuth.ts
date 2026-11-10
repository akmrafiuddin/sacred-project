import { computed } from "vue";
import { authClient } from "../utils/auth-client";
import type { Role } from "../../shared/types";

export interface AuthUserInfo {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  image?: string | null;
}

export const useAuth = () => {
  const session = authClient.useSession();

  const user = computed<AuthUserInfo | null>(() => {
    const u = session.value?.data?.user;
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u as any).role || "user",
      phone: (u as any).phone || null,
      image: u.image || null,
    };
  });

  const isAuthenticated = computed(() => !!user.value);
  const role = computed<Role | "guest">(() => user.value?.role || "guest");
  const isAdmin = computed(() => role.value === "admin");
  const isEditor = computed(() => role.value === "editor");
  const isStaff = computed(() => role.value === "admin" || role.value === "editor");
  const isUser = computed(() => role.value === "user");

  const login = async (
    email: string,
    pass: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string; role?: Role }> => {
    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password: pass.trim(),
        rememberMe,
      });

      if (error) {
        return {
          success: false,
          error: error.message || "Invalid email or password",
        };
      }

      const assignedRole = (data?.user as any)?.role as Role || "user";
      return { success: true, role: assignedRole };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "An unexpected error occurred during login",
      };
    }
  };

  const logout = async (redirectTo = "/admin/login") => {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    if (redirectTo) {
      await navigateTo(redirectTo);
    }
  };

  return {
    session,
    user,
    currentUser: user, // Alias for legacy code
    isAuthenticated,
    role,
    isAdmin,
    isEditor,
    isStaff,
    isUser,
    login,
    logout,
  };
};
