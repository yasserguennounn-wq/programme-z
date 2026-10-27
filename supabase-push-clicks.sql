-- شغّل هذا الملف مرة واحدة في Supabase: SQL Editor
create table if not exists public.push_clicks(
  body text not null,
  d date not null default ((now() at time zone 'Africa/Algiers')::date),
  n int not null default 0,
  primary key(body,d)
);
alter table public.push_clicks enable row level security;
drop policy if exists push_clicks_admin_read on public.push_clicks;
create policy push_clicks_admin_read on public.push_clicks for select using (public.is_admin());

create or replace function public.push_click(p_body text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_body is null or length(p_body)=0 or length(p_body)>300 then return; end if;
  -- يُحتسب فقط نص مطابق لرسالة مجدولة موجودة (يمنع تعبئة الجدول بنصوص عشوائية)
  if not exists(select 1 from public.push_schedule where btrim(body)=p_body) then return; end if;
  insert into public.push_clicks(body,d,n) values(p_body,(now() at time zone 'Africa/Algiers')::date,1)
  on conflict(body,d) do update set n=public.push_clicks.n+1;
end $$;
revoke all on function public.push_click(text) from public;
grant execute on function public.push_click(text) to anon, authenticated;
