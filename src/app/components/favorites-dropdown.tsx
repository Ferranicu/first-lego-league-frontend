"use client";

import { Button } from "@/app/components/button";
import { useFavorites } from "@/app/components/favorites-provider";
import { cn } from "@/lib/utils";
import { ChevronDown, Star, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FavoritesDropdown() {
    const { favorites, removeFavoriteById } = useFavorites();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        if (open) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <div className="relative hidden lg:block">
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen((current) => !current)}
                className="whitespace-nowrap"
            >
                <Star className="h-4 w-4" />
                Favorites
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {favorites.length}
                </span>
            </Button>

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="Close favorites"
                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                        onClick={() => setOpen(false)}
                    />

                    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-3 shadow-lg">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Favorites</h2>
                                <p className="text-xs text-muted-foreground">
                                    Quick access to your bookmarked pages.
                                </p>
                            </div>
                            <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                {favorites.length}
                            </span>
                        </div>

                        {favorites.length === 0 ? (
                            <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                                No favorites yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {favorites.map((favorite) => (
                                    <li
                                        key={`${favorite.type}:${favorite.id}`}
                                        className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <Link
                                                href={favorite.href}
                                                className="block truncate text-sm font-medium text-foreground hover:text-accent hover:underline"
                                                onClick={() => setOpen(false)}
                                            >
                                                {favorite.label}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {favorite.type.replace("-", " ")}
                                                {favorite.secondaryLabel ? ` - ${favorite.secondaryLabel}` : ""}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            onClick={() => removeFavoriteById(favorite.type, favorite.id)}
                                            aria-label={`Remove ${favorite.label} from favorites`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
