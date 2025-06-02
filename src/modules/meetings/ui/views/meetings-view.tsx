/** @format */
"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const MeetingsView = () => {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}));
	return (
		<div className="flex flex-col gap-4">{JSON.stringify(data, null, 2)}</div>
	);
};

export const MeetingsViewLoading = () => {
	return (
		<LoadingState
			title="Loading meetings"
			description="This may take a few seconds"></LoadingState>
	);
};

export const MeetingsViewError = () => {
	return (
		<ErrorState
			title="Error when loading meetings"
			description="Something went wrong"></ErrorState>
	);
};
