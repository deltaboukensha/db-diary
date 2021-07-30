import "jest"
import { isEmail } from "./regex"

describe("regex", () => {
  describe("isEmail", () => {
    it("positive 1", async () => {
      const actual = isEmail("abc@abc.com")
      const expected = true
      expect(actual).toBe(expected)
    })
  })
})
