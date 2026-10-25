# EnglishGoPro roadmap

Improvements to make before (and after) the teacher's class starts using the site.
Written 2026-10-25. Tick items off or move them to "Done" as they ship.

## Before the class uses it

### 1. Simple student sign-in (class list + PIN) — biggest, ~1 day
Today a student is a silent guest account remembered by one browser
(`POST /api/auth/guest`, token in localStorage). In a classroom this means:
- **Shared computers leak recordings.** A second kid on the same computer lands
  in the first kid's account and can see and hear their recordings and the
  teacher's replies.
- **Switching devices loses everything.** Clearing the browser, or moving from
  phone to laptop, loses the student's recordings and replies.
- **Names can be confusing.** Students type any name, so two "Amy"s look the
  same to the teacher.

Fix: the teacher adds her students to a class list. Each student signs in by
picking their name and typing a 4-digit PIN. No emails or passwords. The
existing guest accounts (and their recordings) should be mergeable into a
roster student, or simply left as-is.

### 2. Tell the teacher when recordings arrive — small
She only finds out by opening the site. Send a once-a-day email
("3 new recordings, 1 student answered you"), skipped when there is nothing
new. Uses the same counts as `GET /api/submissions/badge`.

### 3. Remove leftover template content — small
- **Dead footer links.** About, Contact, Privacy and Terms have no routes, so
  they fall through to the home page (`frontend/src/pages/Home.tsx` footer;
  `components/layout/Footer.tsx` also links Features, Pricing, Blog, etc.).
- **Fake content.** The home page shows a made-up lesson list
  ("Lesson 1: Greetings…") and promises "achievements and streaks" that don't
  exist.
- **A privacy page.** Say plainly what happens to children's voice recordings:
  who can hear them (only the student and the teacher), where they're stored,
  and how to have them deleted. Parents will ask.

## Soon after

### 4. Translate the menu labels — quick
Student pages switch to Traditional Chinese, but the sidebar labels in
`frontend/src/config/studentSidebar.tsx` (Dashboard, Lessons, Practice,
Pronunciation…) are hard-coded English. Move them to translation keys.

### 5. A speaking prompt for each lesson — small
Let the teacher write what students should say for each video ("Introduce
your favourite animal in two sentences") instead of the generic "say what you
learned". Show it in the lesson's "Record yourself" box. Could live in the
lesson's `practice` JSON.

### 6. Lesson order — small/medium
With courses removed, Lessons is one flat list, newest first. Once there are
20+ videos, add a manual order (drag to reorder) or simple levels/tags so
students can find the right one.

### 7. Test on real phones — testing
Many kids will use phones or tablets. Recording is coded for iPhone Safari
(it records mp4; the server converts it) but hasn't been tried on a real
device. Check: recording, playback of teacher replies, the sidebar on a narrow
screen, and the name prompt.

## Behind the scenes

### 8. Backups — check with whoever runs the server
It's unknown whether the Lightsail server's Postgres database and the
recordings folder (`/srv/englishgopro/storage`) are backed up. If that box
dies, every recording is lost. At minimum, a nightly `pg_dump` plus a copy of
the storage folder somewhere off the server.

### Also known
- 5 backend tests in `tests/integration/auth.test.ts` and
  `tests/unit/middleware/auth.test.ts` have been failing since the
  "teacher-only sign in" change; they need updating to the new rules.

## Done
- 2026-10-25: Courses removed; students record on any lesson; real Students page;
  migrations run on deploy (PR #10).
- 2026-10-25: Student ↔ teacher back-and-forth on recordings; "new reply" badges.
