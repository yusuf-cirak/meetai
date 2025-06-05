/** @format */
"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useConfirm } from "@/hooks/use-confirm";
import { MeetingIdViewHeader } from "@/modules/meetings/ui/components/meeting-id-view-header";
import { UpdateMeetingDialog } from "@/modules/meetings/ui/components/update-meeting-dialog";
import { useTRPC } from "@/trpc/client";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { JSX, useState } from "react";
import { toast } from "sonner";
import { MeetingStatus } from "@/db/schema";
import { UpcomingState } from "@/modules/meetings/ui/components/upcoming-state";
import { ActiveState } from "@/modules/meetings/ui/components/active-state";
import { CancelledState } from "@/modules/meetings/ui/components/cancelled-state";
import { ProcessingState } from "@/modules/meetings/ui/components/processing-state";
interface Props {
	meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data } = useSuspenseQuery(
		trpc.meetings.getOne.queryOptions({ id: meetingId }),
	);

	const [RemoveConfirmation, confirmRemove] = useConfirm(
		"Are you sure?",
		`The following action will remove ${data.name} meeting.`,
	);

	const removeMeeting = useMutation(
		trpc.meetings.remove.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
				router.push("/meetings");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to remove meeting");
			},
		}),
	);

	const handleRemoveMeeting = async () => {
		const ok = await confirmRemove();

		if (!ok) {
			return;
		}

		await removeMeeting.mutateAsync({ id: meetingId });
	};

	const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

	const meetingStateComponents: Record<
		(typeof MeetingStatus)[keyof typeof MeetingStatus],
		JSX.Element
	> = {
		[MeetingStatus.Active]: (
			<div>
				<ActiveState meetingId={meetingId}></ActiveState>
			</div>
		),
		[MeetingStatus.Completed]: <div>Completed Meeting State</div>,
		[MeetingStatus.Cancelled]: (
			<div>
				<CancelledState></CancelledState>
			</div>
		),
		[MeetingStatus.Upcoming]: (
			<div>
				<UpcomingState
					meetingId={meetingId}
					onCancelMeeting={() => {}}
					isCanceling={false}></UpcomingState>
			</div>
		),
		[MeetingStatus.Processing]: (
			<div>
				<ProcessingState></ProcessingState>
			</div>
		),
	};

	return (
		<>
			<RemoveConfirmation />
			<UpdateMeetingDialog
				open={updateMeetingDialogOpen}
				onOpenChange={setUpdateMeetingDialogOpen}
				initialValues={data}
			/>
			<div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
				<MeetingIdViewHeader
					meetingId={meetingId}
					meetingName={data.name}
					onEdit={() => setUpdateMeetingDialogOpen(true)}
					onRemove={handleRemoveMeeting}
				/>
				{data.status in meetingStateComponents &&
					meetingStateComponents[data.status]}
			</div>
		</>
	);
};

export const MeetingViewLoading = () => {
	return (
		<LoadingState
			title="Loading meeting"
			description="This may take a few seconds"></LoadingState>
	);
};

export const MeetingViewError = () => {
	return (
		<ErrorState
			title="Error when loading meeting"
			description="Something went wrong"></ErrorState>
	);
};
