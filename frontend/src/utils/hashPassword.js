// hashPassword.js
// Purpose: SHA-256 hashing using browser's built-in crypto API — password kabhi plain text mein network pe ya DevTools mein nahi dikhega.
// Agar crypto.subtle available na ho (HTTP environments jaise dev), to plain password fallback ke roop mein bhejta hai.

export async function hashPassword(password) {
  // Check karo crypto.subtle available hai ya nahi (sirf HTTPS/localhost pe hoti hai)
  if (!window.crypto || !window.crypto.subtle) {
    console.warn('crypto.subtle not available (HTTP environment) — sending password without client-side hashing.');
    return password;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}