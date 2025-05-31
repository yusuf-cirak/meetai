/** @format */

import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { SetStateAction } from "react";
import { Dispatch } from "react";

interface Props {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}>
			<CommandInput placeholder="Find a meeting or agent"></CommandInput>

			<CommandList>
				<CommandItem>Tests</CommandItem>
			</CommandList>
			<CommandEmpty>No results found.</CommandEmpty>
		</CommandDialog>
	);
};
