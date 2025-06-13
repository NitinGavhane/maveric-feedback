"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
// Remove ADMIN_EMAIL and ADMIN_PASSWORD imports if using Firebase Auth
// import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/config/site";
import { Loader2, LogIn } from "lucide-react";

// Import Firebase auth
import { auth } from "@/lib/firebase"; // Assuming you exported auth in firebase.ts
import { signInWithEmailAndPassword } from "firebase/auth"; // Import the auth function

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."), // Firebase Auth usually requires min 6 chars
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) { // Make onSubmit async
    startTransition(async () => { // Start transition with async function
      try {
        // Use Firebase Authentication to sign in
        await signInWithEmailAndPassword(auth, data.email, data.password);

        // If sign-in is successful
        // Replace this with proper Firebase auth state management later
        localStorage.setItem('isAdminAuthenticated', 'true');
        toast({
          title: "Login Successful",
          description: "Redirecting to admin dashboard...",
        });
        router.push("/admin/dashboard");

      } catch (error) {
        // Handle login errors
        console.error("Firebase Login Error:", error);
        let errorMessage = "Login failed. Please check your credentials.";
        // You can add more specific error handling based on Firebase Auth error codes
        // if (error.code === 'auth/user-not-found') { errorMessage = 'No user found with this email.'; }
        // if (error.code === 'auth/wrong-password') { errorMessage = 'Incorrect password.'; }


        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  {...field}
                  className="w-full h-10 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="w-full h-10 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-5 rounded-lg" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          Log In
        </Button>
      </form>
    </Form>
  );
}
