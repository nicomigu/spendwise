import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { accountsApi, type Account } from "@/api/accounts.api";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT", "INVESTMENT", "CASH"]),
  currency: z.string().min(1, "Currency is required"),
});

type CreateForm = z.infer<typeof createSchema>;

const typeLabels: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT: "Credit",
  INVESTMENT: "Investment",
  CASH: "Cash",
};

const typeColors: Record<string, string> = {
  CHECKING: "bg-blue-100 text-blue-800",
  SAVINGS: "bg-green-100 text-green-800",
  CREDIT: "bg-red-100 text-red-800",
  INVESTMENT: "bg-purple-100 text-purple-800",
  CASH: "bg-slate-100 text-slate-800",
};

function AccountCard({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {account.name}
          </CardTitle>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[account.type]}`}
          >
            {typeLabels[account.type]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-slate-900">
          {account.currency}{" "}
          {parseFloat(account.balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Created {new Date(account.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  });

  const form = useForm<CreateForm, any, CreateForm>({
    resolver: zodResolver(createSchema) as Resolver<CreateForm>,
    defaultValues: {
      name: "",
      type: "CHECKING",
      currency: "USD",
    },
  });

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created");
      form.reset();
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to create account"),
  });

  const onSubmit = (data: CreateForm) => {
    createMutation.mutate(data);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Accounts</h2>
            <p className="text-slate-500">{accounts?.length ?? 0} accounts</p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>New Account</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account name</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Checking" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(typeLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="USD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending
                        ? "Creating..."
                        : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Accounts grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : accounts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-slate-900">
              No accounts yet
            </p>
            <p className="text-slate-500">
              Add your first account to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
