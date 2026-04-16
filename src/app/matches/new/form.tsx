"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { parseErrorMessage } from "@/types/errors";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { createMatch } from "./actions";

type Option = { label: string; value: string };

type FormValues = {
    startTime: string;
    endTime: string;
    round: string;
    competitionTable: string;
    teamA: string;
    teamB: string;
    referee: string;
};

const selectClassName =
    "border-input h-11 w-full border bg-card px-4 py-2 text-base outline-none " +
    "focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] " +
    "aria-invalid:border-destructive md:text-sm disabled:pointer-events-none disabled:opacity-50";

function EmptySelectMessage({
    label,
    hasOptions,
}: Readonly<{
    label: string;
    hasOptions: boolean;
}>) {
    if (hasOptions) {
        return null;
    }

    return (
        <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} are available yet. Ask an administrator to create them in the backend first.
        </p>
    );
}

export default function NewMatchForm({
    roundOptions,
    competitionTableOptions,
    refereeOptions,
    teamOptions,
}: Readonly<{
    roundOptions: Option[];
    competitionTableOptions: Option[];
    refereeOptions: Option[];
    teamOptions: Option[];
}>) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    const isReadyToSubmit =
        roundOptions.length > 0 &&
        competitionTableOptions.length > 0 &&
        refereeOptions.length > 0 &&
        teamOptions.length > 1;

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSubmitError(null);

        try {
            const destination = await createMatch({
                startTime: data.startTime,
                endTime: data.endTime,
                round: data.round,
                competitionTable: data.competitionTable,
                teamA: data.teamA,
                teamB: data.teamB,
                referee: data.referee,
            });
            router.push(destination);
        } catch (error) {
            setSubmitError(parseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-xl gap-5">
            {submitError && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {submitError}
                </p>
            )}

            {!isReadyToSubmit && (
                <p
                    className="border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800"
                    role="status"
                    aria-live="polite"
                >
                    Match creation needs at least one round, one competition table, one referee, and two teams.
                </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="startTime">Start time</Label>
                    <Input
                        id="startTime"
                        type="time"
                        step={60}
                        {...register("startTime", {
                            required: "Start time is required",
                        })}
                    />
                    {errors.startTime && (
                        <p className="text-sm text-destructive" role="alert">
                            {errors.startTime.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="endTime">End time</Label>
                    <Input
                        id="endTime"
                        type="time"
                        step={60}
                        {...register("endTime", {
                            required: "End time is required",
                            validate: (value) => {
                                const startTime = getValues("startTime");

                                if (!startTime || !value) {
                                    return true;
                                }

                                return value > startTime || "End time must be later than start time";
                            },
                        })}
                    />
                    {errors.endTime && (
                        <p className="text-sm text-destructive" role="alert">
                            {errors.endTime.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="round">Round</Label>
                <select
                    id="round"
                    className={selectClassName}
                    disabled={roundOptions.length === 0}
                    {...register("round", { required: "Round is required" })}
                >
                    <option value="">
                        {roundOptions.length > 0 ? "Select a round..." : "No rounds available"}
                    </option>
                    {roundOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage label="rounds" hasOptions={roundOptions.length > 0} />
                {errors.round && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.round.message}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="competitionTable">Competition table</Label>
                <select
                    id="competitionTable"
                    className={selectClassName}
                    disabled={competitionTableOptions.length === 0}
                    {...register("competitionTable", { required: "Competition table is required" })}
                >
                    <option value="">
                        {competitionTableOptions.length > 0
                            ? "Select a competition table..."
                            : "No competition tables available"}
                    </option>
                    {competitionTableOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage
                    label="competition tables"
                    hasOptions={competitionTableOptions.length > 0}
                />
                {errors.competitionTable && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.competitionTable.message}
                    </p>
                )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="teamA">Team A</Label>
                    <select
                        id="teamA"
                        className={selectClassName}
                        disabled={teamOptions.length < 2}
                        {...register("teamA", { required: "Team A is required" })}
                    >
                        <option value="">
                            {teamOptions.length > 1 ? "Select team A..." : "At least two teams are required"}
                        </option>
                        {teamOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {errors.teamA && (
                        <p className="text-sm text-destructive" role="alert">
                            {errors.teamA.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="teamB">Team B</Label>
                    <select
                        id="teamB"
                        className={selectClassName}
                        disabled={teamOptions.length < 2}
                        {...register("teamB", {
                            required: "Team B is required",
                            validate: (value) =>
                                value !== getValues("teamA") || "Please select a different team for Team B",
                        })}
                    >
                        <option value="">
                            {teamOptions.length > 1 ? "Select team B..." : "At least two teams are required"}
                        </option>
                        {teamOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {errors.teamB && (
                        <p className="text-sm text-destructive" role="alert">
                            {errors.teamB.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="referee">Referee</Label>
                <select
                    id="referee"
                    className={selectClassName}
                    disabled={refereeOptions.length === 0}
                    {...register("referee", { required: "Referee is required" })}
                >
                    <option value="">
                        {refereeOptions.length > 0 ? "Select a referee..." : "No referees available"}
                    </option>
                    {refereeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <EmptySelectMessage label="referees" hasOptions={refereeOptions.length > 0} />
                {errors.referee && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.referee.message}
                    </p>
                )}
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting || !isReadyToSubmit}>
                {isSubmitting ? "Creating..." : "Create match"}
            </Button>
        </form>
    );
}
