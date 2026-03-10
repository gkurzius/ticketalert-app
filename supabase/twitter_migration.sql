alter table events add column if not exists twitter_posted boolean default false;

create index if not exists events_twitter_posted_idx on events (twitter_posted, onsale_datetime);
