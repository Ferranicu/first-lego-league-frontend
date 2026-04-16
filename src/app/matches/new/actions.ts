"use server";

import { CreateMatchPayload, MatchesService } from "@/api/matchesApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, ValidationError } from "@/types/errors";
import { UsersService } from "@/api/userApi";

function normalizeTime(value: string) {
    return value.length === 5 ? `${value}:00` : value;
}

function validateMatchPayload(data: CreateMatchPayload) {
    if (
        !data.startTime ||
        !data.endTime ||
        !data.round ||
        !data.competitionTable ||
        !data.teamA ||
        !data.teamB ||
        !data.referee
    ) {
        throw new ValidationError("Please complete all required match fields.");
    }

    if (data.teamA === data.teamB) {
        throw new ValidationError("Please select two different teams.");
    }

    const normalizedStartTime = normalizeTime(data.startTime);
    const normalizedEndTime = normalizeTime(data.endTime);

    if (normalizedStartTime >= normalizedEndTime) {
        throw new ValidationError("End time must be later than start time.");
    }

    return {
        ...data,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
    };
}

export async function createMatch(data: CreateMatchPayload) {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new AuthenticationError();
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to create matches.", 403);
    }

    const service = new MatchesService(serverAuthProvider);
    await service.createMatch(validateMatchPayload(data));

    return "/matches";
}
