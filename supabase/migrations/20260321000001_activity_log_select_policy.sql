-- Allow public read access to activity_log for trending aggregation.
-- Activity data (which media is popular) is not sensitive.
create policy "Activity log is publicly readable"
  on public.activity_log for select
  using (true);
