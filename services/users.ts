import { ensureUserProfile } from "./userService";

export async function createUserDocument(
  uid: string,
  nome: string,
  email: string,
  consentimentoAceito: boolean,
) {
  await ensureUserProfile(uid, email, nome, consentimentoAceito);
}