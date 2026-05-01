-- Accept text-based callers and coerce into the audit enum so existing RPCs
-- keep working even if they were compiled against text CASE expressions.
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_actor_user_id uuid,
  p_actor_role text,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_before_data jsonb,
  p_after_data jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data
  )
  VALUES (
    p_actor_user_id,
    p_actor_role::public.audit_actor_type,
    p_entity_type,
    p_entity_id,
    p_action,
    p_before_data,
    p_after_data
  );
$$;
