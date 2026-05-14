export type Locale = "de" | "en";

export const LOCALES: Locale[] = ["de", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
};

export const dictionaries = {
  en: {
    common: {
      appName: "GymLogs",
      navSubtitle: "Track. Rank. Verify.",
      dashboard: "Dashboard",
      logs: "Logs",
      workouts: "Workouts",
      exercises: "Exercises",
      analytics: "Analytics",
      newWorkout: "New Workout",
      proPrice: "Pro 4.99 EUR",
      openLanguageMenu: "Change language",
      openThemeMenu: "Toggle color theme",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      verified: "Verified",
      pendingReview: "Pending review",
      logScore: "Log score",
      viewLogs: "View logs concept",
      noData: "No data yet",
      kg: "kg",
      reps: "reps",
      sets: "sets",
      volume: "Volume",
      totalVolume: "Total volume",
      loading: "Loading",
      notFoundWorkout: "Workout not found.",
      notFoundExercise: "Exercise not found.",
      signIn: "Sign in",
      startWorkout: "Start workout",
    },
    topbar: {
      title: "Build the lift tracker people actually want to flex.",
      subtitle: "Keep ads out of active workouts. Sell focus and status with Pro.",
    },
    sidebar: {
      mvpTitle: "MVP focus",
      mvpCopy: "Nail workout tracking first. Verified logs should add status, not friction.",
    },
    dashboard: {
      eyebrow: "GymLogs MVP",
      headline: "Train like Strong. Compete like Warcraft Logs.",
      copy: "The app should stay fast during workouts and only go deep when someone wants to submit a top set for leaderboard status.",
      exploreLogs: "Explore logs",
      verifiedFlow: "Verified lift flow",
      topBenchmark: "Top benchmark",
      proPricing: "Pro pricing",
      proPricingCopy: "Ad-free plus better compare and ranking tools",
      unfinished: "You have an unfinished workout.",
      resume: "Resume ->",
      totalWorkouts: "Total Workouts",
      totalWorkoutsSub: "Your tracking foundation",
      totalVolumeSub: "What the app already measures well",
      totalSets: "Total Sets",
      totalSetsSub: "Future source for verified submissions",
      emptyTitle: "No training data yet",
      emptyCopy: "Start a workout and your volume, sets, PRs, and recent sessions will appear here.",
      signedOutTitle: "Sign in to see your dashboard",
      signedOutCopy: "Your workouts, PRs, and verified submissions need an account so they stay attached to you.",
      directionTitle: "Recommended product direction",
      directionCopy: "Your presentation idea is strong. This order makes it launchable.",
      phase1: "Phase 1",
      phase1Copy: "Make logging, history, and PR feedback feel excellent every day.",
      phase2: "Phase 2",
      phase2Copy: "Add verified set submissions and percentile-style log scores.",
      phase3: "Phase 3",
      phase3Copy: "Use Pro for ad-free focus, filters, compare tools, and badges.",
      monetizationTitle: "Monetization sanity check",
      freeWorks: "Free can work",
      freeWorksCopy: "Ads should live on dashboard or discovery surfaces, never in an active workout.",
      proSensible: "4.99 to 5 EUR Pro is sensible",
      proSensibleCopy: "Ad-free alone is weak, so bundle advanced filters, exports, compare flows, and faster review for verified submissions.",
      logsConcept: "See the Logs concept page",
      recentWorkouts: "Recent Workouts",
      recentPRs: "Recent PRs",
    },
    logsPage: {
      eyebrow: "Warcraft Logs energy, rebuilt for lifting",
      headline: "Verified lift logs, percentile scores, and rankings that feel worth sharing.",
      copy: "The product should stay simple during training and only get intense when someone wants to submit a real top set for the leaderboard.",
      topBench: "View top bench logs",
      submitSet: "Submit verified set",
      pricingTitle: "Free vs Pro",
      pricingCopy: "The business model works if monetization protects the workout flow.",
      leaderboardTitle: "Featured bench leaderboard",
      leaderboardCopy: "Start with a narrow set of iconic lifts before opening the system wider.",
      exercisePoolTitle: "MVP exercise pool",
      exercisePoolCopy: "This is the tighter, more believable scope than all exercises plus AI.",
      pillarsTitle: "Product pillars",
      pillarsCopy: "Good positioning from the presentation, but sequenced for a realistic launch.",
      nextTitle: "Next sensible build step",
      nextCopy: "Add verified submission data models before touching AI judging.",
      defineSchema: "Define schema",
      trackFast: "Track fast",
      trackFastCopy: "Workout logging needs to stay frictionless and usable mid-set.",
      rankFairly: "Rank fairly",
      rankFairlyCopy: "Percentiles only make sense with brackets, exercise variants, and consent.",
      verifyLater: "Verify later",
      verifyLaterCopy: "Video and AI should upgrade trust, not block the first version from shipping.",
      freeDescription: "Full workout tracking plus limited leaderboard browsing.",
      freeBullet1: "Workout logging, PR tracking, analytics",
      freeBullet2: "One lightweight sponsored slot outside active workouts",
      freeBullet3: "Community leaderboards with delayed refresh",
      proDescription: "Ad-free, faster, and built for lifters who want more signal.",
      proBullet1: "No ads anywhere in the app",
      proBullet2: "Priority video review and richer log insights",
      proBullet3: "Profile badges, advanced filters, export, compare tools",
    },
    workouts: {
      title: "Workouts",
      copy: "Training history should stay clean and fast. Verified logs can sit on top of it later.",
      logWorthyTitle: "Log-worthy top sets",
      logWorthyCopy: "Best future flow: finish the workout, then promote one standout set into a verified log.",
      empty: "No workouts yet. Start your first one!",
      emptyTitle: "No workouts logged yet",
      emptyCopy: "Start with a normal training session. Later, your best set can become a verified log.",
      loadingCopy: "Preparing your workout history.",
      newTitle: "New Workout",
      saveTemplate: "Save as template",
      templateSaved: "Template saved",
      templateName: "Template name",
    },
    exercises: {
      title: "Exercises",
      copy: "This stays your training library. The leaderboard layer should only cover selected lift variants.",
      poolTitle: "MVP leaderboard pool",
      poolCopy: "Bench press, squat, and deadlift are the only lifts in the first leaderboard scope.",
      search: "Search exercises...",
      fallbackNotice: "Showing local demo exercises until Convex is connected and seeded.",
      custom: "Custom",
      add: "Add Exercise",
      noExercises: "No exercises found",
      createCustom: "Create custom exercise",
      name: "Name",
      namePlaceholder: "Exercise name",
      muscleGroup: "Muscle Group",
      selectMuscle: "Select muscle group",
      category: "Category",
      selectCategory: "Select category",
      cancel: "Cancel",
      create: "Create",
    },
    analytics: {
      copy: "Readable training trends by week and body part.",
      weeklyVolume: "Weekly Volume by Muscle Group",
      weeklySets: "Weekly sets by muscle group",
      workoutsPerWeek: "Workouts per Week",
      workoutFrequency: "Workout frequency",
      totalWorkouts: "Total workouts",
      workouts: "Workouts",
      period: "Period",
      week: "Week",
      month: "Month",
      year: "Year",
      emptyTitle: "Analytics need a few sets",
      emptyCopy: "Log a workout with weights and reps to unlock weekly volume and frequency charts.",
      loadingCopy: "Crunching your training data.",
    },
    workout: {
      finish: "Finish Workout",
      noExercises: "No exercises yet",
      addFirst: "Add your first exercise",
      addExercise: "Add Exercise",
      notes: "Workout notes (optional)...",
      saveStandoutTitle: "Save your standout set for later",
      saveStandoutCopy: "Best future UX: log training first, then optionally submit one filmed top set to the verified leaderboard after the session.",
      last: "Last",
      weight: "Weight",
      set: "Set",
      previous: "Previous",
      addSet: "Add Set",
      rest: "rest",
      restRunning: "resting",
      decreaseRest: "Decrease rest time",
      increaseRest: "Increase rest time",
      completeSet: "complete",
    },
    prs: {
      personalRecords: "Personal Records",
      heaviest: "Heaviest",
      best1rm: "Best 1RM",
      bestVolume: "Best Volume",
      progress: "Progress",
      history: "History",
      noHistory: "No history yet",
      noRecent: "No PRs in the last 30 days",
      heaviestWeight: "Heaviest Weight",
    },
    muscleGroups: {
      chest: "Chest",
      back: "Back",
      shoulders: "Shoulders",
      biceps: "Biceps",
      triceps: "Triceps",
      quads: "Quads",
      hamstrings: "Hamstrings",
      glutes: "Glutes",
      calves: "Calves",
      core: "Core",
      legs: "Legs",
      other: "Other",
      full_body: "Full Body",
      cardio: "Cardio",
    },
    categories: {
      push: "Push",
      pull: "Pull",
      legs: "Legs",
      other: "Other",
    },
  },
  de: {
    common: {
      appName: "GymLogs",
      navSubtitle: "Tracken. Ranken. Verifizieren.",
      dashboard: "Dashboard",
      logs: "Logs",
      workouts: "Workouts",
      exercises: "Uebungen",
      analytics: "Analyse",
      newWorkout: "Neues Workout",
      proPrice: "Pro 4,99 EUR",
      openLanguageMenu: "Sprache aendern",
      openThemeMenu: "Farbschema wechseln",
      switchToLight: "In den Lightmode wechseln",
      switchToDark: "In den Nightmode wechseln",
      verified: "Verifiziert",
      pendingReview: "In Pruefung",
      logScore: "Log Score",
      viewLogs: "Logs-Konzept ansehen",
      noData: "Noch keine Daten",
      kg: "kg",
      reps: "Wdh.",
      sets: "Sets",
      volume: "Volumen",
      totalVolume: "Gesamtvolumen",
      loading: "Laedt",
      notFoundWorkout: "Workout nicht gefunden.",
      notFoundExercise: "Uebung nicht gefunden.",
      signIn: "Einloggen",
      startWorkout: "Workout starten",
    },
    topbar: {
      title: "Der Lift-Tracker, den Leute wirklich flexen wollen.",
      subtitle: "Keine Werbung im Workout. Pro verkauft Fokus und Status.",
    },
    sidebar: {
      mvpTitle: "MVP-Fokus",
      mvpCopy: "Erst Workout-Tracking stark machen. Verified Logs sollen Status geben, nicht nerven.",
    },
    dashboard: {
      eyebrow: "GymLogs MVP",
      headline: "Trainieren wie Strong. Vergleichen wie Warcraft Logs.",
      copy: "Die App soll im Workout schnell bleiben und erst tief werden, wenn jemand ein Top-Set fuer Leaderboard-Status einreichen will.",
      exploreLogs: "Logs ansehen",
      verifiedFlow: "Verified-Lift-Flow",
      topBenchmark: "Top Benchmark",
      proPricing: "Pro Preis",
      proPricingCopy: "Werbefrei plus bessere Vergleichs- und Ranking-Tools",
      unfinished: "Du hast noch ein offenes Workout.",
      resume: "Fortsetzen ->",
      totalWorkouts: "Workouts gesamt",
      totalWorkoutsSub: "Deine Tracking-Basis",
      totalVolumeSub: "Was die App jetzt schon gut misst",
      totalSets: "Sets gesamt",
      totalSetsSub: "Spaetere Quelle fuer verified submissions",
      emptyTitle: "Noch keine Trainingsdaten",
      emptyCopy: "Starte ein Workout. Danach erscheinen hier Volumen, Sets, PRs und letzte Sessions.",
      signedOutTitle: "Log dich ein, um dein Dashboard zu sehen",
      signedOutCopy: "Workouts, PRs und Verified Submissions brauchen einen Account, damit sie bei dir bleiben.",
      directionTitle: "Empfohlene Produkt-Richtung",
      directionCopy: "Die Praesi-Idee ist stark. Diese Reihenfolge macht sie launchbar.",
      phase1: "Phase 1",
      phase1Copy: "Logging, History und PR-Feedback jeden Tag richtig gut machen.",
      phase2: "Phase 2",
      phase2Copy: "Verified Set Submissions und Percentile-Log-Scores starten.",
      phase3: "Phase 3",
      phase3Copy: "Pro fuer werbefreien Fokus, Filter, Compare-Tools und Badges nutzen.",
      monetizationTitle: "Monetarisierungs-Check",
      freeWorks: "Free kann funktionieren",
      freeWorksCopy: "Werbung gehoert auf Dashboard oder Discovery, nie in ein aktives Workout.",
      proSensible: "4,99 bis 5 EUR Pro ist sinnvoll",
      proSensibleCopy: "Nur werbefrei ist zu wenig. Pack bessere Filter, Export, Compare-Flows und schnellere Reviews dazu.",
      logsConcept: "Zum Logs-Konzept",
      recentWorkouts: "Letzte Workouts",
      recentPRs: "Letzte PRs",
    },
    logsPage: {
      eyebrow: "Warcraft-Logs-Energie, neu gebaut fuer Lifts",
      headline: "Verifizierte Lift-Logs, Percentile Scores und Rankings, die man gern teilt.",
      copy: "Das Produkt soll im Training simpel bleiben und nur dann intensiv werden, wenn jemand ein echtes Top-Set fuer das Leaderboard einreicht.",
      topBench: "Top Bench Logs ansehen",
      submitSet: "Verified Set einreichen",
      pricingTitle: "Free vs Pro",
      pricingCopy: "Das Modell funktioniert, wenn Monetarisierung den Workout-Flow schuetzt.",
      leaderboardTitle: "Featured Bench Leaderboard",
      leaderboardCopy: "Erst mit wenigen ikonischen Lifts starten, bevor das System groesser wird.",
      exercisePoolTitle: "MVP Uebungspool",
      exercisePoolCopy: "Das ist enger und glaubwuerdiger als alle Uebungen plus AI.",
      pillarsTitle: "Produkt-Pfeiler",
      pillarsCopy: "Gute Positionierung aus der Praesi, aber realistischer sequenziert.",
      nextTitle: "Naechster sinnvoller Build-Schritt",
      nextCopy: "Verified-Submission-Datenmodell bauen, bevor AI-Judging drankommt.",
      defineSchema: "Schema definieren",
      trackFast: "Schnell tracken",
      trackFastCopy: "Workout Logging muss mitten im Set reibungslos bleiben.",
      rankFairly: "Fair ranken",
      rankFairlyCopy: "Percentiles ergeben nur mit Brackets, Varianten und Zustimmung Sinn.",
      verifyLater: "Spaeter verifizieren",
      verifyLaterCopy: "Video und AI sollen Vertrauen erhoehen, nicht den ersten Launch blockieren.",
      freeDescription: "Volles Workout-Tracking plus begrenztes Leaderboard-Browsing.",
      freeBullet1: "Workout Logging, PR Tracking, Analytics",
      freeBullet2: "Ein dezenter Werbeplatz ausserhalb aktiver Workouts",
      freeBullet3: "Community-Leaderboards mit verzogerter Aktualisierung",
      proDescription: "Werbefrei, schneller und fuer Lifter mit mehr Signal.",
      proBullet1: "Keine Werbung in der App",
      proBullet2: "Priorisierte Video-Review und bessere Log-Insights",
      proBullet3: "Profil-Badges, Advanced Filter, Export, Compare-Tools",
    },
    workouts: {
      title: "Workouts",
      copy: "Die Training-History soll clean und schnell bleiben. Verified Logs koennen spaeter darueber liegen.",
      logWorthyTitle: "Log-wuerdige Top Sets",
      logWorthyCopy: "Bester spaeterer Flow: Workout beenden und danach ein starkes Set als Verified Log einreichen.",
      empty: "Noch keine Workouts. Starte dein erstes!",
      emptyTitle: "Noch keine Workouts geloggt",
      emptyCopy: "Beginne mit einer normalen Trainingseinheit. Spaeter kann dein bestes Set ein Verified Log werden.",
      loadingCopy: "Deine Workout-History wird vorbereitet.",
      newTitle: "Neues Workout",
      saveTemplate: "Als Vorlage speichern",
      templateSaved: "Vorlage gespeichert",
      templateName: "Vorlagenname",
    },
    exercises: {
      title: "Uebungen",
      copy: "Das bleibt deine Trainingsbibliothek. Das Leaderboard-Layer sollte nur ausgewaehlte Lift-Varianten abdecken.",
      poolTitle: "MVP Leaderboard Pool",
      poolCopy: "Bench Press, Squat und Deadlift sind die einzigen Lifts im ersten Leaderboard-Scope.",
      search: "Uebungen suchen...",
      fallbackNotice: "Lokale Demo-Uebungen werden angezeigt, bis Convex verbunden und seeded ist.",
      custom: "Custom",
      add: "Uebung hinzufuegen",
      noExercises: "Keine Uebungen gefunden",
      createCustom: "Eigene Uebung erstellen",
      name: "Name",
      namePlaceholder: "Uebungsname",
      muscleGroup: "Muskelgruppe",
      selectMuscle: "Muskelgruppe waehlen",
      category: "Kategorie",
      selectCategory: "Kategorie waehlen",
      cancel: "Abbrechen",
      create: "Erstellen",
    },
    analytics: {
      copy: "Lesbare Trainings-Trends nach Woche und Muskelgruppe.",
      weeklyVolume: "Woechentliches Volumen nach Muskelgruppe",
      weeklySets: "Wöchentliche Sätze nach Muskelgruppe",
      workoutsPerWeek: "Workouts pro Woche",
      workoutFrequency: "Workout-Frequenz",
      totalWorkouts: "Workouts gesamt",
      workouts: "Workouts",
      period: "Zeitraum",
      week: "Woche",
      month: "Monat",
      year: "Jahr",
      emptyTitle: "Analyse braucht ein paar Sets",
      emptyCopy: "Logge ein Workout mit Gewicht und Wiederholungen, um Wochenvolumen und Frequenz zu sehen.",
      loadingCopy: "Deine Trainingsdaten werden berechnet.",
    },
    workout: {
      finish: "Workout beenden",
      noExercises: "Noch keine Uebungen",
      addFirst: "Erste Uebung hinzufuegen",
      addExercise: "Uebung hinzufuegen",
      notes: "Workout-Notizen (optional)...",
      saveStandoutTitle: "Merke dir dein staerkstes Set",
      saveStandoutCopy: "Bester spaeterer UX: erst Training loggen, dann optional ein gefilmtes Top-Set fuer das Verified Leaderboard einreichen.",
      last: "Letztes Mal",
      weight: "Gewicht",
      set: "Set",
      previous: "Vorher",
      addSet: "Set hinzufuegen",
      rest: "Pause",
      restRunning: "Pause läuft",
      decreaseRest: "Pausenzeit verringern",
      increaseRest: "Pausenzeit erhöhen",
      completeSet: "abhaken",
    },
    prs: {
      personalRecords: "Persoenliche Rekorde",
      heaviest: "Schwerstes Gewicht",
      best1rm: "Bestes 1RM",
      bestVolume: "Bestes Volumen",
      progress: "Fortschritt",
      history: "History",
      noHistory: "Noch keine History",
      noRecent: "Keine PRs in den letzten 30 Tagen",
      heaviestWeight: "Schwerstes Gewicht",
    },
    muscleGroups: {
      chest: "Brust",
      back: "Ruecken",
      shoulders: "Schultern",
      biceps: "Bizeps",
      triceps: "Trizeps",
      quads: "Quads",
      hamstrings: "Beinbeuger",
      glutes: "Gesaess",
      calves: "Waden",
      core: "Core",
      legs: "Beine",
      other: "Sonstiges",
      full_body: "Ganzkoerper",
      cardio: "Cardio",
    },
    categories: {
      push: "Push",
      pull: "Pull",
      legs: "Beine",
      other: "Sonstiges",
    },
  },
} as const;

type Dictionary = typeof dictionaries.en;

function withGermanUmlauts(value: string): string {
  return value
    .replaceAll("Ueb", "Üb")
    .replaceAll("ueb", "üb")
    .replaceAll("Ae", "Ä")
    .replaceAll("ae", "ä")
    .replaceAll("Oe", "Ö")
    .replaceAll("oe", "ö")
    .replaceAll("Woe", "Wö")
    .replaceAll("woe", "wö")
    .replaceAll("fuer", "für")
    .replaceAll("Fuer", "Für")
    .replaceAll("spaeter", "später")
    .replaceAll("Spaeter", "Später")
    .replaceAll("waehlen", "wählen")
    .replaceAll("Waehlen", "Wählen")
    .replaceAll("aendern", "ändern")
    .replaceAll("Aendern", "Ändern")
    .replaceAll("koennen", "können")
    .replaceAll("Koennen", "Können")
    .replaceAll("gehoert", "gehört")
    .replaceAll("Gehoert", "Gehört")
    .replaceAll("groesser", "größer")
    .replaceAll("Groesser", "Größer")
    .replaceAll("schuetzt", "schützt")
    .replaceAll("Schuetzt", "Schützt")
    .replaceAll("glaubwuerdig", "glaubwürdig")
    .replaceAll("Glaubwuerdig", "Glaubwürdig")
    .replaceAll("erhoehen", "erhöhen")
    .replaceAll("Erhoehen", "Erhöhen")
    .replaceAll("staerk", "stärk")
    .replaceAll("Staerk", "Stärk")
    .replaceAll("hinzufuegen", "hinzufügen")
    .replaceAll("Hinzufuegen", "Hinzufügen")
    .replaceAll("Persoen", "Persön")
    .replaceAll("persoen", "persön")
    .replaceAll("Ruecken", "Rücken")
    .replaceAll("Gesaess", "Gesäß")
    .replaceAll("Ganzkoerper", "Ganzkörper")
    .replaceAll("Praesi", "Präsi")
    .replaceAll("Laedt", "Lädt")
    .replaceAll("Pruefung", "Prüfung");
}

export function getNestedTranslation(
  locale: Locale,
  key: string
): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionaries[locale] as Dictionary);

  if (typeof value === "string") {
    return locale === "de" ? withGermanUmlauts(value) : value;
  }
  const fallback = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionaries.en as Dictionary);
  return typeof fallback === "string" ? fallback : key;
}
