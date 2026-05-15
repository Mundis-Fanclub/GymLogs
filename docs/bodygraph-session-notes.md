# Bodygraph & Muscle Group Session Notes

Stand: 2026-05-15 (Session-Ende)
Branch: `feature/visuals-analysis-workout-tracking`

## Was wurde gemacht

### 1. Bodygraph-Masken überarbeitet
Die Masken in `public/bodygraph-masks/` wurden aus den Connected Components des
Körperbilds (`public/bodygraph-muscle-map-transparent.png`) neu aufgebaut,
sodass sie der echten Muskel-Anatomie folgen statt generischer Ovale.

**Methodik:** Connected-Components-Erkennung via `scipy.ndimage.label` auf den
"pure body fill" Pixeln (R>=215, G>=215, B>=220), dann Auswahl der Labels
pro Muskelgruppe + Dilation (iterations=2-3) zum Schließen von Outline-Gaps.

**Aktuelle Masken-Komposition:**

| Maske | Connected Components / Strategie |
|-------|----------------------------------|
| chest | original (unverändert) |
| back | Original + Glute-Mirror (y:430-580, Zentrum x=1053) + Upper-Shoulder-Mirror (y:180-290) + Lats (L440, L441, L779, L786, L841, L843); minus Arm-Zonen, Shoulders, Triceps, Glutes |
| biceps | original (unverändert) |
| triceps | L420, L421 (Hauptmuskel, dilated iterations=3) + Filter: xmax<970 oder xmin>1100 |
| core | original (unverändert) |
| legs | front: L1059, L1060, L1019, L1018, L1574, L1566, L1911, L1912, L1909, L1910, L2118, L2120<br>back: L1444-L1447 (Hamstrings), L1886, L1888 (untere Außen-Oberschenkel), L1380, L1388 (Glute-Divider), L1333, L1334 (Glute-Außen-Edges), L1814, L1819 (kleine Reste)<br>back-calves: ConvexHull aus L2133+L2144 (links) / L2137+L2146 (rechts) **gecappt bei y=905** |
| glutes | **NEU** - L935, L936 (runde Pobacken-Körper) |
| shoulders | original (unverändert) |
| other | original (unverändert) |

**Alpha-Wert:** Alle Masken auf `alpha=150` normiert (RGB=239,68,68 - irrelevant da
CSS mask-image nur Alpha nutzt). Vorher hatten neue Masken alpha=255, original alpha=150 -
führte zu unterschiedlichen Rendering-Helligkeiten der gleichen Volumen-Zone.

### 2. Neue Muskelgruppe "Glutes" eingeführt
Glutes als eigener BodyPart hinzugefügt (vorher unter "legs" subsumiert).

**Files geändert:**
- `src/lib/muscle-groups.ts`: `BODY_PARTS` erweitert um `glutes`, `BODY_PART_COLORS["glutes"] = "#f59e0b"`, `toBodyPart()` mapped `glutes` jetzt direkt auf `glutes` (nicht mehr legs)
- `src/components/workout/WorkoutMuscleMap.tsx`: `BODY_LABELS["glutes"] = "Glutes"`, `BODY_PART_MASKS["glutes"] = "/bodygraph-masks/glutes.png"`
- `src/components/workout/WorkoutMuscleAvatar.tsx`: Label ergänzt
- `src/app/(app)/analytics/page.tsx`: Label in MuscleInsight ergänzt
- `convex/analytics.ts`: `BODY_PARTS` und `toBodyPart()` analog erweitert (Backend deployed)
- `public/bodygraph-masks/glutes.png`: Neue Maske erstellt

### 3. Farbsystem auf Volumen-basiert umgestellt
Statt muskelgruppen-spezifische Festfarben (`BODY_PART_COLORS`) nutzen
WorkoutMuscleMap und Analytics jetzt `getWeeklySetVolumeColor(setCount)`:

| Zone | Sätze | Farbe |
|------|-------|-------|
| none | 0 | `#cbd5e1` (gray) |
| low | 1-5 | `#4ade80` (green-400) |
| moderate | 6-10 | `#fde047` (yellow-300) |
| high | 11+ | `#f87171` (red-400) |

`getMaskOpacity()` wurde aus `WorkoutMuscleMap.tsx` **entfernt** - vorher
variierte Opacity je nach Set-Count innerhalb der gleichen Zone, was zu
unterschiedlichen Grün-Tönen führte.

### 4. Overlap-Cleanup
Wichtigste Sub-Operationen damit Farben sich nicht mischen:
- Trizeps: Back-Mask-Pixel aus den Arm-Zonen entfernt (`x:850-970, x:1110-1230, y:280-450`)
- Back-Maske gespiegelt: linke asymmetrische Glute-Extension auf rechts gespiegelt (Zentrum x=1053, y:430-580)
- Rear-Deltoid Overlap: Shoulders bleibt original, Back-Pixel im Deltoid-Bereich (y<280 wo overlap mit shoulders) entfernt
- Glutes vs Legs: L1444-L1447 sind anatomisch Hamstrings (gehen bis y:743), wurden zu legs verschoben; L1333/L1334 (Außen-Edges) sehen wie Außen-Oberschenkel aus, ebenfalls in legs

### 5. "Sonstiges" (other) aus UI gefiltert
- `WorkoutMuscleMap.tsx`: figcaption `BODY_PARTS.filter((part) => part !== "other")`
- `VolumeBarChart.tsx`: gleicher Filter
- MuscleInsight in Analytics: war bereits gefiltert
- Type/Backend bleibt erhalten als Fallback für unbekannte muscleGroups

## Offener Punkt für morgen

Wadenbereich Back-View ist noch nicht final - die Convex-Hull-Lösung
(L2133+L2144 / L2137+L2146 gecappt bei y=905) füllt die obere Gastrocnemius,
aber der genaue Bereich an der Innenseite war zuletzt noch ein Diskussionspunkt.
User sagte zuletzt "ja fast" - eventuell noch leichte Adjustierung nötig.

## Skripte/Methodik

Alle Masken-Änderungen wurden via Python (PIL + numpy + scipy) gemacht.
Body-Image-Dimension: 1448x1086.

Wichtige Konstanten:
- Body Center Back-View: **x=1054** (true silhouette center, NICHT 1039)
- Glute-Y-Bereich: y=540-720
- Hamstring-Y-Bereich: y=720-870
- Calf-Y-Bereich: y=870-980

## Deploy-Hinweis

Convex Backend wurde mit `npx convex dev --once` deployed - `glutes` als
BodyPart ist in Production aktiv. Falls weitere Backend-Änderungen kommen,
gleicher Befehl ausführen.
