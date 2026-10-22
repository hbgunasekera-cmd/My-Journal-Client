ALTER TABLE public.location_shares
  ADD COLUMN IF NOT EXISTS video_id text,
  ADD COLUMN IF NOT EXISTS video_title text;

CREATE INDEX IF NOT EXISTS idx_location_shares_video_id
  ON public.location_shares USING btree (video_id)
  WHERE video_id IS NOT NULL;
