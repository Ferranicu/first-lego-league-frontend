import { ScientificProjectsService } from "@/api/scientificProjectApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { ScientificProject } from "@/types/scientificProject";
import { Team } from "@/types/team";
import Link from "next/link";
import { fetchHalResource } from "@/api/halClient";

export const dynamic = "force-dynamic";

interface ScientificProjectDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getProjectTitle(project: ScientificProject | null, id: string): string {
    if (!project) {
        let decodedId = id;
        try { decodedId = decodeURIComponent(id); } catch { /* use raw id */ }
        return `Scientific Project ${decodedId}`;
    }
    return project.comments ? project.comments : `Scientific Project ${id}`;
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="min-w-36 text-sm font-medium text-foreground">{label}</span>
            <span className="text-sm text-muted-foreground">{value}</span>
        </div>
    );
}

function TeamCard({ team }: Readonly<{ team: Team }>) {
    const selfHref = team.link("self")?.href ?? team.uri;
    const rawSegment = selfHref?.split(/[?#]/, 1)[0]?.split("/").filter(Boolean).at(-1);
    const teamId = rawSegment
        ? (() => { try { return encodeURIComponent(decodeURIComponent(rawSegment)); } catch { return encodeURIComponent(rawSegment); } })()
        : null;

    const cardContent = (
        <div
            className={`module-card flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors${teamId ? " hover:bg-secondary/30" : ""}`}
        >
            <div className="page-eyebrow">Presenting team</div>
            <p className="list-title">{team.name ?? team.id ?? "Unnamed team"}</p>
            <div className="space-y-1">
                {team.city && <p className="list-support">{team.city}</p>}
                {team.category && (
                    <span className="status-badge inline-block">{team.category}</span>
                )}
            </div>
            {teamId && (
                <p className="mt-1 text-xs font-medium text-accent-foreground underline-offset-2 hover:underline">
                    View team details →
                </p>
            )}
        </div>
    );

    if (teamId) {
        return <Link href={`/teams/${teamId}`}>{cardContent}</Link>;
    }

    return cardContent;
}

export default async function ScientificProjectDetailPage(props: Readonly<ScientificProjectDetailPageProps>) {
    const { id } = await props.params;
    const service = new ScientificProjectsService(serverAuthProvider);

    let project: ScientificProject | null = null;
    let team: Team | null = null;
    let projectError: string | null = null;
    let teamError: string | null = null;

    try {
        project = await service.getScientificProjectById(id);
    } catch (e) {
        console.error("Failed to fetch scientific project:", e);
        projectError = e instanceof NotFoundError
            ? "This scientific project does not exist."
            : `Could not load project details. ${parseErrorMessage(e)}`;
    }

    const teamHref = project?.link("team")?.href ?? project?.team;
    if (teamHref) {
        try {
            team = await fetchHalResource<Team>(teamHref, serverAuthProvider);
        } catch (e) {
            console.error("Failed to fetch project team:", e);
            teamError = `Could not load team information. ${parseErrorMessage(e)}`;
        }
    }

    return (
        <PageShell
            eyebrow="Scientific Project"
            title={getProjectTitle(project, id)}
            description={project?.score !== undefined && project?.score !== null ? `Score: ${project.score} pts` : undefined}
        >
            {projectError && <ErrorAlert message={projectError} />}

            {!projectError && project && (
                <div className="space-y-8">
                    {/* Project details */}
                    <section aria-labelledby="project-info-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Evaluation</div>
                            <h2 id="project-info-heading" className="section-title">Project details</h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <div className="space-y-3">
                                {project.score !== undefined && project.score !== null && (
                                    <InfoRow label="Score" value={`${project.score} pts`} />
                                )}
                                {project.comments && (
                                    <InfoRow label="Comments" value={project.comments} />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Team */}
                    <section aria-labelledby="team-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Participant</div>
                            <h2 id="team-heading" className="section-title">Presenting team</h2>
                        </div>

                        {teamError && <ErrorAlert message={teamError} />}

                        {!teamError && team && <TeamCard team={team} />}
                    </section>

                    {/* Evaluation room — placeholder */}
                    <section aria-labelledby="room-heading">
                        <div className="mb-4 space-y-1">
                            <div className="page-eyebrow">Venue</div>
                            <h2 id="room-heading" className="section-title">Evaluation room</h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <p className="text-sm text-muted-foreground">
                                Room and judge information will be available in a future update.
                            </p>
                        </div>
                    </section>
                </div>
            )}
        </PageShell>
    );
}