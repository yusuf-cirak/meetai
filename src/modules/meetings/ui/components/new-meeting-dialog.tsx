/** @format */

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { useRouter } from "next/navigation";

interface NewAgentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const NewMeetingDialog = ({
	open,
	onOpenChange,
}: NewAgentDialogProps) => {
	const router = useRouter();
	return (
		<ResponsiveDialog
			title="New Meeting"
			description="Create a new meeting"
			open={open}
			onOpenChange={onOpenChange}>
			<MeetingForm
				onSuccess={(id) => {
					onOpenChange(false);
					router.push(`/meetings/${id}`);
				}}
				onCancel={() => onOpenChange(false)}
			/>
		</ResponsiveDialog>
	);
};
