export const isEmail = (s: string) => {
  const r = new RegExp(".+@.+")
  return r.test(s)
}
