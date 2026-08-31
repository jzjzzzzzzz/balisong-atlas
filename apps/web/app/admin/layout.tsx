import type { ReactNode } from "react";
import { AdminNav } from "@/components/AdminNav";
export default function AdminLayout({children}:{children:ReactNode}) { return <div className="min-h-screen bg-paper"><AdminNav/><div className="lg:pl-64">{children}</div></div>; }
