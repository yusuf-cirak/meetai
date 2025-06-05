/** @format */
"use client";
import { ErrorState } from "@/components/error-state";
import { MeetingStatus } from "@/db/schema";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";

interface Props {
	meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery(
		trpc.meetings.getOne.queryOptions({ id: meetingId }),
	);

	if (data.status === MeetingStatus.Completed) {
		return (
			<div className="flex h-screen items-center justify-center">
				<ErrorState
					title="Meetnig has ended"
					description="You can no longer join this meeting"></ErrorState>
			</div>
		);
	}

	return (
		<CallProvider
			meetingId={data.id}
			meetingName={data.name}></CallProvider>
	);
};
