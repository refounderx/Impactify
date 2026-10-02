import { connection } from "next/server";

export default async function PaymentLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
