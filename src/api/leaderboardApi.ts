import type { AuthStrategy } from "@/lib/authProvider";
import type { LeaderboardPageResponse } from "@/types/leaderboard";
import {
    ApiError,
    AuthenticationError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
} from "@/types/errors";

const PROD_API_BASE_URL = "https://api.firstlegoleague.win";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || PROD_API_BASE_URL;

export class LeaderboardService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getEditionLeaderboard(editionId: string, page = 0, size = 20): Promise<LeaderboardPageResponse> {
        const encodedId = encodeURIComponent(editionId);
        const url = `${API_BASE_URL}/leaderboards/editions/${encodedId}?page=${page}&size=${size}`;
        const authorization = await this.authStrategy.getAuth();

        let res: Response;
        try {
            res = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    ...(authorization ? { Authorization: authorization } : {}),
                },
                cache: "no-store",
            });
        } catch (e) {
            if (e instanceof TypeError) throw new NetworkError(undefined, e);
            throw e;
        }

        if (!res.ok) {
            switch (res.status) {
                case 401:
                case 403:
                    throw new AuthenticationError(undefined, res.status);
                case 404:
                    throw new NotFoundError();
                case 400:
                    throw new ValidationError();
                case 500:
                case 502:
                case 503:
                case 504:
                    throw new ServerError(undefined, res.status);
                default:
                    throw new ApiError("An error occurred. Please try again.", res.status, true);
            }
        }

        return res.json() as Promise<LeaderboardPageResponse>;
    }
}
