import { connection } from "next/server";
import { getResults } from "@/lib/results";

export async function GET() {
  await connection();
  return Response.json(await getResults(), { headers: { "Cache-Control": "no-store" } });
}
