# Streak Badge Tier Test Queries

Account: talharizwan178@gmail.com


## Check Current Activity

```sql
SELECT activityDate
FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com')
ORDER BY activityDate DESC
LIMIT 30;
```


## Reset (Clear All Activity)

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');
```


---


# Cross Animation Test Cases

Note: dashboard auto-records today on load. Factor that into expected results.


## Case 1 - Brand New User (day 1, no crosses)

Delete all activity then open the app. Dashboard auto-records today making totalActiveDays = 1.
Since totalActiveDays is not > 1 no crosses appear on missed days.

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');
```

Expected: All 7 flames grey, zero red crosses, streak = 1 after dashboard loads (auto-record)


## Case 2 - Day 2+ With Missed Days (crosses on missed days)

User has been active on multiple days but skipped some this week.
totalActiveDays > 1 so crossed appear on inactive days.

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (SELECT 0 n UNION SELECT 1 UNION SELECT 5 UNION SELECT 6) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Today and yesterday orange flames (streak = 2), 5 and 6 days ago orange, THU/FRI/SAT get red cross animation, totalActiveDays = 4


## Case 3 - Perfect Week (no crosses at all)

All 7 days active, nothing missed.

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: All 7 flames orange, zero crosses, streak = 7, Perfect Week badge


## Case 4 - Long Break Then Came Back (crosses on missed days this week)

Had activity 30 days ago but went inactive. Just came back today.
totalActiveDays > 1 so this week's missed days show crosses.

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (SELECT 20 n UNION SELECT 25 UNION SELECT 30) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Only today is orange (auto-recorded by dashboard), 6 missed days this week get red crosses, streak = 1, totalActiveDays = 4


---


# Badge Tier Tests


## None Tier - 0 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');
```

Expected: Grey shield, None pill, streak = 0


## Bronze Tier - 3 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Bronze shield, streak = 3, 2 sparks, 1 ring


## Silver Tier - 7 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (
  SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
  UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Silver shield, streak = 7, 3 sparks, 1 ring, 2x multiplier


## Gold Tier - 14 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (
  SELECT a.N + b.N * 10 AS n
  FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a
  JOIN (SELECT 0 N UNION SELECT 1) b
  WHERE a.N + b.N * 10 <= 13
) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Gold shield, streak = 14, 4 sparks, 2 rings, 3x multiplier


## Platinum Tier - 30 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (
  SELECT a.N + b.N * 10 AS n
  FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a
  JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) b
  WHERE a.N + b.N * 10 <= 29
) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Platinum shield, streak = 30, 5 sparks, 2 rings, 5x multiplier


## Titanium Tier - 60 days

```sql
DELETE FROM daily_activities
WHERE userId = (SELECT id FROM users WHERE email = 'talharizwan178@gmail.com');

INSERT INTO daily_activities (userId, activityDate, createdAt, updatedAt)
SELECT u.id, DATE_SUB(CURDATE(), INTERVAL n DAY), NOW(), NOW()
FROM users u
JOIN (
  SELECT a.N + b.N * 10 AS n
  FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a
  JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
        UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) b
  WHERE a.N + b.N * 10 <= 59
) nums
WHERE u.email = 'talharizwan178@gmail.com';
```

Expected: Titanium shield, streak = 60, 6 sparks, 3 rings, 10x multiplier


---


## Tier Summary

Tier      | Min Days | Color   | Rings | Sparks | Multiplier
----------|----------|---------|-------|--------|----------
None      | 0        | #6B7280 | 0     | 0      | 1x
Bronze    | 1        | #CD7F32 | 1     | 2      | 1.5x
Silver    | 7        | #94A3B8 | 1     | 3      | 2x
Gold      | 14       | #FBBF24 | 2     | 4      | 3x
Platinum  | 30       | #A78BFA | 2     | 5      | 5x
Titanium  | 60       | #38BDF8 | 3     | 6      | 10x
