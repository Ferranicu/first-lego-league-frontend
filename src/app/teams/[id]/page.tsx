import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import TeamDeleteSection from "./team-delete-section";

interface TeamDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function getTeamTitle(team: Team | null, id: string) {
    if (team?.name) {
        return team.name;
    }
    if (team?.id) {
        return team.id;
    }

    let decodedId = id;
    try {
        decodedId = decodeURIComponent(id);
    } catch {
        // use raw id if decodeURIComponent fails
    }

    return `Team ${decodedId}`;
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;
    const service = new TeamsService(serverAuthProvider);

    let team: Team | null = null;
    let coaches: User[] = [];
    let members: User[] = [];
    let currentUser: User | null = null;
    let error: string | null = null;
    let membersError: string | null = null;

    try {
        // Enforce the admin-only delete action from the server-rendered page as well.
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    try {
        team = await service.getTeamById(id);
    } catch (e) {
        console.error("Failed to fetch team:", e);
        error = e instanceof NotFoundError 
            ? "This team does not exist." 
            : parseErrorMessage(e);
    }

    if (team && !error) {
        try {
            // Fetch related collections together once the team itself has loaded.
            [coaches, members] = await Promise.all([
                service.getTeamCoach(id),
                service.getTeamMembers(id)
            ]);
        } catch (e) {
            console.error("Failed to fetch team details:", e);
            membersError = parseErrorMessage(e);
        }
    }

    const coachName = coaches.length > 0 
        ? (coaches[0].username ?? coaches[0].email ?? "Unnamed coach") 
        : "No coach assigned";

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <h1 className="mb-2 text-2xl font-semibold">{getTeamTitle(team, id)}</h1>
                    
                    {!error && team && (
                        <>
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1 text-sm text-zinc-600">
                                    {team.city && <p><strong>City:</strong> {team.city}</p>}
                                    {team.category && <p><strong>Category:</strong> {team.category}</p>}
                                    {team.educationalCenter && <p><strong>Educational Center:</strong> {team.educationalCenter}</p>}
                                    <p><strong>Coach:</strong> {coachName}</p>
                                </div>
                                {isAdmin(currentUser) && (
                                    <TeamDeleteSection
                                        teamId={id}
                                        teamName={getTeamTitle(team, id)}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="mt-6">
                            <ErrorAlert message={error} />
                        </div>
                    )}

                    {!error && (
                        <>
                            <h2 className="mt-8 mb-4 text-xl font-semibold">Team Members</h2>

                            {membersError && (
                                <ErrorAlert message={membersError} />
                            )}

                            {!membersError && members.length === 0 && (
                                <EmptyState
                                    title="No members found"
                                    description="No members are registered for this team yet."
                                />
                            )}

                            {!membersError && members.length > 0 && (
                                <ul className="w-full space-y-3">
                                    {members.map((member, index) => (
                                        <li
                                            key={member.uri ?? index}
                                            className="p-4 w-full border rounded-lg bg-white shadow-sm transition dark:bg-black"
                                        >
                                            <span className="font-medium">
                                                {member.username ?? member.email ?? `Member ${index + 1}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
