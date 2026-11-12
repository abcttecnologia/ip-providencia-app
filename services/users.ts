import { ensureUserProfile } from "./userService";

export async function createUserDocument(
  uid: string,
  nome: string,
  email: string
) {
  await ensureUserProfile(uid, email, nome);
}