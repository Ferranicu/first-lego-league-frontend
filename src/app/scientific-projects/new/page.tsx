import { EditionsService } from "@/api/editionApi";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { getEncodedResourceId } from "@/lib/halRoute";
import { redirect } from "next/navigation";
import NewScientificProjectForm from "./form";

export default async function NewScientificProjectPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const editions = await new EditionsService(serverAuthProvider).getEditions().catch(() => []);

    const editionOptions = editions.map(e => ({
        label: `${e.year}${e.venueName ? ` — ${e.venueName}` : ""}`,
        value: e.link("self")?.href ?? "",
    }));

    const teamsPerEditionEntries = await Promise.all(
        editions.map(async (e) => {
            const editionHref = e.link("self")?.href ?? "";
            const editionId = getEncodedResourceId(editionHref) ?? "";
            const teams = await new EditionsService(serverAuthProvider)
                .getEditionTeams(editionId)
                .catch(() => []);
            return [editionHref, teams.map(t => ({
                label: t.id ?? "",
                value: t.link("self")?.href ?? "",
            }))] as const;
        })
    );

    const teamsPerEdition = Object.fromEntries(teamsPerEditionEntries);

    return (
        <PageShell
            eyebrow="Innovation project"
            title="New Scientific Project"
            description="Submit a new scientific project for a FIRST LEGO League edition."
        >
            <NewScientificProjectForm
                editionOptions={editionOptions}
                teamsPerEdition={teamsPerEdition}
            />
        </PageShell>
    );
}
