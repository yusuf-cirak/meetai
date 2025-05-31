/** @format */

import { GeneratedAvatar } from "@/components/generated-avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const DashboardUserButton = () => {
	const router = useRouter();
	const isMobile = useIsMobile();
	const { data, isPending } = authClient.useSession.get();
	if (isPending || !data?.user) {
		return null;
	}

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/sign-in");
				},
			},
		});
	};

	if (isMobile) {
		return (
			<Drawer>
				<DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
					{data.user.image ? (
						<Avatar>
							<AvatarImage src={data.user.image}></AvatarImage>
						</Avatar>
					) : (
						<GeneratedAvatar
							seed={data.user.name}
							variant="initials"
							className="size-9 mr-3"></GeneratedAvatar>
					)}
					<div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
						<p className="text-sm truncate w-full">{data.user.name}</p>
						<p className="text-xs truncate w-full">{data.user.email}</p>
					</div>
					<ChevronDownIcon className="size-4 shrink-0"></ChevronDownIcon>
				</DrawerTrigger>

				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{data.user.name}</DrawerTitle>
						<DrawerDescription>{data.user.email}</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter>
						<Button
							variant="outline"
							onClick={() => ({})}>
							<CreditCardIcon className="size-4 text-black"></CreditCardIcon>
							Billing
						</Button>
						<Button
							variant="outline"
							onClick={onLogout}>
							<LogOutIcon className="size-4 text-black"></LogOutIcon>
							Logout
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
					{data.user.image ? (
						<Avatar>
							<AvatarImage src={data.user.image}></AvatarImage>
						</Avatar>
					) : (
						<GeneratedAvatar
							seed={data.user.name}
							variant="initials"
							className="size-9 mr-3"></GeneratedAvatar>
					)}
					<div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
						<p className="text-sm truncate w-full">{data.user.name}</p>
						<p className="text-xs truncate w-full">{data.user.email}</p>
					</div>
					<ChevronDownIcon className="size-4 shrink-0"></ChevronDownIcon>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					side="right"
					className="w-72">
					<DropdownMenuLabel className="flex flex-col gap-1">
						<span className="font-medium truncate">{data.user.name}</span>
						<span className="text-sm font-normal text-muted-foreground truncate">
							{data.user.email}
						</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem className="cursor-pointer flex items-center justify-between">
						Billing
						<CreditCardIcon className="size-4"></CreditCardIcon>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer flex items-center justify-between"
						onClick={onLogout}>
						Logout
						<LogOutIcon className="size-4"></LogOutIcon>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
