/** @format */

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { MeetingGetOne } from "../../types";
import { meetingsInsertSchema } from "../../schemas";
import { useState } from "react";
import { CommandSelect } from "@/components/command-select";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";

interface MeetingFormProps {
	onSuccess?: (id?: string) => void;
	onCancel?: () => void;
	initialValues?: MeetingGetOne;
}

export const MeetingForm = ({
	onSuccess,
	onCancel,
	initialValues,
}: MeetingFormProps) => {
	const trpc = useTRPC();

	const queryClient = useQueryClient();

	const [openNewAgentDialog, setNewAgentDialogOpen] = useState(false);

	const [agentSearch, setAgentSearch] = useState("");

	const agents = useQuery(
		trpc.agents.getMany.queryOptions({
			pageSize: 100,
			search: agentSearch,
		}),
	);

	const createMeeting = useMutation(
		trpc.meetings.create.mutationOptions({
			onSuccess: async (data) => {
				const promises = [
					queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({})),
				];

				await Promise.all(promises);
				onSuccess?.(data.id);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const updateMeeting = useMutation(
		trpc.meetings.update.mutationOptions({
			onSuccess: async () => {
				const promises = [
					queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({})),
				];
				if (initialValues?.id) {
					promises.push(
						queryClient.invalidateQueries(
							trpc.meetings.getOne.queryOptions({ id: initialValues.id }),
						),
					);
				}

				await Promise.all(promises);
				onSuccess?.();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm<z.infer<typeof meetingsInsertSchema>>({
		resolver: zodResolver(meetingsInsertSchema),
		defaultValues: {
			name: initialValues?.name || "",
			agentId: initialValues?.agentId || "",
		},
	});

	const isEdit = !!initialValues?.id;
	const isPending = createMeeting.isPending || updateMeeting.isPending;

	const onSubmit = (data: z.infer<typeof meetingsInsertSchema>) => {
		if (isEdit) {
			updateMeeting.mutate({ ...data, id: initialValues.id });
		} else {
			createMeeting.mutate(data);
		}
	};

	return (
		<>
			<NewAgentDialog
				open={openNewAgentDialog}
				onOpenChange={setNewAgentDialogOpen}
			/>
			<Form {...form}>
				<form
					className="space-y-4"
					onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						name="name"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="e.g. Math Consultation"></Input>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}></FormField>

					<FormField
						name="agentId"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Agent</FormLabel>
								<FormControl>
									<CommandSelect
										onSelect={field.onChange}
										onSearch={setAgentSearch}
										value={field.value}
										placeholder="Select an agent"
										options={(agents.data?.items ?? []).map((agent) => ({
											id: agent.id,
											value: agent.id,
											children: (
												<div className="flex items-center gap-x-2">
													<GeneratedAvatar
														variant="botttsNeutral"
														seed={agent.name}
														className="border size-6"></GeneratedAvatar>
													<span>{agent.name}</span>
												</div>
											),
										}))}></CommandSelect>
								</FormControl>
								<FormDescription>
									Not found what you&apos;re looking for?{" "}
									<button
										onClick={() => setNewAgentDialogOpen(true)}
										disabled={isPending}
										type="button"
										className="text-primary hover:underline">
										Create new agent
									</button>
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}></FormField>

					<div className="flex justify-between gap-x-2">
						{onCancel && (
							<Button
								variant="ghost"
								disabled={isPending}
								type="button"
								onClick={() => onCancel()}>
								Cancel
							</Button>
						)}

						<Button
							disabled={isPending}
							type="submit"
							className="ml-2">
							{isEdit ? "Update Agent" : "Create Agent"}
							{isPending && (
								<span className="ml-2 loading loading-spinner"></span>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
};
