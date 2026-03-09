alter table locations add column if not exists slug text;

update locations set slug = case city
  when 'Boston'        then 'boston'
  when 'New York'      then 'new-york'
  when 'Los Angeles'   then 'los-angeles'
  when 'Chicago'       then 'chicago'
  when 'Nashville'     then 'nashville'
  when 'Austin'        then 'austin'
  when 'Philadelphia'  then 'philadelphia'
  when 'Atlanta'       then 'atlanta'
  when 'Seattle'       then 'seattle'
  when 'Denver'        then 'denver'
  when 'Miami'         then 'miami'
  when 'Washington'    then 'washington'
  when 'San Francisco' then 'san-francisco'
  when 'Portland'      then 'portland'
  when 'Minneapolis'   then 'minneapolis'
  when 'Dallas'        then 'dallas'
  when 'Houston'       then 'houston'
  when 'Phoenix'       then 'phoenix'
  when 'Detroit'       then 'detroit'
  when 'New Orleans'   then 'new-orleans'
  else lower(replace(city, ' ', '-'))
end
where slug is null;

alter table locations alter column slug set not null;
create unique index if not exists locations_slug_key on locations(slug);
