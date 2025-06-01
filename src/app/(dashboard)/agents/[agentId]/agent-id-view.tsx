/** @format */

"use client";
import { ErrorState } from "@/components/error-state";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/db/schema";
import { useConfirm } from "@/hooks/use-confirm";
import { AgentIdViewHeader } from "@/modules/agents/ui/components/agent-id-view-header";
import { UpdateAgentDialog } from "@/modules/agents/ui/components/update-agent-dialog";
import { useTRPC } from "@/trpc/client";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
	agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [uodateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

	const { data } = useSuspenseQuery(
		trpc.agents.getOne.queryOptions({ id: agentId }),
	);

	// const updateAgent = useMutation(trpc.agents.update.mutationOptions({}));

	const removeAgent = useMutation(
		trpc.agents.remove.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries(
					trpc.agents.getMany.queryOptions({}),
				);
				router.push("/agents");
			},
		}),
	);

	const [RemoveConfirmation, confirmRemove] = useConfirm(
		"Are you sure?",
		`The following action will remove ${data.name} and ${data.meetingCount} associated meetings.`,
	);

	const handleRmoveAgent = async () => {
		const ok = await confirmRemove();

		if (!ok) {
			return;
		}

		await removeAgent.mutateAsync({ id: agentId });
	};
	return (
		<>
			<RemoveConfirmation />
			<UpdateAgentDialog
				onOpenChange={setUpdateAgentDialogOpen}
				open={uodateAgentDialogOpen}
				initialValues={data}
			/>
			<div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
				<AgentIdViewHeader
					agentId={data.id}
					agentName={data.name}
					onEdit={() => setUpdateAgentDialogOpen(true)}
					onRemove={handleRmoveAgent}></AgentIdViewHeader>

				<div className="bg-white rounded-lg border">
					<div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
						<div className="flex items-center gap-x-3">
							<GeneratedAvatar
								variant="botttsNeutral"
								seed={data.name}
								className="size-10"
							/>
							<h2 className="text-2xl font-medium">{data.name}</h2>
						</div>
						<Badge
							variant="outline"
							className="flex items-center gap-x-2 [&> svg]:size-4">
							<VideoIcon className="text-blue-700" />
							{data.meetingCount}
							{data.meetingCount === 1 ? "meeting" : "meetings"}
						</Badge>
						<div className="flex flex-col gap-y-4">
							<p className="text-l font-medium">Instructions</p>
							<p className="text-neutral-800">{data.instructions}</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export const AgentViewLoading = () => {
	return (
		<LoadingState
			title="Loading agent"
			description="This may take a few seconds"></LoadingState>
	);
};

export const AgentViewError = () => {
	return (
		<ErrorState
			title="Error when loading agent"
			description="Something went wrong"></ErrorState>
	);
};
