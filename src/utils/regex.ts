export const isEmail = (s: string): boolean => {
  const r = new RegExp(".+@.+")
  return r.test(s)
}
