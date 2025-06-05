/** @format */

"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useState } from "react";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { MeetingStatusFilter } from "./meeting-status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "../../hooks/use-agents-filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DEFAULT_PAGE } from "@/constants";

export const MeetingsListHeader = () => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [filters, setFilters] = useMeetingsFilters();

	const isAnyFilterModified =
		!!filters.agentId || !!filters.search || !!filters.status;

	const onClearFilters = () => {
		setFilters({
			agentId: "",
			search: "",
			status: null,
			page: DEFAULT_PAGE,
		});
	};

	return (
		<>
			<NewMeetingDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
			/>
			<div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
				<div className="flex items-center justify-between">
					<h5 className="font-medium text-xl">My Meetings</h5>
					<Button onClick={() => setIsDialogOpen(true)}>
						<PlusIcon></PlusIcon>
						New Meeting
					</Button>
				</div>
				<ScrollArea>
					<div className="flex items-center gap-x-2 p-1">
						<MeetingsSearchFilter />
						<MeetingStatusFilter />
						<AgentIdFilter />
						{isAnyFilterModified && (
							<Button
								variant="outline"
								size="sm"
								onClick={onClearFilters}>
								Clear Filters
							</Button>
						)}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</>
	);
};
