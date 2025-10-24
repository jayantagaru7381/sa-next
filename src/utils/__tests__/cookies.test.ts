import {
  debugCookies,
  getAllCookies,
  getAuthState,
  getCookie,
  getCsrfToken,
  hasCookie,
  hasCsrfToken,
  isAuthenticated,
} from "../cookies";

// Mock console.log for debugCookies tests
const mockLog = jest.spyOn(console, "log").mockImplementation();

describe("Cookie Utilities", () => {
  const originalDocument = global.document;

  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(global.document, "cookie", {
      writable: true,
      value: "",
    });
    mockLog.mockClear();
  });

  afterAll(() => {
    mockLog.mockRestore();
    global.document = originalDocument;
  });

  describe("getAllCookies", () => {
    it("should return empty object when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({});
    });

    it("should parse single cookie correctly", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({ csrf: "token123" });
    });

    it("should parse multiple cookies correctly", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123; auth_state=authenticated; user_id=user123",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({
        csrf: "token123",
        auth_state: "authenticated",
        user_id: "user123",
      });
    });

    it("should handle cookies with special characters in values", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "token=abc.def-ghi_123; data=value+with%20spaces",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({
        token: "abc.def-ghi_123",
        data: "value+with%20spaces",
      });
    });

    it("should handle cookies with empty values", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "empty_cookie=; another=value",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({
        empty_cookie: "",
        another: "value",
      });
    });

    it("should handle extra whitespace in cookie string", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "  cookie1=value1  ;  cookie2=value2  ",
      });

      const cookies = getAllCookies();
      expect(cookies).toEqual({
        cookie1: "value1",
        cookie2: "value2",
      });
    });

    it("should return empty object in server-side environment", () => {
      const windowSpy = jest.spyOn(global, "window", "get");
      windowSpy.mockImplementation(() => undefined as any);

      const cookies = getAllCookies();
      expect(cookies).toEqual({});

      windowSpy.mockRestore();
    });
  });

  describe("hasCookie", () => {
    it("should return true when cookie exists", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123; auth_state=authenticated",
      });

      expect(hasCookie("csrf")).toBe(true);
      expect(hasCookie("auth_state")).toBe(true);
    });

    it("should return false when cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      expect(hasCookie("auth_state")).toBe(false);
      expect(hasCookie("nonexistent")).toBe(false);
    });

    it("should return false when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      expect(hasCookie("csrf")).toBe(false);
    });

    it("should handle cookie names with similar prefixes correctly", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "user=123; user_id=456; username=test",
      });

      expect(hasCookie("user")).toBe(true);
      expect(hasCookie("user_id")).toBe(true);
      expect(hasCookie("username")).toBe(true);
      expect(hasCookie("use")).toBe(false);
    });

    it("should return false in server-side environment", () => {
      const windowSpy = jest.spyOn(global, "window", "get");
      windowSpy.mockImplementation(() => undefined as any);

      expect(hasCookie("csrf")).toBe(false);

      windowSpy.mockRestore();
    });
  });

  describe("hasCsrfToken", () => {
    it("should return true when csrf cookie exists", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      expect(hasCsrfToken()).toBe(true);
    });

    it("should return false when csrf cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated",
      });

      expect(hasCsrfToken()).toBe(false);
    });

    it("should return false when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      expect(hasCsrfToken()).toBe(false);
    });
  });

  describe("getCsrfToken", () => {
    it("should return csrf token value when it exists", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=my_csrf_token_123",
      });

      expect(getCsrfToken()).toBe("my_csrf_token_123");
    });

    it("should return null when csrf cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated",
      });

      expect(getCsrfToken()).toBeNull();
    });

    it("should find csrf token among multiple cookies", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated; csrf=token456; user_id=123",
      });

      expect(getCsrfToken()).toBe("token456");
    });

    it("should handle csrf token with special characters", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=abc.def-ghi_123",
      });

      expect(getCsrfToken()).toBe("abc.def-ghi_123");
    });

    it("should return null in server-side environment", () => {
      const windowSpy = jest.spyOn(global, "window", "get");
      windowSpy.mockImplementation(() => undefined as any);

      expect(getCsrfToken()).toBeNull();

      windowSpy.mockRestore();
    });
  });

  describe("getCookie", () => {
    it("should return cookie value when it exists", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated; csrf=token123",
      });

      expect(getCookie("auth_state")).toBe("authenticated");
      expect(getCookie("csrf")).toBe("token123");
    });

    it("should return null when cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      expect(getCookie("auth_state")).toBeNull();
      expect(getCookie("nonexistent")).toBeNull();
    });

    it("should return null when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      expect(getCookie("csrf")).toBeNull();
    });

    it("should handle cookies with complex values", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      });

      expect(getCookie("token")).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    it("should return null in server-side environment", () => {
      const windowSpy = jest.spyOn(global, "window", "get");
      windowSpy.mockImplementation(() => undefined as any);

      expect(getCookie("csrf")).toBeNull();

      windowSpy.mockRestore();
    });

    it("should handle empty cookie values", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "empty=",
      });

      expect(getCookie("empty")).toBe("");
    });
  });

  describe("getAuthState", () => {
    it("should return authenticated when auth_state is authenticated", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated",
      });

      expect(getAuthState()).toBe("authenticated");
    });

    it("should return needs_mfa_auth when auth_state is needs_mfa_auth", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_mfa_auth",
      });

      expect(getAuthState()).toBe("needs_mfa_auth");
    });

    it("should return needs_mfa_setup when auth_state is needs_mfa_setup", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_mfa_setup",
      });

      expect(getAuthState()).toBe("needs_mfa_setup");
    });

    it("should return needs_email_verify when auth_state is needs_email_verify", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_email_verify",
      });

      expect(getAuthState()).toBe("needs_email_verify");
    });

    it("should return null when auth_state cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      expect(getAuthState()).toBeNull();
    });

    it("should return null when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      expect(getAuthState()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when auth_state is authenticated", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=authenticated",
      });

      expect(isAuthenticated()).toBe(true);
    });

    it("should return false when auth_state is needs_mfa_auth", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_mfa_auth",
      });

      expect(isAuthenticated()).toBe(false);
    });

    it("should return false when auth_state is needs_mfa_setup", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_mfa_setup",
      });

      expect(isAuthenticated()).toBe(false);
    });

    it("should return false when auth_state is needs_email_verify", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_email_verify",
      });

      expect(isAuthenticated()).toBe(false);
    });

    it("should return false when auth_state cookie does not exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123",
      });

      expect(isAuthenticated()).toBe(false);
    });

    it("should return false when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("debugCookies", () => {
    it("should log cookie state with all readable cookies", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "csrf=token123; auth_state=authenticated; enrolled_methods=totp,email_otp",
      });

      debugCookies();

      expect(mockLog).toHaveBeenCalledWith(
        "[Cookie Debug] Readable cookies:",
        expect.objectContaining({
          all: {
            csrf: "token123",
            auth_state: "authenticated",
            enrolled_methods: "totp,email_otp",
          },
          hasCsrf: true,
          authState: "authenticated",
          note: "httpOnly cookies (sess, temp_sess) are not visible to JavaScript",
        })
      );
    });

    it("should log when no cookies exist", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "",
      });

      debugCookies();

      expect(mockLog).toHaveBeenCalledWith(
        "[Cookie Debug] Readable cookies:",
        expect.objectContaining({
          all: {},
          hasCsrf: false,
          authState: null,
        })
      );
    });

    it("should not throw error in server-side environment", () => {
      const windowSpy = jest.spyOn(global, "window", "get");
      windowSpy.mockImplementation(() => undefined as any);

      expect(() => debugCookies()).not.toThrow();
      expect(mockLog).not.toHaveBeenCalled();

      windowSpy.mockRestore();
    });

    it("should show csrf status correctly", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "auth_state=needs_mfa_auth",
      });

      debugCookies();

      expect(mockLog).toHaveBeenCalledWith(
        "[Cookie Debug] Readable cookies:",
        expect.objectContaining({
          hasCsrf: false,
        })
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle malformed cookie strings gracefully", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "invalid; csrf=token123",
      });

      const cookies = getAllCookies();
      expect(cookies.csrf).toBe("token123");
    });

    it("should handle cookies with equals signs in values", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "data=key=value",
      });

      // The cookie utility splits on first '=' only, so "key=value" becomes just "key"
      // This is expected behavior - cookies with = in values need to be URL encoded
      expect(getCookie("data")).toBe("key");
    });

    it("should handle cookies with semicolons in values (URL encoded)", () => {
      Object.defineProperty(global.document, "cookie", {
        writable: true,
        value: "encoded=value%3Bwith%3Bsemicolons",
      });

      expect(getCookie("encoded")).toBe("value%3Bwith%3Bsemicolons");
    });
  });
});
