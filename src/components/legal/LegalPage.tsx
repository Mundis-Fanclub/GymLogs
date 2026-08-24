"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { AppPage, AppPanel } from "@/components/ui/app-surface";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

type LegalPageKind = "impressum" | "datenschutz" | "hinweise";

const LEGAL_CONFIG: Record<
  LegalPageKind,
  {
    titleKey: string;
    descriptionKey: string;
    sections: Array<{
      titleKey: string;
      bodyKeys?: string[];
      itemKeys?: string[];
    }>;
  }
> = {
  impressum: {
    titleKey: "legal.impressum.title",
    descriptionKey: "legal.impressum.description",
    sections: [
      {
        titleKey: "legal.impressum.missingTitle",
        itemKeys: [
          "legal.impressum.missing.provider",
          "legal.impressum.missing.address",
          "legal.impressum.missing.contact",
          "legal.impressum.missing.representative",
          "legal.impressum.missing.register",
          "legal.impressum.missing.editorial",
        ],
      },
      {
        titleKey: "legal.common.noteTitle",
        bodyKeys: ["legal.impressum.note"],
      },
    ],
  },
  datenschutz: {
    titleKey: "legal.privacy.title",
    descriptionKey: "legal.privacy.description",
    sections: [
      {
        titleKey: "legal.privacy.missingTitle",
        itemKeys: [
          "legal.privacy.missing.controller",
          "legal.privacy.missing.contact",
          "legal.privacy.missing.hosting",
          "legal.privacy.missing.auth",
          "legal.privacy.missing.backend",
          "legal.privacy.missing.content",
          "legal.privacy.missing.legalBasis",
          "legal.privacy.missing.processors",
          "legal.privacy.missing.transfers",
          "legal.privacy.missing.rights",
        ],
      },
      {
        titleKey: "legal.privacy.statusTitle",
        bodyKeys: ["legal.privacy.status"],
      },
    ],
  },
  hinweise: {
    titleKey: "legal.notices.title",
    descriptionKey: "legal.notices.description",
    sections: [
      {
        titleKey: "legal.notices.trainingTitle",
        bodyKeys: ["legal.notices.training"],
      },
      {
        titleKey: "legal.notices.contentTitle",
        bodyKeys: ["legal.notices.content"],
      },
      {
        titleKey: "legal.notices.statsTitle",
        bodyKeys: ["legal.notices.stats"],
      },
    ],
  },
};

export function LegalPage({ page }: { page: LegalPageKind }) {
  const { t } = useAppPreferences();
  const config = LEGAL_CONFIG[page];

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <AppPage className="max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("legal.common.back")}
        </Link>
        <AppPanel className="overflow-hidden">
          <div className="border-b border-border/70 p-5 sm:p-7">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("legal.common.draftBadge")}
            </p>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{t(config.titleKey)}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(config.descriptionKey)}
            </p>
          </div>
          <div className="space-y-6 p-5 text-sm leading-6 sm:p-7">
            {config.sections.map((section) => (
              <section key={section.titleKey} className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">{t(section.titleKey)}</h2>
                {section.itemKeys && (
                  <ul className="grid gap-2">
                    {section.itemKeys.map((itemKey) => (
                      <li
                        key={itemKey}
                        className="rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-muted-foreground"
                      >
                        {t(itemKey)}
                      </li>
                    ))}
                  </ul>
                )}
                {section.bodyKeys && (
                  <div className="space-y-2 text-muted-foreground">
                    {section.bodyKeys.map((bodyKey) => (
                      <p key={bodyKey}>{t(bodyKey)}</p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </AppPanel>
      </AppPage>
    </main>
  );
}
