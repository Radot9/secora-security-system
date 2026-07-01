


export function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  let password = "Secora-";

  for (let i = 0; i < length - 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}