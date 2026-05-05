"use server";

import { CreateMatchPayload, MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError } from "@/types/errors";
import { validateMatchPayload } from "../match-form-validation";


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
