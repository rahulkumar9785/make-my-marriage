import { requireAccount, publicWedding } from "@/lib/server/auth";
import { endpoint, json } from "@/lib/server/http";
export const GET = endpoint(async () => {
  const account = await requireAccount();
  return json({
    user: account.user,
    membership: account.membership,
    wedding: publicWedding(account.wedding),
  });
});
