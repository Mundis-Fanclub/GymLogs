<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Product data rule

Niemals Fake-, Demo-, Placeholder- oder "Geister"-Inhalte in produktiven App-Screens anzeigen oder neu einbauen, außer der Nutzer fordert das ausdrücklich. Wenn echte Daten fehlen, stattdessen einen Empty State, Skeleton oder eine neutrale leere Fläche anzeigen. Beispiele: keine erfundenen Posts, Storys, Kommentare, Aktivitäten, Nutzer, Likes, Bilder oder Social-Events.
