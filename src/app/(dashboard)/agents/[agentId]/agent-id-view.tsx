/** @format */

"use client";
import { ErrorState } from "@/components/error-state";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { AgentIdViewHeader } from "@/modules/agents/ui/components/agent-id-view-header";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { VideoIcon } from "lucide-react";

interface Props {
	agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery(
		trpc.agents.getOne.queryOptions({ id: agentId }),
	);

	return (
		<div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
			<AgentIdViewHeader
				agentId={data.id}
				agentName={data.name}
				onEdit={() => {}}
				onRemove={() => {}}></AgentIdViewHeader>

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
						{data.meetingCount}{" "}
						{data.meetingCount === 1 ? "meeting" : "meetings"}
					</Badge>
					<div className="flex flex-col gap-y-4">
						<p className="text-l font-medium">Instructions</p>
						<p className="text-neutral-800">{data.instructions}</p>
					</div>
				</div>
			</div>
		</div>
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
