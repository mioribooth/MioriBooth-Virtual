import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";
import FiltersClient from "./FiltersClient";

export default async function FiltersPage() {
  const vendorToken = await getVendorFromCookies();
  if (!vendorToken) redirect("/dashboard/login");

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorToken.vendorId } });
  if (!vendor) redirect("/dashboard/login");

  return (
    <div className="admin-shell">
      <AdminTopbar vendorName={vendor.name} />
      <FiltersClient />
    </div>
  );
}
