# Round two: generated, placed, live

All nine are in the deck. This is the record of what each one is and where it
landed, so any of them can be regenerated against the same brief.

| File | What it is | Where it sits |
|---|---|---|
| `proj-1.jpg` | phone in a stand, headset, printed question sheet | Projects, card 01 (AI Interviewer) |
| `proj-2.jpg` | pencilled flow diagram, pen across it | Projects, card 02 (MIA marketing agent) |
| `proj-3.jpg` | nine prints laid out in a grid, a hand moving one | Projects, card 03 (social desk) |
| `proj-4.jpg` | highlighted printed list, pen, closed notebook | Projects, card 04 (LifeLeads) |
| `svc-4.jpg` | open diary, a week of entries, two crossed out | Skills, pinned in the header band, "the week" |
| `svc-5.jpg` | wall of sticky notes, a hand placing one | Method, bottom corner, "one job per note" |
| `svc-6.jpg` | a month of prints pinned to cork | Toolkit, in the heading band, "a month, pinned" |
| `ct-1.jpg` | hand writing on a notepad by lamplight | Contact, above the details, "last note of the day" |
| `tex-2.jpg` | macro of folded kraft paper | the grain ghost on Toolkit, replacing the repeat |

The four on Projects are cropped to a strip across the top of each card, so
the cards keep their proportions and the text below is untouched. The other
four are snapshots with a handwritten caption, the same treatment as the
polaroids already on Cover, Numbers and Method.

## The one thing still missing

The Projects clippings are objects from the work, not the work. They give each
card something to look at; they do not prove anything. A screenshot does:

- the AI interviewer mid-interview, or the Google Sheet it writes into
- the MIA dashboard
- a LifeLeads sequence with its numbers
- the social dashboard with the nine platforms

Blur or crop anything that names a client. Photographing the screen is fine;
the deck grades everything to a photocopy anyway, so a phone picture of a
monitor will sit on the page as well as an export. Send any of them and they
replace `proj-1` to `proj-4` with no layout change, since the slot is a strip
either way.

## Adding or replacing a picture

1. Save it to `src/assets/.orig/` under the filename of the slot it replaces.
2. If it is a new slot, add it to `EXPOSURE` in `scripts/bake-cuttings.mjs`:
   `"name.jpg": "photo"` for a snapshot, `"grain"` or `"page"` for a ghost.
3. `node scripts/bake-cuttings.mjs`, then `npm run build`.

The bake normalises exposure, so a brighter or darker generation of the same
subject lands in the same place on the sheet. Never bake a file twice; the
originals in `.orig` are the source and stay untouched.
