# GymLogs Product Research: "Warcraft Logs for Gym"

## Ausgangslage

Das bestehende Projekt ist bereits eine solide Workout-Tracking-App:

- Workout-Erstellung und laufende Sessions
- Exercises und Sets mit Gewicht/Reps/RIR
- Persoenliche PR-Erkennung
- Dashboard mit Recent Workouts, Recent PRs und Analytics

Die aktuelle Codebasis bildet damit das "Strong/Hevy"-Fundament bereits ab. Das neue Alleinstellungsmerkmal ist ein globales, verifizierbares Log-System mit Rankings und Percentiles pro Uebung.

## Was Warcraft Logs stark macht

Warcraft Logs ist nicht nur ein Upload-Tool, sondern ein Status-, Analyse- und Vergleichssystem fuer eine leistungsorientierte Community.

### Kernmechaniken

- Objektive Performance-Daten statt Bauchgefuehl
- Percentile und Farb-Buckets, die Leistung sofort einordnen
- Detailanalyse pro Encounter, Cast, Fehler und Positionierung
- Vergleich mit anderen Spielern, Gruppen und Top-Performern
- Replay/Beweischarakter durch nachvollziehbare Rohdaten
- Oeffentliche Rankings als sozialer Wettbewerb
- Private/unlisted/public Sichtbarkeit fuer Kontrolle

### Warum es so erfolgreich ist

- Es gibt eine gemeinsame Wahrheit: "Wie gut war dieser Pull wirklich?"
- Es verbindet Self-Improvement mit Status und Competition.
- Die Auswertung ist tief, aber die erste Belohnung ist sofort simpel: Farbe, Zahl, Rang.
- Es wird sozial nutzbar: Leute vergleichen Gilden, Klassen, einzelne Spieler.
- Es erzeugt Content von selbst: jeder gute Parse ist ein teilbarer Erfolg.
- Es ist in den bestehenden Spiel-Loop eingebettet statt losgeloest davon.

## Uebertragung auf GymLogs

Die Analogie funktioniert erstaunlich gut:

- Raid Log -> Workout / Lift Attempt
- Boss Parse -> Lift Performance Score
- Replay -> Video-Beweis
- Spec/Class Brackets -> Geschlecht, Gewichtsklasse, Altersklasse, Trainingslevel
- Top Logs -> globale Leaderboards
- Guild Identity -> Friends, Gym, Team, Coach, Creator group

Der psychologische Kern bleibt derselbe:

1. Ich tracke mein Training.
2. Ich sehe sofort, ob ich besser war als letztes Mal.
3. Ich sehe, wo ich im Vergleich zu allen anderen stehe.
4. Ich kann einen validierten "crazy lift" posten, der echten Status hat.

## Der beste Produktansatz fuer GymLogs

Nicht jede geloggte Trainingsserie sollte sofort global ranking-relevant sein. Besser ist ein zweistufiges System:

### 1. Training Layer

Der bestehende App-Kern:

- Trainingsplan anlegen
- Workout starten
- Sets, Gewicht, Reps, RIR loggen
- Last workout / PR Hinweise
- Progress Charts

### 2. Verified Log Layer

Nur bestimmte Sets oder Attempts werden als "Log Submission" eingereicht:

- User markiert ein Set als log-wuerdig
- Video wird aufgenommen oder hochgeladen
- AI prueft Uebung, ROM/Basics und sichtbares Gewicht
- Submission wird validiert, flagged oder rejected
- Nur validierte Submissions gehen in globale Rankings ein

Das ist wichtig, damit das Produkt nicht in Spam, Tippfehlern und Fake-Gewichten untergeht.

## Empfohlene Ranking-Modelle

Nicht nur "max weight", sondern mehrere Log-Typen:

### Strength Log

- Hoechstes verifiziertes Gewicht fuer 1 Rep
- Ideal fuer Bench, Squat und Deadlift

### Rep PR Log

- Bestes Gewicht x Reps in definierten Rep-Ranges
- Beispiel: Bench 140 x 8

### Estimated 1RM Log

- Normalisiert unterschiedliche Rep-Sets
- Gut fuer breitere Vergleichbarkeit

### Volume/Performance Log

- Fuer Bodybuilding-Uebungen, bei denen 1RM weniger sinnvoll ist
- Beispiel: weighted pull-up, dumbbell incline, leg press

### Consistency Log

- Nicht nur Peak-Lifts, sondern z. B. "Top 5 verifizierte Bench-Sessions in 90 Tagen"
- Hilft gegen One-hit-wonder-Effekt

## Brackets: entscheidend fuer Fairness

Warcraft Logs lebt von Vergleich in sinnvollen Buckets. Fuer GymLogs ist das noch wichtiger.

Empfohlene Brackets:

- Geschlecht
- Koerpergewichtsklasse
- Altersklasse
- Trainingslevel
- Natural / unverified / optional enhanced disclosure nur wenn rechtlich und kulturell sauber
- Equipment: raw, belt, wraps, sleeves, straps
- Exercise variant: paused bench, touch-and-go, high-bar squat, sumo deadlift etc.

Ohne diese Brackets werden Logs schnell unfair oder laecherlich.

## Was AI wirklich pruefen sollte

Die AI sollte anfangs nicht "perfektes Powerlifting-Judging" versprechen. Lieber ein abgestuftes Confidence-System.

### MVP-Pruefungen

- Ist ueberhaupt eine Person + Langhantel/Kurzhantel/Geraet im Bild?
- Welche Uebung ist es wahrscheinlich?
- Ist das Gewicht sichtbar oder aus Plates plausibel ableitbar?
- Ist genau ein Attempt relevant?
- Gibt es harte Manipulationssignale?

### Spaeter

- Rep Count
- Start- und Endposition
- Unvollstaendige ROM Erkennung
- Spotter interference
- Rack bounce / touch-and-go / hitching / lockout confidence

Wichtig:

- "Verified" und "Judge Score" trennen
- Low-confidence Submissions in Review Queue schicken
- Community reporting und manuelle Moderation mitdenken

## Warum das als App fuer Gym Bros funktionieren kann

Das Konzept trifft mehrere starke Motive gleichzeitig:

- Ego und Status
- Gamification
- Community-Vergleich
- Social Proof
- Trainingstagebuch mit echtem Reward Loop

Normale Gym-Apps loesen vor allem Dokumentation. GymLogs kann zusaetzlich Identitaet und Competition loesen.

Die starke Formel ist:

- Strong fuer tracking
- Strava fuer social loops
- Warcraft Logs fuer ranking/status
- BeReal/TikTok-artige video-native proof culture

## Risiken

### 1. Fake Logs

Ohne Verifikation ist das System sofort kaputt.

### 2. Unfaire Vergleiche

Ohne Brackets fuehlt sich das Ranking sinnlos an.

### 3. Zu viel Komplexitaet zu frueh

Wenn der Upload-/Judge-Flow schwerfaellig ist, nutzen Leute nur den Tracker.

### 4. Nur Peak-Strength, zu wenig Mainstream

Wenn alles nur auf 1RM ausgerichtet ist, verliert ihr Hypertrophy-User.

## Sinnvolle Produktstrategie

### Phase 1

- Workout tracking polish
- Exercise history
- last time / PR UX
- stable analytics

### Phase 2

- Verified top set submissions
- Video upload
- Basic AI classification
- Exercise leaderboards
- Percentile score 0-100

### Phase 3

- Brackets
- Friends / gym / city leaderboards
- Profile badges
- Log share cards
- moderation tools

### Phase 4

- richer judging
- movement replay overlays
- coach/creator pages
- programs tied to verified outcomes

## Konkrete Produktentscheidung fuer den MVP

Der beste erste Wedge ist nicht "jede Uebung in jedem Stil", sondern:

- Start mit 3 ikonischen Uebungen
- Bench Press
- Squat
- Deadlift

Nur fuer diese Uebungen:

- video-backed verified logs
- klare Varianten
- klare Regeln
- percentiles
- weekly / all-time / friends leaderboard

So wird das System kontrollierbar und glaubwuerdig.

## Mapping auf die aktuelle Codebasis

Bereits vorhanden:

- workouts
- sets
- exercises
- PR logic
- analytics
- auth/user layer

Neu noetig:

- `log_submissions`
- `submission_videos`
- `exercise_variants`
- `leaderboard_snapshots` oder on-demand ranking queries
- `consent_to_rankings`
- `verification_status`
- `moderation_flags`
- bracket metadata am User und/oder an der Submission

## Eine gute North-Star-Metrik

Nicht nur DAU oder Workouts.

Besser:

- Weekly verified logs per active user
- Anteil der User, die nach normalem Tracking mindestens 1 Log einreichen
- Anteil der verified logs, die geteilt oder verglichen werden

## Kurzfazit

Die Idee ist stark, weil sie aus einem utilitaristischen Tracker ein kompetitives Identitaetsprodukt machen kann.

Der Hauptfehler waere, zu frueh alles gleichzeitig bauen zu wollen. Wenn ihr zuerst einen sehr guten Workout-Tracker plus ein extrem fokussiertes Verified-Log-System fuer wenige Kernuebungen baut, habt ihr eine realistische Chance auf ein echtes Alleinstellungsmerkmal.
