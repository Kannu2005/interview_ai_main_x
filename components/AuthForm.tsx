"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Fixed import path
import { auth } from "@/firebase/client";

// Firebase Auth methods
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// Backend actions
import { signIn, signUp } from "@/lib/actions/auth.action";

// UI Components
import FormField from "./FormField";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

// Validation schema generator
const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const isSignIn = type === "sign-in";

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        // ✅ Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ Save user to Firestore via backend
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          console.error("signUp backend failed:", result.message);
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");

      } else {
        const { email, password } = data;

        // ✅ Auth with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        if (!idToken) {
          toast.error("Sign in failed. Please try again.");
          return;
        }

        // ✅ Call backend to set session cookie
        const result = await signIn({ email, idToken });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Signed in successfully.");
        router.refresh();
        router.replace("/");
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            window.location.assign("/");
          }
        }, 400);
      }
    } catch (error: any) {
      console.log(error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Try signing in.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("No account found. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password.");
      } else {
        toast.error(`Error: ${error.message || error}`);
      }
    }
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Full Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter a secure password"
              type="password"
            />

            <Button className="btn w-full" type="submit">
              {isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account?"}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-bold text-user-primary ml-1"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
