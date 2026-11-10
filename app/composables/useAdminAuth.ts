import { computed } from "vue";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN";
  avatar: string;
  lastLogin: string;
}

export const useAdminAuth = () => {
  const adminSession = useCookie<AdminUser | null>("temple_super_admin_session", {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    path: "/",
  });

  const isAuthenticated = computed(() => !!adminSession.value);
  const currentUser = computed(() => adminSession.value);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Standard Super Admin demo credentials
    if (
      (trimmedEmail === "admin@temple.org" ||
        trimmedEmail === "superadmin@temple.org" ||
        trimmedEmail === "admin") &&
      (trimmedPass === "admin123" ||
        trimmedPass === "admin" ||
        trimmedPass === "temple@2026")
    ) {
      adminSession.value = {
        id: "sa_001",
        name: "Super Administrator",
        email: trimmedEmail.includes("@") ? trimmedEmail : "admin@temple.org",
        role: "SUPER_ADMIN",
        avatar: "👑",
        lastLogin: new Date().toISOString(),
      };
      return { success: true };
    }

    return {
      success: false,
      error: "Invalid credentials. Use demo: admin@temple.org / admin123",
    };
  };

  const logout = () => {
    adminSession.value = null;
    return navigateTo("/admin/login");
  };

  return {
    adminSession,
    isAuthenticated,
    currentUser,
    login,
    logout,
  };
};
