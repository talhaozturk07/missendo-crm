
-- Extract city from address for meetings where city is null
UPDATE public.marketer_meetings
SET city = CASE
  WHEN lower(address) LIKE '%west hollywood%' THEN 'West Hollywood'
  WHEN lower(address) LIKE '%beverly hills%' THEN 'Beverly Hills'
  WHEN lower(address) LIKE '%santa monica%' OR lower(address) = 'santa m' THEN 'Santa Monica'
  WHEN lower(address) LIKE '%marina del rey%' THEN 'Marina Del Rey'
  WHEN lower(address) LIKE '%venice%' THEN 'Venice'
  WHEN lower(address) LIKE '%irvine%' THEN 'Irvine'
  WHEN lower(address) LIKE '%tustin%' THEN 'Tustin'
  WHEN lower(address) LIKE '%los angeles%' OR lower(address) LIKE '% la %' THEN 'Los Angeles'
  WHEN lower(address) LIKE '%fairfax%' THEN 'Los Angeles'
  WHEN lower(address) LIKE '%melrose%' THEN 'Los Angeles'
  WHEN lower(address) LIKE '%anaheim%' THEN 'Anaheim'
  WHEN lower(address) LIKE '%3rd street%' THEN 'Santa Monica'
  WHEN lower(address) LIKE '%hair show%' THEN 'Anaheim'
  WHEN lower(address) LIKE '%beverly blvd%' THEN 'Los Angeles'
  WHEN lower(address) LIKE '%overland%' THEN 'Los Angeles'
  ELSE address  -- For simple values like 'Venice', 'Santa monica' use address as city
END
WHERE city IS NULL AND address IS NOT NULL AND address != '';
