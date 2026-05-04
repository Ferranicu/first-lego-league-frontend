import { MatchesService } from "@/api/matchesApi";
import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getTeamDisplayName } from "@/lib/teamUtils";
import { CompetitionTable } from "@/types/competitionTable";
import { AuthenticationError, NotFoundError, parseErrorMessage } from "@/types/errors";
import { Match } from "@/types/match";
import { Referee } from "@/types/referee";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { redirect } from "next/navigation";
import EditMatchForm from "./form";

type Option = {
    label: string;
    value: string;
};

type MatchEditPageProps = {
    readonly params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function getUriLabel(resourceUri?: string, fallbackPrefix: string = "Item") {
    const uri = resourceUri ?? "";
    let decodedId = uri.split("/").findLast(Boolean) ?? "";

    try {
        decodedId = decodeURIComponent(decodedId);
    } catch {
    }

    return decodedId ? `${fallbackPrefix} ${decodedId}` : fallbackPrefix;
}

function getResourceUri(resource?: { uri?: string; link: (rel: string) => { href?: string } | null }) {
    return resource?.link("self")?.href ?? resource?.uri ?? "";
}

function getRoundOption(round: Round): Option | null {
    const resourceUri = getResourceUri(round);
    if (!resourceUri) {
        return null;
    }

    const label =
        round.number === undefined ? getUriLabel(resourceUri, "Round") : `Round ${round.number}`;
    return { label, value: resourceUri };
}

function getCompetitionTableOption(table: CompetitionTable): Option | null {
    const resourceUri = getResourceUri(table);
    if (!resourceUri) {
        return null;
    }

    return {
        label: getUriLabel(resourceUri, "Table"),
        value: resourceUri,
    };
}

function getRefereeOption(referee: Referee): Option | null {
    const resourceUri = getResourceUri(referee);
    if (!resourceUri) {
        return null;
    }

    return {
        label: referee.name ?? referee.emailAddress ?? getUriLabel(resourceUri, "Referee"),
        value: resourceUri,
    };
}

function getTeamOption(team: Team): Option | null {
    const resourceUri = getResourceUri(team);
    if (!resourceUri) {
        return null;
    }

    return {
        label: getTeamDisplayName(team),
        value: resourceUri,
    };
}

function compactOptions(options: Array<Option | null>) {
    return options.filter((option): option is Option => option !== null);
}

function sortOptions(options: Option[]) {
    return options.toSorted((left, right) => left.label.localeCompare(right.label));
}

function ensureSelectedOption(options: Option[], selected: Option | null) {
    if (!selected || options.some((option) => option.value === selected.value)) {
        return options;
    }

    return sortOptions([...options, selected]);
}

function toTimeInputValue(value?: string) {
    if (!value) {
        return "";
    }

    const timeMatch = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
    if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function getMatchTitle(match: Match | null, id: string) {
    if (!match) {
        return `Match ${id}`;
    }

    return match.id ? `Match ${match.id}` : `Match ${id}`;
}

export default async function EditMatchPage({ params }: Readonly<MatchEditPageProps>) {
    const { id } = await params;
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    let currentUser: User | null = null;
    let error: string | null = null;
    let match: Match | null = null;
    let roundOptions: Option[] = [];
    let competitionTableOptions: Option[] = [];
    let refereeOptions: Option[] = [];
    let teamOptions: Option[] = [];

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        if (e instanceof AuthenticationError) {
            redirect("/login");
        }

        error = parseErrorMessage(e);
    }

    if (!error && !currentUser) {
        redirect("/login");
    }

    if (!error && !isAdmin(currentUser)) {
        redirect("/");
    }

    let selectedRound: Option | null = null;
    let selectedCompetitionTable: Option | null = null;
    let selectedReferee: Option | null = null;
    let selectedTeamA: Option | null = null;
    let selectedTeamB: Option | null = null;

    if (!error) {
        try {
            const matchesService = new MatchesService(serverAuthProvider);
            const teamsService = new TeamsService(serverAuthProvider);

            const [
                resolvedMatch,
                rounds,
                competitionTables,
                referees,
                teams,
                matchRound,
                matchCompetitionTable,
                matchReferee,
                matchTeamA,
                matchTeamB,
            ] = await Promise.all([
                matchesService.getMatchById(id),
                matchesService.getRounds(),
                matchesService.getCompetitionTables(),
                matchesService.getReferees(),
                teamsService.getTeams(),
                matchesService.getMatchRound(id).catch(() => null),
                matchesService.getMatchCompetitionTable(id).catch(() => null),
                matchesService.getMatchReferee(id).catch(() => null),
                matchesService.getMatchTeamA(id).catch(() => null),
                matchesService.getMatchTeamB(id).catch(() => null),
            ]);

            match = resolvedMatch;
            roundOptions = sortOptions(compactOptions(rounds.map(getRoundOption)));
            competitionTableOptions = sortOptions(
                compactOptions(competitionTables.map(getCompetitionTableOption))
            );
            refereeOptions = sortOptions(compactOptions(referees.map(getRefereeOption)));
            teamOptions = sortOptions(compactOptions(teams.map(getTeamOption)));

            selectedRound = matchRound ? getRoundOption(matchRound) : null;
            selectedCompetitionTable = matchCompetitionTable
                ? getCompetitionTableOption(matchCompetitionTable)
                : null;
            selectedReferee = matchReferee ? getRefereeOption(matchReferee) : null;
            selectedTeamA = matchTeamA ? getTeamOption(matchTeamA) : null;
            selectedTeamB = matchTeamB ? getTeamOption(matchTeamB) : null;

            roundOptions = ensureSelectedOption(roundOptions, selectedRound);
            competitionTableOptions = ensureSelectedOption(
                competitionTableOptions,
                selectedCompetitionTable,
            );
            refereeOptions = ensureSelectedOption(refereeOptions, selectedReferee);
            teamOptions = ensureSelectedOption(ensureSelectedOption(teamOptions, selectedTeamA), selectedTeamB);
        } catch (e) {
            error =
                e instanceof NotFoundError
                    ? "This match does not exist."
                    : parseErrorMessage(e);
        }
    }

    return (
        <PageShell
            eyebrow="Competition schedule"
            title={`Edit ${getMatchTitle(match, id)}`}
            description="Update the scheduled time, round, table, teams, and referee for this match."
        >
            {error || !match ? (
                <ErrorAlert message={error ?? "This match could not be loaded."} />
            ) : (
                <EditMatchForm
                    matchId={id}
                    initialValues={{
                        startTime: toTimeInputValue(match.startTime),
                        endTime: toTimeInputValue(match.endTime),
                        round: selectedRound?.value ?? "",
                        competitionTable: selectedCompetitionTable?.value ?? "",
                        teamA: selectedTeamA?.value ?? "",
                        teamB: selectedTeamB?.value ?? "",
                        referee: selectedReferee?.value ?? "",
                    }}
                    roundOptions={roundOptions}
                    competitionTableOptions={competitionTableOptions}
                    refereeOptions={refereeOptions}
                    teamOptions={teamOptions}
                />
            )}
        </PageShell>
    );
}
