/** @format */

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ChevronRightIcon,
	EditIcon,
	MoreVerticalIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";

interface Props {
	agentId: string;
	agentName: string;
	onEdit: () => void;
	onRemove: () => void;
}

export const AgentIdViewHeader = ({
	agentId,
	agentName,
	onEdit,
	onRemove,
}: Props) => {
	return (
		<div className="flex items-center justify-between">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							asChild
							className="font-medium text-xl">
							<Link href={`/agents`}>My Agents</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className="text-foreground text-xl font-medium [&> svg]:size-4">
						<ChevronRightIcon></ChevronRightIcon>
					</BreadcrumbSeparator>
					<BreadcrumbItem>
						<BreadcrumbLink
							asChild
							className="font-medium text-xl text-foreground">
							<Link href={`/agents/${agentId}`}>{agentName}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost">
						<MoreVerticalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={onEdit}>
						<EditIcon className="size-4 text-black"></EditIcon>
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onRemove}>
						<TrashIcon className="size-4 text-black"></TrashIcon>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
