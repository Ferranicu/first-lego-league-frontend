import type { AuthStrategy } from "@/lib/authProvider";
import { Team } from "@/types/team";
import { User } from "@/types/user";
import { deleteHal, fetchHalCollection, fetchHalResource } from "./halClient";

function getSafeEncodedId(id: string): string {
    try {
        // HAL links may already contain encoded ids, so normalize before reusing them.
        return encodeURIComponent(decodeURIComponent(id));
    } catch {
        return encodeURIComponent(id);
    }
}

export class TeamsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getTeams(): Promise<Team[]> {
        return fetchHalCollection<Team>('/teams', this.authStrategy, 'teams');
    }

    async getTeamById(id: string): Promise<Team> {
        const teamId = getSafeEncodedId(id);
        return fetchHalResource<Team>(`/teams/${teamId}`, this.authStrategy);
    }

    async getTeamCoach(id: string): Promise<User[]> {
        const teamId = getSafeEncodedId(id);
        return fetchHalCollection<User>(`/teams/${teamId}/trainedBy`, this.authStrategy, 'coaches');
    }

    async getTeamMembers(id: string): Promise<User[]> {
        const teamId = getSafeEncodedId(id);
        return fetchHalCollection<User>(`/teams/${teamId}/members`, this.authStrategy, 'teamMembers');
    }

    async deleteTeam(id: string): Promise<void> {
        const teamId = getSafeEncodedId(id);
        await deleteHal(`/teams/${teamId}`, this.authStrategy);
    }
}
