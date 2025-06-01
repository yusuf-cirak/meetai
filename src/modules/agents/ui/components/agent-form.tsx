"use client";
import { AgentGetOne } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

interface AgentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: AgentGetOne;
}


export const AgentForm = ({ onSuccess, onCancel, initialValues }: AgentFormProps) => {

    const trpc = useTRPC();

    const queryClient = useQueryClient();


    const createAgent = useMutation(trpc.agents.create.mutationOptions({
        onSuccess: async () => {

            const promises = [
                queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({})),]
            if (initialValues?.id) {
               promises.push(queryClient.invalidateQueries(trpc.agents.getOne.queryOptions({ id: initialValues.id })));
            }

            await Promise.all(promises);
            onSuccess?.();
        }, onError: (error) => {
            toast.error(error.message)
        }
    }))


    const form = useForm<z.infer<typeof agentsInsertSchema>>({
        resolver: zodResolver(agentsInsertSchema),
        defaultValues: {
            name: initialValues?.name || "",
            instructions: initialValues?.instructions || ""
        }
    });

    const isEdit = !!initialValues?.id;
    const isPending = createAgent.isPending;


    const onSubmit = (data: z.infer<typeof agentsInsertSchema>) => {
        if (isEdit) {

        } else {
            createAgent.mutate(data)
        }
    }





    return (
        <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <GeneratedAvatar seed={form.watch("name")} variant="botttsNeutral" className="border size-16"></GeneratedAvatar>

                <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. Math Scientiest"></Input>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}></FormField>

                <FormField name="instructions" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                            <Textarea {...field} placeholder="You are a math scientiest graduated from the MIT."></Textarea>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}></FormField>

                <div className="flex justify-between gap-x-2">
                    {onCancel && (
                        <Button variant="ghost" disabled={isPending} type="button" onClick={() => onCancel()}>Cancel</Button>
                    )}

                    <Button disabled={isPending} type="submit" className="ml-2">
                        {isEdit ? "Update Agent" : "Create Agent"}
                        {isPending && <span className="ml-2 loading loading-spinner"></span>}
                    </Button>
                </div>
            </form>
        </Form>
    )

};