/** @format */
import { LogInIcon } from "lucide-react";
import {
	DefaultVideoPlaceholder,
	StreamVideoParticipant,
	ToggleAudioPreviewButton,
	ToggleVideoPreviewButton,
	useCallStateHooks,
	VideoPreview,
} from "@stream-io/video-react-sdk";

import Link from "next/link";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { Button } from "@/components/ui/button";

interface Props {
	onJoin: () => void;
}

const DisabledVideoPreview = () => {
	const { data } = authClient.useSession.get();
	return (
		<DefaultVideoPlaceholder
			participant={
				{
					name: data?.user.name ?? "",
					image:
						data?.user.image ??
						generateAvatarUri({
							seed: data?.user.name ?? "",
							variant: "initials",
						}),
				} as StreamVideoParticipant
			}
		/>
	);
};

const AllowBrowserPermissions = () => {
	return (
		<div className="flex flex-col items-center justify-center gap-y-4">
			<p className="text-sm text-gray-500">
				Please allow camera and microphone access in your browser settings.
			</p>
			<Link
				href="https://support.google.com/chrome/answer/2693767?hl=en"
				target="_blank"
				className="text-blue-500 hover:underline">
				Learn how to enable permissions
			</Link>
		</div>
	);
};

export const CallLobby = ({ onJoin }: Props) => {
	const { useCameraState, useMicrophoneState } = useCallStateHooks();

	const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
	const { hasBrowserPermission: hasCameraPermission } = useCameraState();

	const hasBrowserMediaPermission = hasMicPermission && hasCameraPermission;

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-radial from-sidebar-accent to-sidebar">
			<div className="py-4 px-8 flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
					<div className="flex flex-col gap-y-2 text-center">
						<h6 className="text-lg font-medium">Ready to join?</h6>
						<p className="text-sm">Set up your call before joining</p>
					</div>
					<VideoPreview
						DisabledVideoPreview={
							hasBrowserMediaPermission
								? DisabledVideoPreview
								: AllowBrowserPermissions
						}
					/>
					<div className="flex gap-x-2">
						<ToggleAudioPreviewButton />
						<ToggleVideoPreviewButton />
					</div>
					<div className="flex gap-x-2 justify-between w-full">
						<Button
							asChild
							variant="ghost">
							<Link href="/meetings">Cancel</Link>
						</Button>
						<Button onClick={onJoin}>
							<LogInIcon />
							Join Call
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
