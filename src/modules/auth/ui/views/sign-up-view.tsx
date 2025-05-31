/** @format */

"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const formSchema = z
	.object({
		name: z.string().min(1, { message: "Name is required" }),
		email: z.string().email(),
		password: z.string().min(1, { message: "Password is required" }),
		confirmPassword: z
			.string()
			.min(1, { message: "Confirm password is required" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match",
	});

// components doesn't need default exports. but routes need default exports.
export const SignUpView = () => {
	const router = useRouter();

	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
			name: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setError(null);
		setIsPending(true);

		authClient.signUp.email(
			{
				name: data.name,
				email: data.email,
				password: data.password,
			},
			{
				onSuccess: () => {
					router.push("/");
					setIsPending(false);
				},
				onError: ({ error }) => {
					setError(error.message);
					setIsPending(false);
				},
			},
		);
	};

	return (
		<div className="flex flex-col gap-6">
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="p-6 md:p-8">
							<div className="flex flex-col gap-6">
								<div className="flex flex-col items-center text-center">
									<h1 className="text-2xl font-bold">Let&apos;s get started</h1>
									<p className="text-muted-foreground text-balance">
										Create an account to continue
									</p>
								</div>

								<div className="grid gap-3">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Name</FormLabel>
												<FormControl>
													<Input
														type="text"
														placeholder="John Doe"
														{...field}></Input>
												</FormControl>
												<FormMessage></FormMessage>
											</FormItem>
										)}></FormField>
								</div>
								<div className="grid gap-3">
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="m@example.com"
														{...field}></Input>
												</FormControl>
												<FormMessage></FormMessage>
											</FormItem>
										)}></FormField>
								</div>
								<div className="grid gap-3">
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="********"
														{...field}></Input>
												</FormControl>
												<FormMessage></FormMessage>
											</FormItem>
										)}></FormField>
								</div>
								<div className="grid gap-3">
									<FormField
										control={form.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirm Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="********"
														{...field}></Input>
												</FormControl>
												<FormMessage></FormMessage>
											</FormItem>
										)}></FormField>
								</div>
								{!!error && (
									<Alert className="bg-destructive/10 border-none">
										<OctagonAlertIcon className="h-4 w-4 !text-destructive"></OctagonAlertIcon>
										<AlertTitle>Error</AlertTitle>
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
								<Button
									disabled={isPending}
									type="submit"
									className="w-full">
									Register
								</Button>
								<div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
									<span className="bg-card text-muted-foreground relative z-10 px-2">
										Or continue with
									</span>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<Button
										disabled={isPending}
										variant="outline"
										type="button"
										className="w-full">
										Google
									</Button>
									<Button
										disabled={isPending}
										variant="outline"
										type="button"
										className="w-full">
										Facebook
									</Button>
								</div>
								<div className="text-center text-sm">
									Already have an account?{" "}
									<Link
										href="/sign-in"
										className="underline underline-offset-4">
										Sign In
									</Link>
								</div>
							</div>
						</form>
					</Form>
					<div className="bg-radial from-green-700 to-green-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
						<img
							src="/logo.svg"
							alt="logo"
							className="h-[92px] w-[92px] object-contain"
						/>
						<p className="text-2xl font-semibold text-white">Meet.AI</p>
					</div>
				</CardContent>
			</Card>
			<div className="text-muted-foreground *: [a]:hover:text-primary text-center text-xs text-balance *: [a]:underline *:[a]:underline-offset-4">
				By clicking continue, you aggre to our <a href="#">Terms of Service</a>{" "}
				and <a href="#">Privacy Policy</a>
			</div>
		</div>
	);
};
