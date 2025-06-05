/** @format */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { MeetingGetMany, MeetingStatus } from "../../types";
import { format } from "date-fns";
import { meetingStatusValues } from "@/db/schema";
import humanizeDuration from "humanize-duration";
import {
	CircleCheckIcon,
	CircleXIcon,
	ClockArrowUpIcon,
	ClockFadingIcon,
	CornerDownRightIcon,
	LoaderIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
type Meeting = MeetingGetMany[number];

const meetingStatusIconMap: Record<MeetingStatus, React.ElementType> = {
	upcoming: ClockArrowUpIcon,
	active: LoaderIcon,
	completed: CircleCheckIcon,
	processing: LoaderIcon,
	cancelled: CircleXIcon,
};

const meetingStatusColorMap: Record<MeetingStatus, string> = {
	upcoming: "bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
	active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
	completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
	processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
	cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
};

export const columns: ColumnDef<Meeting>[] = [
	{
		accessorKey: "name",
		header: "Meeting Name",
		cell: ({ row }) => {
			return (
				<div className="flex flex-col gap-y-1">
					<span className="font-semibold capitalize">{row.original.name}</span>
					<div className="flex items-center gap-x-2">
						<div className="flex items-center gap-x-1.5">
							<CornerDownRightIcon className="size-3 text-muted-foreground"></CornerDownRightIcon>
							<span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
								{row.original.agent.name}
							</span>
						</div>
						<GeneratedAvatar
							variant="botttsNeutral"
							seed={row.original.agent.name}
							className="size-4"></GeneratedAvatar>
						<span className="text-sm text-muted-foreground">
							{row.original.startedAt
								? format(row.original.startedAt, "MMM d")
								: ""}
						</span>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const Icon = meetingStatusIconMap[row.original.status];
			return (
				<Badge
					variant="outline"
					className={cn(
						"capitalize [&> svg]:size-4 text-muted-foreground",
						meetingStatusColorMap[row.original.status],
					)}>
					<Icon
						className={cn(
							row.original.status === "processing" && "animate-spin",
						)}></Icon>
					{row.original.status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "duration",
		header: "Duration",
		cell: ({ row }) => {
			return (
				<>
					<Badge
						variant="outline"
						className={cn("capitalize [&> svg]:size-4 text-muted-foreground")}>
						<ClockFadingIcon className="text-blue-700"></ClockFadingIcon>
						{row.original.duration
							? formatDuration(row.original.duration)
							: "No duration"}
					</Badge>
				</>
			);
		},
	},
];

function formatDuration(seconds: number) {
	return humanizeDuration(seconds * 1000, {
		largest: 1,
		round: true,
		units: ["h", "m", "s"],
	});
}
