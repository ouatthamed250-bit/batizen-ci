"use client";

import { useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User,
} from "firebase/auth";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    if (!hasFirebaseConfig()) { return; }
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, phoneNumber: u.phoneNumber } : null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export async function loginWithEmail(email: string, password: string) {
  const { auth } = getFirebaseServices();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string, name: string) {
  const { auth } = getFirebaseServices();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
}

export async function loginWithGoogle() {
  const { auth, googleProvider } = getFirebaseServices();
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithPhone(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  const { auth } = getFirebaseServices();
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function resetPassword(email: string) {
  const { auth } = getFirebaseServices();
  return sendPasswordResetEmail(auth, email);
}


export function checkPasswordStrength(password: string): { strength: 'weak' | 'medium' | 'strong'; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Au moins 8 caractères");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push("Majuscules et minuscules");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Au moins un chiffre");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Au moins un caractère spécial");

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 3) strength = 'medium';
  if (score === 4) strength = 'strong';

  return { strength, score, feedback };
}
