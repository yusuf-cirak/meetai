/** @format */

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { BanIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

interface Props {
	meetingId: string;
	onCancelMeeting: () => void;
	isCanceling: boolean;
}

export const UpcomingState = ({
	meetingId,
	isCanceling,
	onCancelMeeting,
}: Props) => {
	return (
		<div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
			<EmptyState
				image="/upcoming.svg"
				title="Not started yet"
				description="Once you start this meeting, a summary will appear here"
			/>
			<div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
				<Button
					variant="secondary"
					onClick={onCancelMeeting}
					disabled={isCanceling}
					className="w-full lg:w-auto">
					<BanIcon />
					Cancel Meeting
				</Button>
				<Button
					asChild
					disabled={isCanceling}
					variant="default"
					className="w-full lg:w-auto">
					<Link href={`/call/${meetingId}`}>
						<VideoIcon />
						Start Meeting
					</Link>
				</Button>
			</div>
		</div>
	);
};
