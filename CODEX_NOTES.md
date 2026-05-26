# CODEX_NOTES.md

Projektgedächtnis für funktionierende Fixes und wichtige technische Entscheidungen.

Nach jedem erfolgreichen Fix soll ein neuer Eintrag im folgenden Format ergänzt werden:

```text
[Datum] Thema / Bugfix
Problem
Kurz beschreiben, was nicht funktioniert hat.

Ursache
Kurz erklären, woran es lag.

Lösung
Beschreiben, welche Änderung gemacht wurde.

Betroffene Dateien
Datei 1
Datei 2

Wichtig für zukünftige Änderungen
Was muss beibehalten werden?
Welche Logik darf nicht versehentlich überschrieben werden?
Welche IDs, Mappings oder Komponenten sind relevant?
```

[2026-05-18] Social/Post-System und Performance-Refactor
Problem
Die Navigation und Fast Refresh waren spürbar langsam. Das Social-Post-System brauchte außerdem Thread-Ansicht, Reposts, Teilen-Dialog, GIFs, Medien-Entfernen vor dem Posten sowie Text über und unter Medien.

Ursache
`profile/page.tsx` und `social/page.tsx` enthielten zu viel Client-Logik direkt in den Routen. Dialoge und sekundäre UI-Bereiche waren nicht sauber ausgelagert. Das Post-Modell konnte Medien, Reposts und Kommentar-Medien noch nicht vollständig abbilden.

Lösung
Die Routen wurden zu schlanken Wrappern um lazy geladene Islands umgebaut. Die eigentliche UI liegt jetzt in Komponenten unter `src/components/profile` und `src/components/social`. Das Convex-Schema und die Social-Queries/Mutations wurden um Reposts, `bodyAfter`, GIF-/Medienfelder und `mediaScale` erweitert. Reposts eigener Beiträge und doppelte Reposts werden serverseitig verhindert.

Betroffene Dateien
package.json
convex/schema.ts
convex/social.ts
src/app/(app)/profile/page.tsx
src/app/(app)/social/page.tsx
src/app/(app)/profile/[userId]/page.tsx
src/components/profile/ProfilePageClient.tsx
src/components/profile/ProfilePageIsland.tsx
src/components/social/SocialPageClient.tsx
src/components/social/SocialPageIsland.tsx

Wichtig für zukünftige Änderungen
`npm run dev` nutzt bewusst `next dev --turbo`.
Die Routen `profile/page.tsx` und `social/page.tsx` sollen schlank bleiben.
Die Client-Logik nicht zurück in die Route-Dateien verschieben.
Repost-Schutz muss serverseitig in `convex/social.ts` erhalten bleiben.
`body` ist Text über Medien, `bodyAfter` ist Text unter Medien.
`mediaScale` wird serverseitig auf einen sicheren Bereich begrenzt und darf nicht ungeprüft gespeichert werden.

[2026-05-18] Mediengröße im Post-Fenster per Drag ändern
Problem
Das Kleinerziehen von Bildern im Post-Fenster fühlte sich gesperrt an oder funktionierte nicht zuverlässig.

Ursache
Der Resize-Drag hing nur an sehr kleinen Handle-Elementen und wurde über Pointer-Events auf diesen Handles verfolgt. Sobald der Zeiger beim Ziehen aus dem kleinen Griff herauslief, kam keine zuverlässige Größenänderung mehr an.

Lösung
Der Resize startet weiterhin über die Griffe, wird danach aber global über `window.pointermove` verfolgt und bei `pointerup` oder `pointercancel` beendet. Während des Drags wird Textauswahl deaktiviert. Die sichtbaren Griffe haben größere Hit-Areas bekommen, während das Seitenverhältnis über reine Breiten-Skalierung erhalten bleibt.

Betroffene Dateien
src/components/social/SocialPageClient.tsx

Wichtig für zukünftige Änderungen
Die Resize-Logik in `MediaPreview` soll globales Pointer-Tracking behalten.
Nicht wieder auf `onPointerMove` nur am Handle zurückbauen.
Die Medienform bleibt erhalten, weil nur die Breite in Prozent angepasst wird.

[2026-05-26] Smoke-Test-Checkliste fuer Profile Improvement
Ziel
Diese Checkliste ist die Abnahmebasis fuer den Branch `feature/profile-improvement`.
Das Profile Feature gilt erst als abgeschlossen, wenn alle Pflichtpunkte geprueft sind und keine offenen Blocker mehr bestehen. Erst danach soll der Branch nach `main` gepusht bzw. gemergt werden.

Testumgebung
- [ ] Branch ist `feature/profile-improvement`.
- [ ] Lokaler Next-Server laeuft auf `http://localhost:3000`.
- [ ] Convex Dev laeuft und meldet `Convex functions ready`.
- [ ] Test mit mindestens zwei eingeloggten Nutzern durchgefuehrt, damit Public Profile, Freunde, Messages und Sharing real geprueft werden koennen.
- [ ] Desktop-Viewport geprueft.
- [ ] Mobile-Viewport geprueft.
- [ ] Browser-Konsole bleibt bei allen Kernflows ohne neue Runtime-Errors.

Profil-Setup und Speichern
- [ ] `/profile` laedt fuer eingeloggte Nutzer ohne Fehler.
- [ ] Name, Username, Bio, Location, Trainingsziel, Favorite Lift, Groesse, Gewicht und Geburtsdatum koennen bearbeitet und gespeichert werden.
- [ ] Gespeicherte Daten bleiben nach Reload erhalten.
- [ ] Username wird normalisiert und bleibt eindeutig.
- [ ] Ungueltige oder doppelte Usernames zeigen eine verstaendliche Fehlermeldung.
- [ ] Profil-Akzentfarbe kann gewechselt werden und ist direkt im Cover sichtbar.
- [ ] Avatar-Upload funktioniert fuer gueltige Bilder.
- [ ] Cover-Upload funktioniert fuer gueltige Bilder.
- [ ] Upload-Fehler werden sichtbar angezeigt und blockieren die Seite nicht dauerhaft.

Privacy und Public Profile
- [ ] `isPublic`/Profil-Sichtbarkeit wirkt auf `/profile/[userId]`.
- [ ] `allowMessages` verhindert oder erlaubt Nachrichten von anderen Nutzern wie erwartet.
- [ ] `showTrainingSummary` blendet Trainingszusammenfassung fuer andere Nutzer korrekt ein bzw. aus.
- [ ] Public Fields fuer Groesse, Gewicht, Geburtsdatum und Trainingszusammenfassung werden respektiert.
- [ ] Eigenes Profil zeigt weiterhin die editierbaren privaten Daten.
- [ ] Fremdes Profil zeigt nur die freigegebenen Daten.
- [ ] Private oder eingeschraenkte Profile zeigen keine versehentlich privaten Felder.

Profil-Tabs und Inhalte
- [ ] Tabs/Sections im Profil wechseln stabil zwischen Uebersicht, Posts, Training, About und Edit/Settings.
- [ ] Profil-Posts des Nutzers werden geladen.
- [ ] Top Logs/Bestleistungen werden korrekt angezeigt.
- [ ] Workout Templates werden mit Sichtbarkeit `private`, `friends`, `public` korrekt dargestellt.
- [ ] Leere Zustaende sehen sauber aus und enthalten keine kaputten Platzhalterdaten.

Profil-Composer und Social Posts
- [ ] Beitrag direkt aus dem Profil kann nur mit Text oder Medium erstellt werden.
- [ ] Bild-/Video-/GIF-Upload fuer Profilpost funktioniert.
- [ ] Medienvorschau kann entfernt werden, bevor gepostet wird.
- [ ] Neuer Profilpost erscheint im Profil und im Social Feed.
- [ ] Like/Unlike funktioniert im Profil und im Social Feed konsistent.
- [ ] Kommentare und Antworten funktionieren auf Feed und Thread-Ansicht.
- [ ] Kommentar-Medien funktionieren.
- [ ] Reposts funktionieren fuer fremde Posts.
- [ ] Eigene Posts koennen nicht repostet werden.
- [ ] Doppelte Reposts werden verhindert.
- [ ] Loeschen/Editieren eigener Posts und Kommentare funktioniert.
- [ ] Fremde Posts oder Kommentare koennen nicht bearbeitet oder geloescht werden.

Freunde und Suche
- [ ] Nutzersuche findet oeffentliche Profile per Name/Username.
- [ ] Freund per Username hinzufuegen funktioniert.
- [ ] Sich selbst hinzufuegen wird verhindert.
- [ ] Bereits bestehende Freundschaft wird nicht doppelt angelegt.
- [ ] Freund entfernen funktioniert und aktualisiert die Liste.
- [ ] Freundesliste zeigt Avatar, Name, Username und Pro-Badge korrekt.
- [ ] Links aus Suche/Freundesliste fuehren zum richtigen Public Profile.

Nachrichten
- [ ] Nachrichtenbereich ist ueber `/profile#messages` erreichbar.
- [ ] Unterhaltung zwischen zwei Nutzern wird beim ersten Senden angelegt.
- [ ] Textnachrichten werden korrekt gesendet und empfangen.
- [ ] Bildnachrichten werden korrekt hochgeladen und angezeigt.
- [ ] Ungelesen-Zaehler erscheint im Profilmenue/Topbar.
- [ ] Unterhaltung wird beim Oeffnen als gelesen markiert.
- [ ] Read-State `Gelesen`/`Ungelesen` ist plausibel.
- [ ] Blockieren verhindert weitere Nachrichten im Thread.
- [ ] Entblocken erlaubt Nachrichten wieder.
- [ ] Nachricht melden funktioniert und erzeugt keine UI-Fehler.
- [ ] Nutzer melden funktioniert, sofern der Flow sichtbar ist.
- [ ] Share-to-Friend sendet einen Social Post als Message mit Post Preview.
- [ ] Geloeschte oder nicht mehr verfuegbare geteilte Posts zeigen einen stabilen Fallback.

Navigation und Settings
- [ ] Topbar zeigt Logo, Profilmenue und Avatar korrekt.
- [ ] Topbar wird auf Profilseiten wie vorgesehen ausgeblendet.
- [ ] Profilmenue oeffnet/schliesst per Klick, Escape und Outside Click.
- [ ] Profilmenue fuehrt zu Profil, Nachrichten, Einstellungen und Logout.
- [ ] BottomNav enthaelt Dashboard, Analytics und Social und markiert aktive Route korrekt.
- [ ] Sidebar enthaelt Dashboard, Analytics und Social und markiert aktive Route korrekt.
- [ ] Floating Action Button startet neuen Workout-Flow.
- [ ] `/settings` laedt ohne Fehler.
- [ ] Sprache DE/EN kann gewechselt werden und bleibt nach Reload erhalten.
- [ ] Dark/Light Mode kann gewechselt werden und bleibt nach Reload erhalten.

Workout-/Analytics-Regressionen durch Profile Branch
- [ ] Dashboard laedt und zeigt letzte Workouts/PRs ohne Fehler.
- [ ] Analytics laedt Charts mit korrekter Sprache und ohne Layoutbruch.
- [ ] Workouts-Liste laedt.
- [ ] Neues Workout kann gestartet werden.
- [ ] Aktives Workout: Sets hinzufuegen, Gewicht/Reps bearbeiten, Timer/Rest Preferences pruefen.
- [ ] Workout abschliessen und Detailseite oeffnen.
- [ ] Exercises-Seite laedt und Suche/Listen funktionieren.
- [ ] Bodygraph/Muscle Map rendert weiterhin.

Responsive/UI-Abnahme
- [ ] Profil-Cover, Avatar, Username und Bio ueberlappen auf Mobile nicht.
- [ ] Composer, Tabs und Karten bleiben auf Mobile bedienbar.
- [ ] Messages-Thread ist auf Mobile ohne horizontales Scrollen nutzbar.
- [ ] Feed-Karten, Medien und Buttons brechen nicht aus dem Viewport.
- [ ] Desktop-Layout wirkt nicht leer oder ueberdimensioniert.
- [ ] Light Mode und Dark Mode haben ausreichenden Kontrast.
- [ ] Lange Usernames, lange Bios und lange Nachrichten brechen sauber um.

Technische Checks
- [ ] `npm run lint` erfolgreich.
- [ ] `npm run build` erfolgreich.
- [ ] Convex Functions deployen/kompilieren ohne Fehler.
- [ ] Keine neuen TypeScript-Fehler.
- [ ] Keine neuen Next Runtime Errors in `.next-dev.err.log`.
- [ ] Keine Convex-Fehler in `.convex-dev.err.log`, ausser bekannte Update-Hinweise.
- [ ] Git-Status enthaelt nur bewusst gewollte Dateien.

Abschluss-Gate vor Merge nach main
- [ ] Alle Pflichtpunkte sind abgenommen.
- [ ] Gefundene Bugs sind entweder gefixt oder explizit als Non-Blocker dokumentiert.
- [ ] `CODEX_NOTES.md` enthaelt die finalen Fix-/Abnahme-Notizen.
- [ ] Branch ist aktuell gegen `main` bzw. Konflikte sind geloest.
- [ ] Letzter Smoke-Test wurde nach dem finalen Fix erneut ausgefuehrt.
- [ ] Profile Feature ist fachlich als abgeschlossen markiert.
- [ ] Erst danach: Branch nach `main` pushen/mergen.

Betroffene Kernbereiche
convex/schema.ts
convex/users.ts
convex/friends.ts
convex/messages.ts
convex/social.ts
convex/restPreferences.ts
src/app/(app)/profile/page.tsx
src/app/(app)/profile/[userId]/page.tsx
src/components/profile/ProfilePageClient.tsx
src/components/social/SocialPageClient.tsx
src/components/layout/TopBar.tsx
src/components/layout/Sidebar.tsx
src/components/layout/BottomNav.tsx
src/app/(app)/settings/page.tsx

Wichtig fuer zukuenftige Aenderungen
Die Abnahme muss mit mindestens zwei Nutzern passieren, weil viele Fehler nur bei fremden Profilen, Freunden, Nachrichten, Blocking und Sharing sichtbar werden.
Privacy-Schalter muessen immer aus Sicht eines fremden Nutzers gegengetestet werden.
Profile, Social Feed und Messages teilen Datenmodelle; Aenderungen an Posts, User Preview, Avatar URLs oder Username-Logik immer in allen drei Oberflaechen pruefen.
Der Merge nach `main` soll erst erfolgen, wenn diese Checkliste vollstaendig abgehakt oder begruendet angepasst wurde.

[2026-05-26] Profile Checklist Code-Gap: Messages und Netzwerk sichtbar machen
Problem
Einige Abnahmepunkte aus der Smoke-Test-Checkliste waren im eigenen Profil aus Code-Sicht nicht erreichbar: Der Nachrichtenbereich war mit `hidden` ausgeblendet, und Freunde/Suche/Datenschutzvorschau lagen in einem ebenfalls ausgeblendeten Aside.

Ursache
Die UI fuer Inbox und Netzwerk war zwar implementiert, aber nicht in die sichtbare Profilnavigation eingebunden. `/profile#messages` konnte dadurch keinen sichtbaren Nachrichtenbereich anzeigen.

Loesung
Die Profilnavigation wurde um die Tabs `Nachrichten` und `Netzwerk` erweitert. Hash-Routen wie `/profile#messages`, `/profile#network` und `/profile#friends` waehlen automatisch den passenden Tab. Der Nachrichtenbereich und die Netzwerk-Karten sind jetzt tabgesteuert sichtbar.

Betroffene Dateien
src/components/profile/ProfilePageClient.tsx
CODEX_NOTES.md

Wichtig fuer zukuenftige Aenderungen
Nachrichten und Netzwerk duerfen nicht wieder dauerhaft per `hidden` aus der Profiloberflaeche verschwinden.
Der Topbar-Link `/profile#messages` muss weiterhin den Nachrichten-Tab aktivieren.
Freunde, Nutzersuche und Datenschutzvorschau bleiben Teil des Profile-Smoke-Tests.

[2026-05-26] Profile Checklist Code-Gap: indexierte Nutzersuche
Problem
Der Checklistenpunkt `Nutzersuche findet oeffentliche Profile per Name/Username` war technisch fragil, weil `searchPublic` nur die ersten 100 User gelesen und danach im Code gefiltert hat. Bei mehr Daten haetten passende Profile zufaellig fehlen koennen.

Ursache
Es gab keinen dedizierten Suchindex fuer Profile. Die Suche hing von der Datenbank-Reihenfolge der ersten 100 User ab.

Loesung
`users` hat jetzt ein optionales `searchText`-Feld und den Convex Search Index `search_profile`. `getOrCreate` und `updateProfile` pflegen `searchText` anhand von Name, Username und E-Mail-Prefix. `searchPublic` nutzt den Search Index und filtert direkt auf `isPublic = true`.

Betroffene Dateien
convex/schema.ts
convex/users.ts
CODEX_NOTES.md

Wichtig fuer zukuenftige Aenderungen
Wenn Name oder Username an anderen Stellen geaendert werden, muss `searchText` mit aktualisiert werden.
Public Profile Search soll indexiert bleiben und nicht wieder auf unbounded oder zufaellige `take(100)`-Filter zurueckfallen.
