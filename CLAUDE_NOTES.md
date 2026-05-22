# Claude Notes — GymLogs Projekt-Gedächtnis

> Diese Datei ist das **kumulative Gedächtnis** von Claude-Sessions in GymLogs.
> Nach jedem erfolgreichen Fix wird hier ein Eintrag im unten definierten Format ergänzt.
> Vor neuen Aufgaben **erst hier nachsehen**, ob es schon eine relevante Notiz gibt.

---

## Methodik: Bodygraph-Muskel-Masken korrekt bauen

Bewährter Workflow, mit dem die Masken in [public/bodygraph-masks/](public/bodygraph-masks/) reproduzierbar korrekt werden. Vor jeder Muskel-Masken-Änderung diese Methode anwenden statt zu raten.

**Architektur-Klärung (oft missverstanden):**
- Die App nutzt **keine SVGs** für die Muskelzonen. Es sind PNG-Masken (1448×1086) die via CSS `mask-image` über das Body-Image gelegt werden.
- Es gibt **ein gemeinsames** Body-Image für Front + Back ([public/bodygraph-muscle-map-transparent.png](public/bodygraph-muscle-map-transparent.png)) und **eine PNG pro Muskelgruppe**. Die Trennung Front/Back ist nur durch die x-Koordinate gegeben: Front-View ist x<720, Back-View ist x>720 (Body-Center Back-View: x=1054).
- Es gibt **keinen eigenen Body-Part** für Waden, Quads, Hamstrings, Forearms — die werden über `toBodyPart()` in [src/lib/muscle-groups.ts](src/lib/muscle-groups.ts) auf `legs` (Waden/Quads/Hamstrings) bzw. `other` (Forearms) gemappt.

**Schritt-für-Schritt für jede Masken-Änderung:**

1. **Aktuelle Maske visuell anschauen** mit Read auf die PNG-Datei. Sieht man schon hier, was fehlt oder zu viel ist.
2. **Pixel-Level-Analyse** der aktuellen Maske mit Python (`PIL + numpy + scipy.ndimage.label`):
   - `np.array(Image.open(...))[:,:,3]` für Alpha-Kanal
   - `scipy.ndimage.label` auf binary mask findet alle disconnected components
   - Für jede Komponente: y-Range, x-Range, Pixel-Count → identifiziert Artefakte, fehlende Bereiche, falsche Blobs
3. **Source-Image-Analyse** mit gleicher Methode auf den Body-Fill-Pixeln:
   - `fill = (rgb[:,:,0] >= 215) & (rgb[:,:,1] >= 215) & (rgb[:,:,2] >= 220)`
   - `scipy.ndimage.label(fill)` listet alle **einzelnen anatomischen Muskel-Segmente** im Source als Labels L1, L2, …
   - Pro Muskelgruppe filtere die Labels nach x-Range (Front vs Back), y-Range, Pixel-Count
4. **Komponenten klassifizieren, BEVOR du sie übernimmst**: bei y=400 in Front-View ist die Körper-Aufteilung `Linker Arm x=202-271 | Torso x=314-492 | Rechter Arm x=535-605`. Eine Komponente bei x=200-237 ist **niemals** Core, sondern Forearm. Immer per Pixel-Pattern an der x-Position gegenchecken statt nach Augenschein zu raten.
5. **Debug-PNG für sich selbst rendern** (z.B. `_debug-candidates.png` mit jedem Label in einer eigenen Farbe). Per Read in die Konversation laden und **visuell verifizieren** vor dem finalen Build.
6. **Maske bauen**: ausgewählte Labels zu boolean mask `|=` kombinieren → `binary_dilation(iterations=2)` zum Schließen der Outline-Gaps → mit RGBA (239,68,68,150) zurückschreiben. Alpha **muss** 150 sein (alle anderen Masken sind auf 150 normiert; abweichende Alpha-Werte führen zu unterschiedlichen Helligkeiten in der Volume-Color-Zone).
7. **Overlay-Render zur Final-Verifikation**: `Image.alpha_composite(source, mask)` und Read auf die Output-PNG zeigt die Maske im Kontext des Body-Images.
8. **Overlap-Check** mit anderen Masken: für jede betroffene Muskelgruppe prüfen ob neue Pixel mit `chest.png`, `shoulders.png`, `back.png` überlappen. Bei Overlap: `mask_pixels[other_mask] = False`.
9. **Debug-PNGs aufräumen** vor dem Commit (`rm public/bodygraph-masks/_debug-*.png`).

**Wichtige Konstanten:**
- Body-Image-Dimension: **1448×1086**
- Body-Center Back-View: **x=1054** (NICHT 1039)
- Front-View Y-Bereiche: Brust y=190-300, Abs y=312-502, Quads y=410-740, Front-Calves y=750-960
- Back-View Y-Bereiche: Schultern y=180-290, Lats/Back y=290-540, Glutes y=540-720, Hamstrings y=720-870, Calves y=741-870
- Alpha aller Masken: **150**
- Volume-Color-Zonen aus [src/lib/muscle-groups.ts](src/lib/muscle-groups.ts): 0 = grau, 1-5 = grün, 6-10 = gelb, 11+ = rot

**Was NICHT funktioniert hat (Anti-Patterns):**
- ConvexHull aus Roh-Labels für Wadenregion → die Hull saugt Knöchel-/Achilles-Outlines mit ein und erzeugt rechteckige Artefakte unter der eigentlichen Wade
- Raten welche Labels was sind nur basierend auf Y-Range → siehe Bug vom 2026-05-17 wo Forearm-Labels (x=200) als External Obliques klassifiziert wurden, weil ihre Y-Range zu Torso-Obliques passte
- Komponenten "anatomisch" (per Augenschein) zuordnen statt per x-Position-Check gegen die Body-Silhouette

---

## 2026-05-17 — Wadenmaske Back-View

### Problem
In der Bodygraph-Back-View wurde die Wade nur halb/seitlich eingefärbt, und darunter erschien ein anatomisch unmöglicher rechteckiger Block.

### Ursache
1. **Rechtecke unter den Waden**: zwei disconnected Blobs bei y=872-905 (je ~1255 px), erzeugt durch eine frühere ConvexHull-Konstruktion aus L2133+L2144 / L2137+L2146, deren Hull Knöchel-/Achilles-Outlines mit eingesaugt hatte.
2. **Wade nur seitlich**: nur die lateralen Gastrocnemius-Köpfe (L121+L122, je ~3180 px, x-Range ~38px) waren in der Maske. Die medialen Köpfe fehlten komplett → Wade saß nur an der Außenseite jedes Beins.

### Lösung
Back-View-Region in `legs.png` (x>720, y=740-910) komplett gecleared und neu aus allen 4 Gastrocnemius-Komponenten aufgebaut: **L121+L122 (lateral) + L123+L124 (medial)**, dann `binary_dilation(iterations=2)` zum Schließen der Outline-Gaps zwischen den beiden Köpfen pro Bein. Alpha=150 wie alle anderen Masken.

### Betroffene Dateien
- [public/bodygraph-masks/legs.png](public/bodygraph-masks/legs.png)

### Wichtig für zukünftige Änderungen
- **Front-View-Pixel von legs.png nicht anfassen** — die Quads + Front-Calves sind getrennt vom Back-View-Calf-Bereich und funktionieren.
- `legs.png` enthält **mehrere logische Muskelgruppen** (Quads, Hamstrings, Calves) weil `toBodyPart()` `quads`, `hamstrings`, `calves` alle auf `legs` mappt. Niemals versuchen, die zu trennen — die App kennt keine Sub-Body-Parts.
- Back-View-Calves dürfen **nicht über y=870** hinausgehen, sonst entstehen erneut Artefakte im Knöchel-/Achilles-Bereich.
- Die Gastrocnemius hat anatomisch korrekt **zwei Köpfe pro Bein** — beide müssen mit drin sein, sonst sieht's wieder "nur seitlich" aus.

---

## 2026-05-17 — Core-Maske Front-View

### Problem
In der Front-View wurde nur ein Teil der Bauchmuskulatur eingefärbt — nur 4 von anatomisch 8 Sixpack-Segmenten, keine Obliques. Wirkte unvollständig.

### Ursache
Die alte `core.png` enthielt nur 4 Komponenten der mittleren/unteren Rectus-Reihe. Die oberste Reihe (L47/L48), die Mittel-Untere (L76/L77) und alle Obliques (L46/L49/L72/L73) fehlten.

### Lösung
Source-Body-Image per `scipy.ndimage.label` auf den Body-Fill-Pixeln analysiert. Im Front-View-Torso identifiziert:
- **Rectus Abdominis (8 Segmente)**: L47, L48 (oben), L58, L59 (mittel-oben), L76, L77 (mittel-unten), L81, L82 (unten)
- **Innere/laterale Obliques (4 Segmente)**: L46, L49 (oben), L72, L73 (unten)
- `binary_dilation(iterations=2)` zum Schließen der schmalen Lücken zwischen Sixpack-Reihen
- Overlap-Check gegen chest/shoulders → kein Overlap

### Betroffene Dateien
- [public/bodygraph-masks/core.png](public/bodygraph-masks/core.png)

### Wichtig für zukünftige Änderungen
- Core x-Range muss **innerhalb 314-493** bleiben (Torso-Bereich bei y=312-502). Alles außerhalb davon wäre auf den Armen.
- Serratus Anterior (L36/L42 im Bereich y=295-369 lateral zur oberen Brust) ist **nicht** Core — Brustkorb-/Skapula-Muskel. Falls User später Serratus-Mapping wünscht: kann ergänzt werden, aber konventionell separat.
- Y-Range Core: **y=312-502**. Darüber überlappt's mit `chest.png` (Brust endet y=309), darunter mit Hüfte/Glutes.

---

## 2026-05-17 — Workout-Detail Set-Counts + Unterarm-Bug bei Core

### Problem
1. Workout-Detail-Bodygraph zeigte bei Core nur **1 statt der echten 6 Sätze** Crunches.
2. Wenn Core aktiviert war, wurden zusätzlich **die Unterarme grün eingefärbt** — Unterarme gehören nicht zu Core.

### Ursache
1. **Set-Count = 1**: [workouts/[workoutId]/page.tsx](src/app/(app)/workouts/[workoutId]/page.tsx) hat `<WorkoutMuscleMap muscleGroups={...} />` **ohne** `muscleGroupSets`-Prop aufgerufen. Die Component-Logik in [WorkoutMuscleMap.tsx:80-85](src/components/workout/WorkoutMuscleMap.tsx#L80-L85) hat dann den Fallback `(fallbackActive.has(part) ? 1 : 0)` getriggert → jede aktive Gruppe bekam exakt 1. Analytics-Page passte dagegen echte Set-Counts via `muscleGroupSets` rein und funktionierte deshalb korrekt.
2. **Unterarme bei Core**: beim Core-Mask-Rebuild waren L63, L64, L70, L71 fälschlich als "External Obliques" klassifiziert worden — Pixel-Analyse bei y=400 zeigte aber: Körper-Aufteilung in Front-View ist `Linker Arm x=202-271 | Torso x=314-492 | Rechter Arm x=535-605`. Alle vier Komponenten lagen in den Arm-Bereichen (x=200-237 bzw. x=569-605) → das waren Brachioradialis/Unterarm-Muskeln, keine Obliques.

### Lösung
1. **Set-Counts**: Aggregation eingebaut, die Sätze per BodyPart zählt (mirrors [convex/analytics.ts:264](convex/analytics.ts#L264) Logik). Pro Exercise: `counts[toBodyPart(ex.exercise.muscleGroup)] += ex.sets.length`. Ergebnis als `muscleGroupSets`-Prop an `WorkoutMuscleMap`.
2. **Core ohne Unterarme**: `core.png` neu aus 8 Rectus + 4 Obliques (L46/L49/L72/L73, alle x=314-493 garantiert im Torso). L63/L64/L70/L71 explizit weggelassen.

### Betroffene Dateien
- [src/app/(app)/workouts/[workoutId]/page.tsx](src/app/(app)/workouts/[workoutId]/page.tsx) — `muscleGroups` Array durch `muscleGroupSets` Record-Aggregation ersetzt
- [public/bodygraph-masks/core.png](public/bodygraph-masks/core.png)

### Wichtig für zukünftige Änderungen
- Jede neue Seite, die `WorkoutMuscleMap` einbindet und Sätze hat, **muss `muscleGroupSets` berechnen und übergeben** — nicht nur `muscleGroups`. Sonst tritt der "1-statt-N"-Bug wieder auf. Pattern aus [analytics/page.tsx:67-72](src/app/(app)/analytics/page.tsx#L67-L72) übernehmen.
- Die Fallback-Logik in [WorkoutMuscleMap.tsx](src/components/workout/WorkoutMuscleMap.tsx) ("1 wenn aktiv") **ist gewollt** für Aufrufer, die nur die Hervorhebung wollen aber keine Sätze haben (z.B. [WorkoutMuscleAvatar.tsx](src/components/workout/WorkoutMuscleAvatar.tsx)). Nicht entfernen — stattdessen darauf achten, dass Stellen mit echten Sätzen `muscleGroupSets` setzen.
- Forearms haben **keinen eigenen Body-Part** (siehe `BODY_PARTS` in [muscle-groups.ts](src/lib/muscle-groups.ts)) — sie mappen auf `other` über den Fallback in `toBodyPart()`. Falls Forearms später einen eigenen BodyPart bekommen sollen: parallel zur Glutes-Einführung vorgehen (BODY_PARTS erweitern, BODY_PART_COLORS, BODY_LABELS, BODY_PART_MASKS, `toBodyPart()`-Mapping, neue `forearms.png` aus L63/L64/L70/L71, und Convex-Backend in [convex/analytics.ts](convex/analytics.ts) analog erweitern + redeployen).
- Core-Maske darf **niemals Pixel außerhalb x=314-493 Torso-Range** enthalten — sonst Arm-Bleed.

---

## 2026-05-22 — Bein-Sub-Zonen (Quads / Hamstrings / Calves) eingeführt

### Problem
`toBodyPart()` kollabierte `quads | hamstrings | calves` → `legs`. Eine Isolation wie Beinstrecker (Leg Extension) färbte deshalb das ganze Bein inkl. Waden, statt nur den Quadrizeps.

### Lösung
Quads/Hamstrings/Calves als eigene BodyParts eingeführt (parallel zur Glutes-Vorlage, wie im Forearms-Hinweis am Eintrag 2026-05-17 dokumentiert).

- [src/lib/muscle-groups.ts](src/lib/muscle-groups.ts): `BODY_PARTS` um `quads | hamstrings | calves` erweitert; `BODY_PART_COLORS` analog (Bein-Family-Töne); `toBodyPart()` lässt die drei jetzt durch statt → legs
- [src/components/workout/WorkoutMuscleMap.tsx](src/components/workout/WorkoutMuscleMap.tsx): `BODY_LABELS` + `BODY_PART_MASKS` erweitert (Labels: Quads / Beinbeuger / Waden)
- [src/components/workout/WorkoutMuscleAvatar.tsx](src/components/workout/WorkoutMuscleAvatar.tsx): `BODY_LABELS` erweitert + `LEG_SUBPARTS`-Set, das im Mini-Avatar quads/hamstrings/calves zusätzlich auf "legs" mappt (das Avatar-SVG hat keine eigenen Sub-Pfade, soll aber weiter aufleuchten wenn ein Bein-Teil getroffen wurde)
- [convex/analytics.ts](convex/analytics.ts): eigene `BODY_PARTS`-Liste + `toBodyPart()` analog synchronisiert (Backend hatte eigene Kopie der Konstanten)
- [convex/seed.ts](convex/seed.ts) + [src/lib/default-exercises.ts](src/lib/default-exercises.ts): nur **eindeutige Isolationen** umgetaggt — Leg Extension → quads, Leg Curl + Nordic Curl → hamstrings, alle Calf Raises → calves, Hip Thrust + Glute Bridge + Cable Kickback → glutes. **Compounds bleiben "legs"** (Squat, Lunge, Leg Press, Bulgarian Split Squat, Front/Hack Squat, Stiff Leg Deadlift, Good Morning) — sie treffen anatomisch mehrere Muskelgruppen, würden bei Sub-Tagging falsch wirken.
- `category` bleibt überall `"legs"` — die Trainings-Kategorie ist unverändert, nur die Bodygraph-Zone wird feiner.

### Masken-Build (Sub-Masken aus bestehender legs.png)
[scripts/bodygraph_analyze_legs.py](scripts/bodygraph_analyze_legs.py) + [scripts/bodygraph_build_leg_masks.py](scripts/bodygraph_build_leg_masks.py):

- Bestehende `legs.png` (alpha=150, 22 Komponenten) per Pixel-Klassifikation aufgeteilt nach **Y-Cut bei y=740** (saubere Lücke zwischen Oberschenkel-Komponenten Ende y=728/739 und Calf-Komponenten Start y=741/748) und **X-Cut bei x=720** (Front/Back).
- Resultat: `quads.png` (34644 px, Front+Oben), `hamstrings.png` (23595 px, Back+Oben), `calves.png` (31785 px, beide Seiten unten). Summe = 90024 px = original-legs-Pixel (verlustfrei aufgeteilt).
- Alle drei mit alpha=150 und Roter Farbe (239,68,68) wie alle anderen Masken.

### legs.png bleibt unverändert
Compound-Übungen wie Squat haben weiter `muscleGroup: "legs"` → `legs.png` deckt weiter das gesamte Bein. Wenn ein Workout sowohl Squat als auch Beinstrecker enthält, werden `legs.png` + `quads.png` überlagert (Squat färbt alles, Beinstrecker zusätzlich nur den Quad-Bereich nochmal stärker) — das ist gewünschtes Verhalten.

### Wichtig für zukünftige Änderungen
- **Y-Cut 740 ist der sauberste Trenner** — wenn die `legs.png` jemals neu gebaut wird, diese Lücke beibehalten.
- **Compounds bewusst nicht auf Sub-Muskelgruppe taggen** — User-Entscheidung: nur Isolationen kriegen die Sub-Zone. Wenn neue Übungen dazukommen, im selben Stil entscheiden (Maschine/Isolation → sub, Compound mit Stab → legs).
- **Backend und Frontend müssen synchron bleiben**: [convex/analytics.ts](convex/analytics.ts) hat eine **eigene Kopie** von `BODY_PARTS` + `toBodyPart` — beim nächsten Erweitern beide Stellen anpassen.
- Die Hüft-Übergangs-Komponenten (L5/L6 y=545-608) sind weiter in der `hamstrings.png` enthalten — Erbschaft aus legs.png. Falls das später als störend auffällt: Pixel mit y<565 raus.
- **Avatar-SVG (`WorkoutMuscleAvatar`) hat keine Sub-Bein-Pfade** — das `LEG_SUBPARTS`-Mapping muss bleiben, sonst leuchten Sub-Bein-Übungen im Avatar nicht. Falls jemand ein detaillierteres Avatar will: SVG-Pfade für Quad/Hamstring/Calf-Regionen ergänzen und Mapping rückbauen.

### Betroffene Dateien
- `src/lib/muscle-groups.ts`
- `src/components/workout/WorkoutMuscleMap.tsx`
- `src/components/workout/WorkoutMuscleAvatar.tsx`
- `convex/analytics.ts`
- `convex/seed.ts`
- `src/lib/default-exercises.ts`
- `public/bodygraph-masks/quads.png` (neu)
- `public/bodygraph-masks/hamstrings.png` (neu)
- `public/bodygraph-masks/calves.png` (neu)
- `scripts/bodygraph_analyze_legs.py` (neu, reproduzierbares Analyse-Tool)
- `scripts/bodygraph_build_leg_masks.py` (neu, reproduzierbarer Masken-Builder)

---

## Verwandte Dokumente

- [docs/bodygraph-session-notes.md](docs/bodygraph-session-notes.md) — Frühere Session-Notes, beschreibt die ursprüngliche Mask-Komposition (Stand 2026-05-15). **Achtung**: dort dokumentierte ConvexHull-Lösung für Back-Calves ist seit 2026-05-17 überholt — siehe Eintrag oben.
- [CLAUDE.md](CLAUDE.md) — Project-Instructions (Convex-Guidelines).
