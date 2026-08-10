/** True when tenant API reads should run (signed-in workspace or demo preview). */
export function hasTenantApiAccess(isAuthenticated: boolean, isDemo: boolean): boolean {
  return isAuthenticated || isDemo;
}
