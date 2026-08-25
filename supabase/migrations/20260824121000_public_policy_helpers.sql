-- Public-read policies can coexist with admin policies only when PostgreSQL can
-- evaluate the admin predicate for anonymous callers. The security-definer
-- helper returns false for anon and does not expose profile data.
grant execute on function public.is_admin() to anon;
