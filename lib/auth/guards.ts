import { AppError } from "@/lib/http/errors";
import type { CurrentUser } from "@/types/domain";
import type { UserRole } from "@/types/database";

export function requireUser(user: CurrentUser | null): CurrentUser {
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Authentication required.", 401);
  }

  return user;
}

export function requireRole(
  user: CurrentUser | null,
  roles: UserRole[],
): CurrentUser {
  const currentUser = requireUser(user);

  if (!roles.includes(currentUser.role)) {
    throw new AppError("FORBIDDEN", "You do not have access to this resource.", 403);
  }

  return currentUser;
}
