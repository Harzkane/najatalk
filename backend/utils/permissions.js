// backend/utils/permissions.js

export const ROLE_PERMISSIONS = {
  user: [],
  mod: ["threads.moderate"],
  admin: ["*"],
  super_admin: ["*"],
};

export const ASSIGNABLE_ROLES = ["user", "mod", "admin", "super_admin"];

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
};

export const resolveUserPermissions = (user) => {
  const role = user?.role || "user";
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  const granted = toStringArray(user?.permissions);
  const denied = new Set(toStringArray(user?.deniedPermissions));

  const all = new Set([...rolePermissions, ...granted]);
  return { all, denied };
};

export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;
  const { all, denied } = resolveUserPermissions(user);
  if (denied.has(permission)) return false;
  return all.has("*") || all.has(permission);
};

export const hasAnyPermission = (user, permissions = []) =>
  permissions.some((permission) => hasPermission(user, permission));
