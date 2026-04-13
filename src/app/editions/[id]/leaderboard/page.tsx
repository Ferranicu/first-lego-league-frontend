import { LeaderboardService } from "@/api/leaderboardApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import type { LeaderboardItem } from "@/types/leaderboard";
import Link from "next/link";

interface LeaderboardPageProps {
    readonly params: Promise<{ id: string }>;
}

export default async function LeaderboardPage(props: Readonly<LeaderboardPageProps>) {
    const { id } = await props.params;
    const service = new LeaderboardService(serverAuthProvider);

    let items: LeaderboardItem[] = [];
    let error: string | null = null;

    try {
        const data = await service.getEditionLeaderboard(id);
        items = data.items;
    } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
        error = parseErrorMessage(e);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <h1 className="text-2xl font-semibold mb-6">Leaderboard</h1>

                    {error && (
                        <div className="rounded border border-red-200 p-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {!error && items.length === 0 && (
                        <p className="text-zinc-500 text-sm">No results yet for this edition.</p>
                    )}

                    {!error && items.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-zinc-500">
                                    <th className="pb-3 pr-4 font-medium">#</th>
                                    <th className="pb-3 pr-4 font-medium">Team</th>
                                    <th className="pb-3 pr-4 font-medium text-right">Total Score</th>
                                    <th className="pb-3 font-medium text-right">Matches Played</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const isTop3 = item.position <= 3;
                                    return (
                                        <tr key={item.teamId} className="border-b last:border-0">
                                            <td className="py-3 pr-4 text-zinc-400 text-sm">
                                                {item.position}
                                            </td>
                                            <td className={`py-3 pr-4 ${isTop3 ? "font-semibold text-zinc-900" : ""}`}>
                                                <Link
                                                    href={`/teams/${encodeURIComponent(item.teamName)}`}
                                                    className="hover:underline"
                                                >
                                                    {item.teamName}
                                                </Link>
                                            </td>
                                            <td className={`py-3 pr-4 text-right ${isTop3 ? "font-semibold text-zinc-900" : ""}`}>
                                                {item.totalScore}
                                            </td>
                                            <td className={`py-3 text-right ${isTop3 ? "font-semibold text-zinc-900" : ""}`}>
                                                {item.matchesPlayed}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
