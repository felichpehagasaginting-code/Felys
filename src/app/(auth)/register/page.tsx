"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { FirestoreService } from "@/lib/firebase/firestore-service";
import { establishSession } from "@/lib/auth-session-client";
import { useDataStore } from "@/stores/use-data-store";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, User, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const regPromise = createUserWithEmailAndPassword(auth, email.trim(), password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Waktu koneksi habis. Periksa koneksi internet kamu.")), 10000)
      );

      const userCredential: any = await Promise.race([regPromise, timeoutPromise]);

      if (name.trim()) {
        await updateProfile(userCredential.user, { displayName: name.trim() });
      }

      await establishSession(userCredential.user);
      // Sync user profile & categories to Firestore
      await Promise.all([
        FirestoreService.syncUserProfile(userCredential.user.uid, {
          id: userCredential.user.uid,
          name: name.trim() || userCredential.user.displayName || "Mahasiswa Felys",
          email: userCredential.user.email || email.trim(),
        }),
        FirestoreService.seedDefaultCategoriesIfEmpty(userCredential.user.uid),
      ]).catch((e) => console.warn("Firestore sync error:", e));

      useDataStore.getState().initFirestoreSync(userCredential.user.uid);

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email ini sudah terdaftar. Silakan login.");
      } else if (err.code === "auth/weak-password") {
        setError("Kata sandi terlalu lemah (minimal 6 karakter).");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError(err.message || "Gagal mendaftar. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await establishSession(userCredential.user);
      await Promise.all([
        FirestoreService.syncUserProfile(userCredential.user.uid, {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || "Mahasiswa Felys",
          email: userCredential.user.email || "",
          photoURL: userCredential.user.photoURL || null,
        }),
        FirestoreService.seedDefaultCategoriesIfEmpty(userCredential.user.uid),
      ]).catch((e) => console.warn("Firestore sync error:", e));

      useDataStore.getState().initFirestoreSync(userCredential.user.uid);

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Google signup error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Provider 'Google' belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method > aktifkan Google.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain 'localhost' belum masuk daftar Authorized Domains di Firebase Console > Authentication > Settings.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Jendela pendaftaran Google ditutup sebelum selesai.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Jendela popup login Google diblokir oleh browser. Izinkan popup untuk localhost.");
      } else {
        setError(err.message || "Gagal mendaftar dengan Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-float space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center mx-auto text-white font-extrabold text-xl shadow-soft">
            F
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Buat Akun Felys
          </h1>
          <p className="text-xs text-muted">
            Mulai atur waktu kuliah dan anggaran keuanganmu dengan AI.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FFE8EA] border border-[#FFA8B0] text-[#D93D4A] text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full h-11 rounded-2xl border border-border bg-surface hover:bg-black/5 text-foreground text-xs font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Daftar Cepat dengan Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-surface px-3 text-[11px] text-muted absolute font-medium uppercase">
            atau isi form
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rian Pratama"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@kampus.ac.id"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-[#FAF9FC] dark:bg-[#2F2B3A] border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#7C5CFA]"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="academic"
            disabled={loading}
            className="w-full h-11 rounded-2xl font-bold mt-2"
          >
            {loading ? "Mendaftarkan..." : "Daftar Akun Baru"}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-muted pt-2 border-t border-border/50">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-[#7C5CFA] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
